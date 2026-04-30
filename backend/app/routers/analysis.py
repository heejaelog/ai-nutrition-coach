from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
import numpy as np
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

WEEKDAY_KO = ["월", "화", "수", "목", "금", "토", "일"]


def safe_avg(lst):
    filtered = [v for v in lst if v > 0]
    return round(sum(filtered) / len(filtered)) if filtered else 0


def calc_trend(values: list[int]) -> str:
    """7일 데이터의 선형 추세를 계산해 '증가' / '감소' / '유지' 반환"""
    non_zero = [(i, v) for i, v in enumerate(values) if v > 0]
    if len(non_zero) < 2:
        return "데이터 부족"
    indices = np.array([x[0] for x in non_zero], dtype=float)
    vals = np.array([x[1] for x in non_zero], dtype=float)
    slope = np.polyfit(indices, vals, 1)[0]
    avg = vals.mean()
    pct = (slope * 6 / avg * 100) if avg > 0 else 0  # 7일간 예상 변화율(%)
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
    my_height_bucket = get_height_bucket(current_user.height or 170)
    my_weight_bucket = get_weight_bucket(current_user.weight or 65)
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
        if get_height_bucket(u.height or 170) == my_height_bucket
        and get_weight_bucket(u.weight or 65) == my_weight_bucket
        and get_age_bucket(u.age or 25) == my_age_bucket
    ]

    cluster_label = (
        f"{my_gender} · {my_goal} · "
        f"키 {my_height_bucket}~{my_height_bucket+4}cm · "
        f"몸무게 {my_weight_bucket}~{my_weight_bucket+4}kg · "
        f"나이 {my_age_bucket}~{my_age_bucket+4}세"
    )

    fallback = {
        "cluster_avg_water": 0, "cluster_avg_protein": 0,
        "cluster_avg_strength": 0, "cluster_avg_cardio": 0,
        "cluster_avg_exercise": 0, "cluster_size": 0,
        "cluster_label": cluster_label,
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
        "cluster_avg_exercise": round((rows.avg_strength or 0) + (rows.avg_cardio or 0)),
        "cluster_size":         int(rows.user_count),
        "cluster_label":        cluster_label,
    }


@router.get("/weekly", response_model=schemas.WeeklyResponse)
def get_weekly(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    days = [today - timedelta(days=6 - i) for i in range(7)]

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
        protein.append(r.protein_g if r else 0)
        strength.append(r.strength_min if r else 0)
        cardio.append(r.cardio_min if r else 0)

    # 전체 사용자 평균 (최근 7일)
    week_ago = today - timedelta(days=7)
    global_avg = (
        db.query(
            func.avg(models.DailyRecord.water_ml).label("water"),
            func.avg(models.DailyRecord.protein_g).label("protein"),
        )
        .filter(models.DailyRecord.date >= week_ago)
        .first()
    )

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
        "global_avg_water": round(global_avg.water or 0),
        "global_avg_protein": round(global_avg.protein or 0),
        # 시계열 추세
        "water_trend": calc_trend(water),
        "protein_trend": calc_trend(protein),
        "exercise_trend": calc_trend(exercise),
        # 클러스터링
        **cluster,
    }


@router.get("/monthly", response_model=dict)
def get_monthly(
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    y = year or today.year
    m = month or today.month

    records = (
        db.query(models.DailyRecord)
        .filter(
            models.DailyRecord.user_id == current_user.id,
            func.year(models.DailyRecord.date) == y,
            func.month(models.DailyRecord.date) == m,
        )
        .all()
    )

    data = {}
    for r in records:
        score = min(
            round(
                (r.water_ml / current_user.water_goal if current_user.water_goal else 0) * 33 +
                (r.protein_g / current_user.protein_goal if current_user.protein_goal else 0) * 33 +
                ((r.strength_min + r.cardio_min) /
                 (current_user.strength_goal + current_user.cardio_goal)
                 if (current_user.strength_goal + current_user.cardio_goal) else 0) * 34
            ),
            100,
        )
        data[str(r.date)] = {
            "water_ml": r.water_ml,
            "protein_g": r.protein_g,
            "strength_min": r.strength_min,
            "cardio_min": r.cardio_min,
            "score": score,
        }

    return {"year": y, "month": m, "days": data}
