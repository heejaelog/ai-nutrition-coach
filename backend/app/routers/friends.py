from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/friends", tags=["friends"])


def calc_score(record, user) -> int:
    if not record:
        return 0
    water_pct = (record.water_ml / user.water_goal) if user.water_goal else 0
    protein_pct = (record.protein_g / user.protein_goal) if user.protein_goal else 0
    exercise_total = record.strength_min + record.cardio_min
    exercise_goal = (user.strength_goal + user.cardio_goal) if (user.strength_goal + user.cardio_goal) else 1
    exercise_pct = exercise_total / exercise_goal
    return min(round(water_pct * 33 + protein_pct * 33 + exercise_pct * 34), 100)


def get_friend_user(friendship: models.Friendship, me_id: int) -> models.User:
    """friendship에서 상대방 User 반환"""
    if friendship.requester_id == me_id:
        return friendship.receiver
    return friendship.requester


@router.get("/search", response_model=dict)
def search_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신은 검색할 수 없습니다.")

    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="해당 ID의 사용자를 찾을 수 없습니다.")

    # 이미 친구거나 요청 중인지 확인
    existing = db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.requester_id == current_user.id, models.Friendship.receiver_id == user_id),
            and_(models.Friendship.requester_id == user_id, models.Friendship.receiver_id == current_user.id),
        )
    ).first()

    relation = "none"
    if existing:
        if existing.status == "accepted":
            relation = "friend"
        elif existing.requester_id == current_user.id:
            relation = "pending_sent"
        else:
            relation = "pending_received"

    skin_name = target.equipped_skin.name if target.equipped_skin else None

    return {
        "id": target.id,
        "name": target.name,
        "goal": target.goal,
        "turtle_count": target.turtle_count,
        "equipped_skin_id": target.equipped_skin_id,
        "equipped_skin_name": skin_name,
        "relation": relation,
    }


@router.post("/request", response_model=dict)
def send_friend_request(
    body: schemas.FriendRequestBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if body.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신에게 친구 요청을 보낼 수 없습니다.")

    target = db.query(models.User).filter(models.User.id == body.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    existing = db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.requester_id == current_user.id, models.Friendship.receiver_id == body.user_id),
            and_(models.Friendship.requester_id == body.user_id, models.Friendship.receiver_id == current_user.id),
        )
    ).first()
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="이미 친구입니다.")
        raise HTTPException(status_code=400, detail="이미 친구 요청이 존재합니다.")

    friendship = models.Friendship(requester_id=current_user.id, receiver_id=body.user_id)
    db.add(friendship)
    db.commit()
    return {"message": f"{target.name}님에게 친구 요청을 보냈습니다.", "friendship_id": friendship.id}


@router.post("/accept/{friendship_id}", response_model=dict)
def accept_friend_request(
    friendship_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="친구 요청을 찾을 수 없습니다.")
    if friendship.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="수락 권한이 없습니다.")
    if friendship.status == "accepted":
        raise HTTPException(status_code=400, detail="이미 수락된 요청입니다.")

    friendship.status = "accepted"
    db.commit()
    return {"message": "친구 요청을 수락했습니다."}


@router.delete("/{friendship_id}", response_model=dict)
def remove_friend(
    friendship_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="친구 관계를 찾을 수 없습니다.")
    if friendship.requester_id != current_user.id and friendship.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    db.delete(friendship)
    db.commit()
    return {"message": "친구를 삭제했습니다."}


@router.get("/pending", response_model=list[schemas.PendingRequestItem])
def get_pending_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """나에게 온 대기 중인 친구 요청 목록"""
    pending = db.query(models.Friendship).filter(
        models.Friendship.receiver_id == current_user.id,
        models.Friendship.status == "pending",
    ).all()

    return [
        schemas.PendingRequestItem(
            friendship_id=f.id,
            requester_id=f.requester_id,
            requester_name=f.requester.name,
        )
        for f in pending
    ]


@router.get("/", response_model=list[schemas.FriendListItem])
def get_friends(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.requester_id == current_user.id,
            models.Friendship.receiver_id == current_user.id,
        ),
        models.Friendship.status == "accepted",
    ).all()

    today = date.today()
    result = []
    for f in friendships:
        friend = get_friend_user(f, current_user.id)
        record = db.query(models.DailyRecord).filter(
            models.DailyRecord.user_id == friend.id,
            models.DailyRecord.date == today,
        ).first()

        skin_name = friend.equipped_skin.name if friend.equipped_skin else None
        result.append(schemas.FriendListItem(
            friendship_id=f.id,
            user_id=friend.id,
            name=friend.name,
            goal=friend.goal,
            turtle_count=friend.turtle_count,
            equipped_skin_id=friend.equipped_skin_id,
            equipped_skin_name=skin_name,
            score=calc_score(record, friend),
        ))
    return result


@router.get("/{user_id}/profile", response_model=schemas.FriendProfileResponse)
def get_friend_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # 친구 관계 확인
    friendship = db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.requester_id == current_user.id, models.Friendship.receiver_id == user_id),
            and_(models.Friendship.requester_id == user_id, models.Friendship.receiver_id == current_user.id),
        ),
        models.Friendship.status == "accepted",
    ).first()
    if not friendship:
        raise HTTPException(status_code=403, detail="친구 관계가 아닙니다.")

    friend = db.query(models.User).filter(models.User.id == user_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    today = date.today()
    record = db.query(models.DailyRecord).filter(
        models.DailyRecord.user_id == user_id,
        models.DailyRecord.date == today,
    ).first()

    skin_name = friend.equipped_skin.name if friend.equipped_skin else None

    return schemas.FriendProfileResponse(
        id=friend.id,
        name=friend.name,
        goal=friend.goal,
        turtle_count=friend.turtle_count,
        equipped_skin_id=friend.equipped_skin_id,
        equipped_skin_name=skin_name,
        water_ml=record.water_ml if record else 0,
        water_goal=friend.water_goal,
        protein_g=record.protein_g if record else 0,
        protein_goal=friend.protein_goal,
        strength_min=record.strength_min if record else 0,
        strength_goal=friend.strength_goal,
        cardio_min=record.cardio_min if record else 0,
        cardio_goal=friend.cardio_goal,
        score=calc_score(record, friend),
    )
