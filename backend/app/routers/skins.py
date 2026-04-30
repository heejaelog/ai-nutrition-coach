from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/skins", tags=["skins"])


def seed_skins(db: Session):
    """스킨이 하나도 없으면 기본 스킨 목록 삽입"""
    if db.query(models.Skin).count() == 0:
        defaults = [
            models.Skin(name="불꽃 꼬부기", description="불꽃을 뿜는 꼬부기", price=10, image_key="fire"),
            models.Skin(name="얼음 꼬부기", description="차갑고 쿨한 꼬부기", price=15, image_key="ice"),
            models.Skin(name="황금 꼬부기", description="전설의 황금 꼬부기", price=30, image_key="gold"),
            models.Skin(name="벚꽃 꼬부기", description="봄의 꼬부기", price=20, image_key="sakura"),
            models.Skin(name="우주 꼬부기", description="우주를 유영하는 꼬부기", price=25, image_key="space"),
        ]
        db.add_all(defaults)
        db.commit()


@router.get("/", response_model=list[schemas.SkinResponse])
def get_skins(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    seed_skins(db)
    skins = db.query(models.Skin).all()
    owned_ids = {us.skin_id for us in current_user.owned_skins}

    result = []
    for s in skins:
        result.append(schemas.SkinResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            price=s.price,
            image_key=s.image_key,
            owned=s.id in owned_ids,
        ))
    return result


@router.post("/{skin_id}/buy", response_model=dict)
def buy_skin(
    skin_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    skin = db.query(models.Skin).filter(models.Skin.id == skin_id).first()
    if not skin:
        raise HTTPException(status_code=404, detail="스킨을 찾을 수 없습니다.")

    already = db.query(models.UserSkin).filter(
        models.UserSkin.user_id == current_user.id,
        models.UserSkin.skin_id == skin_id,
    ).first()
    if already:
        raise HTTPException(status_code=400, detail="이미 보유한 스킨입니다.")

    if current_user.turtle_count < skin.price:
        raise HTTPException(status_code=400, detail=f"꼬부기 코인이 부족합니다. (필요: {skin.price}개)")

    current_user.turtle_count -= skin.price
    db.add(models.UserSkin(user_id=current_user.id, skin_id=skin_id))
    db.commit()

    return {
        "message": f"{skin.name} 스킨을 구매했습니다!",
        "turtle_count": current_user.turtle_count,
    }


@router.post("/{skin_id}/equip", response_model=dict)
def equip_skin(
    skin_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    owned = db.query(models.UserSkin).filter(
        models.UserSkin.user_id == current_user.id,
        models.UserSkin.skin_id == skin_id,
    ).first()
    if not owned:
        raise HTTPException(status_code=400, detail="보유하지 않은 스킨입니다.")

    current_user.equipped_skin_id = skin_id
    db.commit()
    return {"message": "스킨을 장착했습니다.", "equipped_skin_id": skin_id}


@router.post("/unequip", response_model=dict)
def unequip_skin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    current_user.equipped_skin_id = None
    db.commit()
    return {"message": "스킨을 해제했습니다."}
