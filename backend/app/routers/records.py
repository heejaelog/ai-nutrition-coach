from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.dialects.mysql import insert
from datetime import date
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/records", tags=["records"])


@router.get("/today", response_model=schemas.RecordResponse)
def get_today(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    record = (
        db.query(models.DailyRecord)
        .filter(models.DailyRecord.user_id == current_user.id, models.DailyRecord.date == today)
        .first()
    )
    if not record:
        # 오늘 기록 없으면 빈 응답
        return schemas.RecordResponse(
            date=today,
            water_ml=0, protein_g=0,
            strength_min=0, strength_kcal=0, strength_type="",
            cardio_min=0, cardio_kcal=0, cardio_type="",
            turtle_awarded=0,
        )
    return record


@router.post("/", response_model=dict)
def save_record(
    req: schemas.RecordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()

    existing = (
        db.query(models.DailyRecord)
        .filter(models.DailyRecord.user_id == current_user.id, models.DailyRecord.date == today)
        .first()
    )

    turtle_awarded_today = existing.turtle_awarded if existing else 0

    if existing:
        existing.water_ml = req.water_ml
        existing.protein_g = req.protein_g
        existing.strength_min = req.strength_min
        existing.strength_kcal = req.strength_kcal
        existing.strength_type = req.strength_type
        existing.cardio_min = req.cardio_min
        existing.cardio_kcal = req.cardio_kcal
        existing.cardio_type = req.cardio_type
        record = existing
    else:
        record = models.DailyRecord(
            user_id=current_user.id,
            date=today,
            **req.model_dump(),
        )
        db.add(record)

    # 거북이 지급: 하루 최초 1회, 하나라도 기록했으면 지급
    turtle_gained = False
    has_any_record = any([
        req.water_ml > 0, req.protein_g > 0,
        req.strength_min > 0, req.cardio_min > 0,
    ])
    if has_any_record and not turtle_awarded_today:
        record.turtle_awarded = 1
        current_user.turtle_count += 1
        turtle_gained = True

    db.commit()

    return {
        "message": "기록이 저장되었습니다.",
        "turtle_gained": turtle_gained,
        "turtle_count": current_user.turtle_count,
    }
