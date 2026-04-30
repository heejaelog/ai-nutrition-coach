from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import engine, Base, SessionLocal
from app.routers import auth, users, records, dashboard, analysis, friends, skins
from app import models

load_dotenv()

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

# 스킨 기본 데이터 시딩
def seed():
    db = SessionLocal()
    try:
        if db.query(models.Skin).count() == 0:
            db.add_all([
                models.Skin(name="불꽃 꼬부기", description="불꽃을 뿜는 꼬부기", price=10, image_key="fire"),
                models.Skin(name="얼음 꼬부기", description="차갑고 쿨한 꼬부기", price=15, image_key="ice"),
                models.Skin(name="벚꽃 꼬부기", description="봄의 꼬부기",         price=20, image_key="sakura"),
                models.Skin(name="우주 꼬부기", description="우주를 유영하는 꼬부기", price=25, image_key="space"),
                models.Skin(name="황금 꼬부기", description="전설의 황금 꼬부기",   price=30, image_key="gold"),
            ])
            db.commit()
    finally:
        db.close()

seed()

app = FastAPI(title="AI Nutrition Coach API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(records.router)
app.include_router(dashboard.router)
app.include_router(analysis.router)
app.include_router(friends.router)
app.include_router(skins.router)


@app.get("/")
def root():
    return {"message": "AI Nutrition Coach API 서버 정상 작동 중"}
