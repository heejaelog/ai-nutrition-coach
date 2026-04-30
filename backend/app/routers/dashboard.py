from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def get_next_skin_price(db: Session, user: models.User) -> int:
    """보유하지 않은 스킨 중 가장 저렴한 가격 반환. 없으면 0."""
    owned_ids = {us.skin_id for us in user.owned_skins}
    cheapest = (
        db.query(models.Skin)
        .filter(models.Skin.id.notin_(owned_ids) if owned_ids else True)
        .order_by(models.Skin.price.asc())
        .first()
    )
    return cheapest.price if cheapest else 0


def calc_score(water, water_goal, protein, protein_goal,
               strength, strength_goal, cardio, cardio_goal, goal):
    """목표별 가중치로 건강 점수 계산"""
    def pct(val, goal): return min(val / goal, 1.0) if goal > 0 else 0

    if goal == "근육 증량":
        score = (
            pct(water, water_goal) * 25 +
            pct(protein, protein_goal) * 35 +
            pct(strength, strength_goal) * 30 +
            pct(cardio, cardio_goal) * 10
        )
    else:  # 체중 감량
        score = (
            pct(water, water_goal) * 25 +
            pct(protein, protein_goal) * 25 +
            pct(strength, strength_goal) * 15 +
            pct(cardio, cardio_goal) * 35
        )
    return round(score)


@router.get("/today", response_model=schemas.DashboardResponse)
def get_today_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    record = (
        db.query(models.DailyRecord)
        .filter(models.DailyRecord.user_id == current_user.id, models.DailyRecord.date == today)
        .first()
    )

    water = record.water_ml if record else 0
    protein = record.protein_g if record else 0
    strength = record.strength_min if record else 0
    cardio = record.cardio_min if record else 0

    score = calc_score(
        water, current_user.water_goal,
        protein, current_user.protein_goal,
        strength, current_user.strength_goal,
        cardio, current_user.cardio_goal,
        current_user.goal,
    )

    return {
        "date": today.strftime("%Y-%m-%d"),
        "water": water,
        "water_goal": current_user.water_goal,
        "protein": protein,
        "protein_goal": current_user.protein_goal,
        "strength_min": strength,
        "strength_goal": current_user.strength_goal,
        "cardio_min": cardio,
        "cardio_goal": current_user.cardio_goal,
        "score": score,
        "turtle_count": current_user.turtle_count,
        "next_skin": get_next_skin_price(db, current_user),
    }
