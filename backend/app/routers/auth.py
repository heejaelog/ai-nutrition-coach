from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    # 목표별 기본 목표치 자동 설정
    if req.goal == "근육 증량":
        water_goal, protein_goal, strength_goal, cardio_goal = 2800, 140, 60, 20
    else:  # 체중 감량
        water_goal, protein_goal, strength_goal, cardio_goal = 2450, 98, 20, 45

    user = models.User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        goal=req.goal,
        water_goal=water_goal,
        protein_goal=protein_goal,
        strength_goal=strength_goal,
        cardio_goal=cardio_goal,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}
