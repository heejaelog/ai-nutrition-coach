from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)

    # 신체 정보
    height_cm = Column(Float, default=170.0)
    weight_kg = Column(Float, default=65.0)
    age = Column(Integer, default=25)
    gender = Column(String(10), default="male")  # male / female

    # 목표
    goal = Column(String(20), default="muscle_gain")  # muscle_gain / weight_loss / health_maintenance
    water_goal = Column(Integer, default=2000)         # ml
    protein_goal = Column(Float, default=60.0)         # g (소수점 허용)
    strength_goal = Column(Integer, default=30)      # 분 (근력 운동)
    cardio_goal = Column(Integer, default=30)        # 분 (유산소 운동)

    # 거북이
    turtle_count = Column(Integer, default=0)

    # 장착 스킨 (null = 기본 꼬부기)
    equipped_skin_id = Column(Integer, ForeignKey("skins.id"), nullable=True, default=None)

    created_at = Column(DateTime, server_default=func.now())

    records = relationship("DailyRecord", back_populates="user", cascade="all, delete-orphan")
    owned_skins = relationship("UserSkin", back_populates="user", cascade="all, delete-orphan")
    equipped_skin = relationship("Skin", foreign_keys=[equipped_skin_id])

    # 친구 관계 (내가 요청한 것)
    sent_requests = relationship("Friendship", foreign_keys="Friendship.requester_id", back_populates="requester", cascade="all, delete-orphan")
    received_requests = relationship("Friendship", foreign_keys="Friendship.receiver_id", back_populates="receiver", cascade="all, delete-orphan")


class DailyRecord(Base):
    __tablename__ = "daily_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)

    # 수분
    water_ml = Column(Integer, default=0)

    # 단백질
    protein_g = Column(Float, default=0.0)  # 소수점 허용 (예: 108.4g)

    # 근력 운동
    strength_min = Column(Integer, default=0)
    strength_kcal = Column(Integer, default=0)
    strength_type = Column(String(50), default="")

    # 유산소 운동
    cardio_min = Column(Integer, default=0)
    cardio_kcal = Column(Integer, default=0)
    cardio_type = Column(String(50), default="")

    # 거북이 지급 여부 (하루 1회)
    turtle_awarded = Column(Integer, default=0)  # TINYINT(1): 0=미지급, 1=지급

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="records")

    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)


class Skin(Base):
    __tablename__ = "skins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), default="")
    price = Column(Integer, nullable=False)       # 꼬부기 코인 가격
    image_key = Column(String(100), default="")   # 나중에 이미지 붙일 때 사용

    owners = relationship("UserSkin", back_populates="skin")


class UserSkin(Base):
    __tablename__ = "user_skins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skin_id = Column(Integer, ForeignKey("skins.id"), nullable=False)
    purchased_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="owned_skins")
    skin = relationship("Skin", back_populates="owners")

    __table_args__ = (UniqueConstraint("user_id", "skin_id", name="uq_user_skin"),)


class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending / accepted

    created_at = Column(DateTime, server_default=func.now())

    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_requests")

    __table_args__ = (UniqueConstraint("requester_id", "receiver_id", name="uq_friendship"),)
