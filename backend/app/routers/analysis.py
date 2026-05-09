from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
import calendar
import numpy as np
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

# Python weekday: Mon=0 ... Sat=5, Sun=6
WEEKDAY_KO = {0: "월", 1: "화", 2: "수", 3: "목", 4: "금", 5: "토", 6: "일"}


def safe_avg(lst):
    filtered = [v for v in lst if v > 0]
    return round(sum(filtered) / len(filtered)) if filtered else 0


def calc_trend(values: list) -> str:
    non_zero = [(i, v) for i, v in enumerate(values) if v > 0]
    if len(non_zero) < 2:
        return "데이터 부족"
    indices = np.array([x[0] for x in non_zero], dtype=float)
    vals = np.array([x[1] for x in non_zero], dtype=float)
    slope = np.polyfit(indices, vals, 1)[0]
    avg = vals.mean()
    pct = (slope * (len(values) - 1) / avg * 100) if avg > 0 else 0
    if pct > 5:
        return "증가"
    elif pct < -5:
        return "감소"
    return "유지"


def get_height_bucket(height: float) -> int:
    """키를 5cm 단위 버킷으로 변환 (예: 167 → 165)"""
    return int(height // 5) * 5

def get_weight_bucket(weight: float) -> int:
    """몸무게를 5kg 단위 버킷으로 변환 (예: 67 → 65)"""
    return int(weight // 5) * 5

def get_age_bucket(age: int) -> int:
    """나이를 5세 단위 버킷으로 변환 (예: 23 → 20)"""
    return int(age // 5) * 5


def get_cluster_comparison(db: Session, current_user_id: int) -> dict:
    """키/몸무게/나이/성별/목표가 같은 그룹의 30일 평균과 비교."""
    thirty_days_ago = date.today() - timedelta(days=30)

    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not current_user:
        return {"cluster_avg_water": 0, "cluster_avg_protein": 0,
                "cluster_avg_exercise": 0, "cluster_size": 0, "cluster_label": "데이터 없음"}

    # 나의 버킷 기준값
    my_height_bucket = get_height_bucket(current_user.height_cm or 170)
    my_weight_bucket = get_weight_bucket(current_user.weight_kg or 65)
    my_age_bucket    = get_age_bucket(current_user.age or 25)
    my_gender        = current_user.gender
    my_goal          = current_user.goal

    # 같은 그룹 사용자 필터링 (나 제외)
    same_group_users = (
        db.query(models.User)
        .filter(
            models.User.id != current_user_id,
            models.User.goal == my_goal,
            models.User.gender == my_gender,
        )
        .all()
    )

    # 버킷 범위 내에 있는 사용자만 추출
    group_user_ids = [
        u.id for u in same_group_users
        if get_height_bucket(u.height_cm or 170) == my_height_bucket
        and get_weight_bucket(u.weight_kg or 65) == my_weight_bucket
        and get_age_bucket(u.age or 25) == my_age_bucket
    ]

    GENDER_LABEL = {"male": "남", "female": "여"}
    GOAL_LABEL = {"muscle_gain": "근육증량", "weight_loss": "체중감량"}
    cluster_label = (
        f"{GENDER_LABEL.get(my_gender, my_gender)} · "
        f"{GOAL_LABEL.get(my_goal, my_goal)} · "
        f"키 {my_height_bucket}~{my_height_bucket+4}cm · "
        f"몸무게 {my_weight_bucket}~{my_weight_bucket+4}kg · "
        f"나이 {my_age_bucket}~{my_age_bucket+4}세"
    )

    fallback = {
        "cluster_avg_water": 0, "cluster_avg_protein": 0,
        "cluster_avg_strength": 0, "cluster_avg_cardio": 0,
        "cluster_size": 0, "cluster_label": cluster_label,
    }

    if not group_user_ids:
        return fallback

    # 그룹 내 30일 평균 계산
    rows = (
        db.query(
            func.avg(models.DailyRecord.water_ml).label("avg_water"),
            func.avg(models.DailyRecord.protein_g).label("avg_protein"),
            func.avg(models.DailyRecord.strength_min).label("avg_strength"),
            func.avg(models.DailyRecord.cardio_min).label("avg_cardio"),
            func.count(func.distinct(models.DailyRecord.user_id)).label("user_count"),
        )
        .filter(
            models.DailyRecord.date >= thirty_days_ago,
            models.DailyRecord.user_id.in_(group_user_ids),
        )
        .first()
    )

    if not rows or rows.user_count == 0:
        return fallback

    return {
        "cluster_avg_water":    round(rows.avg_water or 0),
        "cluster_avg_protein":  round(rows.avg_protein or 0),
        "cluster_avg_strength": round(rows.avg_strength or 0),
        "cluster_avg_cardio":   round(rows.avg_cardio or 0),
        "cluster_size":         int(rows.user_count),
        "cluster_label":        cluster_label,
    }


@router.get("/weekly", response_model=schemas.WeeklyResponse)
def get_weekly(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    # 이번 주 일요일(0) ~ 토요일(6)
    days_since_sunday = (today.weekday() + 1) % 7  # Mon=1, ..., Sun=0
    sunday = today - timedelta(days=days_since_sunday)
    days = [sunday + timedelta(days=i) for i in range(7)]

    records_map = {
        r.date: r
        for r in db.query(models.DailyRecord)
        .filter(
            models.DailyRecord.user_id == current_user.id,
            models.DailyRecord.date >= days[0],
            models.DailyRecord.date <= days[6],
        )
        .all()
    }

    labels, water, protein, strength, cardio = [], [], [], [], []
    for d in days:
        labels.append(WEEKDAY_KO[d.weekday()])
        r = records_map.get(d)
        water.append(r.water_ml if r else 0)
        protein.append(float(r.protein_g) if r else 0.0)
        strength.append(r.strength_min if r else 0)
        cardio.append(r.cardio_min if r else 0)

    exercise = [s + c for s, c in zip(strength, cardio)]
    cluster = get_cluster_comparison(db, current_user.id)

    return {
        "labels": labels,
        "water": water,
        "protein": protein,
        "strength": strength,
        "cardio": cardio,
        "avg_water": safe_avg(water),
        "avg_protein": safe_avg(protein),
        "avg_strength": safe_avg(strength),
        "avg_cardio": safe_avg(cardio),
        "water_trend": calc_trend(water),
        "protein_trend": calc_trend(protein),
        "exercise_trend": calc_trend(exercise),
        **cluster,
    }


@router.get("/monthly", response_model=schemas.WeeklyResponse)
def get_monthly(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()

    # 최근 6개월 목록 (과거 → 현재)
    months = []
    for i in range(5, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        months.append((y, m))

    labels, water, protein, strength, cardio = [], [], [], [], []

    for y, m in months:
        first_day = date(y, m, 1)
        last_day  = date(y, m, calendar.monthrange(y, m)[1])

        records = (
            db.query(models.DailyRecord)
            .filter(
                models.DailyRecord.user_id == current_user.id,
                models.DailyRecord.date >= first_day,
                models.DailyRecord.date <= last_day,
            )
            .all()
        )

        labels.append(f"{m}월")
        if records:
            n = len(records)
            water.append(round(sum(r.water_ml     for r in records) / n))
            protein.append(round(sum(r.protein_g   for r in records) / n, 1))
            strength.append(round(sum(r.strength_min for r in records) / n))
            cardio.append(round(sum(r.cardio_min   for r in records) / n))
        else:
            water.append(0)
            protein.append(0.0)
            strength.append(0)
            cardio.append(0)

    exercise = [s + c for s, c in zip(strength, cardio)]
    cluster  = get_cluster_comparison(db, current_user.id)

    return {
        "labels":       labels,
        "water":        water,
        "protein":      protein,
        "strength":     strength,
        "cardio":       cardio,
        "avg_water":    safe_avg(water),
        "avg_protein":  safe_avg(protein),
        "avg_strength": safe_avg(strength),
        "avg_cardio":   safe_avg(cardio),
        "water_trend":    calc_trend(water),
        "protein_trend":  calc_trend(protein),
        "exercise_trend": calc_trend(exercise),
        **cluster,
    }
