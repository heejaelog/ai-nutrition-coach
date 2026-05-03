from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


def get_next_skin_price(db: Session, user: models.User) -> int:
    owned_ids = {us.skin_id for us in user.owned_skins}
    cheapest = (
        db.query(models.Skin)
        .filter(models.Skin.id.notin_(owned_ids) if owned_ids else True)
        .order_by(models.Skin.price.asc())
        .first()
    )
    return cheapest.price if cheapest else 0


def build_user_response(db: Session, user: models.User) -> schemas.UserResponse:
    data = schemas.UserResponse.model_validate(user)
    data.next_skin = get_next_skin_price(db, user)
    data.owned_skin_count = len(user.owned_skins)
    return data


@router.get("/me", response_model=schemas.UserResponse)
def get_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return build_user_response(db, current_user)


@router.put("/me", response_model=schemas.UserResponse)
def update_me(
    req: schemas.UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)

    # 목표가 변경되면 목표치 자동 재계산 (체중 기반)
    if req.goal is not None:
        weight = current_user.weight_kg
        if req.goal == "muscle_gain":
            current_user.water_goal = int(weight * 40)
            current_user.protein_goal = round(weight * 2.0, 1)
            current_user.strength_goal = 60
            current_user.cardio_goal = 20
        elif req.goal == "weight_loss":
            current_user.water_goal = int(weight * 35)
            current_user.protein_goal = round(weight * 1.4, 1)
            current_user.strength_goal = 20
            current_user.cardio_goal = 45
        else:  # health_maintenance
            current_user.water_goal = int(weight * 35)
            current_user.protein_goal = round(weight * 1.2, 1)
            current_user.strength_goal = 30
            current_user.cardio_goal = 30

    db.commit()
    db.refresh(current_user)
    return build_user_response(db, current_user)
