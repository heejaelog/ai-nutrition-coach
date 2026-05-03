from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


# ── Auth ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    goal: str = "muscle_gain"   # muscle_gain / weight_loss / health_maintenance

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ── User ──────────────────────────────────────────────
class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    height_cm: float
    weight_kg: float
    age: int
    gender: str
    goal: str
    water_goal: int
    protein_goal: float
    strength_goal: int
    cardio_goal: int
    turtle_count: int
    equipped_skin_id: Optional[int] = None
    next_skin: int = 0
    owned_skin_count: int = 0

    model_config = {"from_attributes": True}

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    goal: Optional[str] = None
    water_goal: Optional[int] = None
    protein_goal: Optional[float] = None
    strength_goal: Optional[int] = None
    cardio_goal: Optional[int] = None


# ── Record ────────────────────────────────────────────
class RecordRequest(BaseModel):
    water_ml: int = 0
    protein_g: float = 0.0
    strength_min: int = 0
    strength_kcal: int = 0
    strength_type: str = ""
    cardio_min: int = 0
    cardio_kcal: int = 0
    cardio_type: str = ""

class RecordResponse(BaseModel):
    date: date
    water_ml: int
    protein_g: float
    strength_min: int
    strength_kcal: int
    strength_type: str
    cardio_min: int
    cardio_kcal: int
    cardio_type: str
    turtle_awarded: int

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────
class DashboardResponse(BaseModel):
    date: str
    water: int
    water_goal: int
    protein: float
    protein_goal: float
    strength_min: int
    strength_goal: int
    cardio_min: int
    cardio_goal: int
    score: int
    turtle_count: int
    next_skin: int


# ── Analysis ──────────────────────────────────────────
class WeeklyResponse(BaseModel):
    labels: list[str]
    water: list[int]
    protein: list[float]
    strength: list[int]
    cardio: list[int]
    avg_water: int
    avg_protein: float
    avg_strength: int
    avg_cardio: int
    global_avg_water: int
    global_avg_protein: float
    # 시계열 추세
    water_trend: str
    protein_trend: str
    exercise_trend: str
    # 클러스터링 기반 유사 사용자 비교
    cluster_avg_water: int
    cluster_avg_protein: int
    cluster_avg_strength: int
    cluster_avg_cardio: int
    cluster_avg_exercise: int
    cluster_size: int
    cluster_label: str


# ── Skin ──────────────────────────────────────────────
class SkinResponse(BaseModel):
    id: int
    name: str
    description: str
    price: int
    image_key: str
    owned: bool = False      # 내가 보유 중인지

    model_config = {"from_attributes": True}


# ── Friend ────────────────────────────────────────────
class FriendRequestBody(BaseModel):
    user_id: int             # 친구 추가할 상대방 ID

class FriendRequestResponse(BaseModel):
    id: int
    status: str

    model_config = {"from_attributes": True}

class FriendProfileResponse(BaseModel):
    id: int
    name: str
    goal: str
    turtle_count: int
    equipped_skin_id: Optional[int] = None
    equipped_skin_name: Optional[str] = None
    # 오늘 기록
    water_ml: int
    water_goal: int
    protein_g: int
    protein_goal: int
    strength_min: int
    strength_goal: int
    cardio_min: int
    cardio_goal: int
    score: int               # 오늘 달성률 점수 (0~100)

class FriendListItem(BaseModel):
    friendship_id: int
    user_id: int
    name: str
    goal: str
    turtle_count: int
    equipped_skin_id: Optional[int] = None
    equipped_skin_name: Optional[str] = None
    score: int               # 오늘 달성률

class PendingRequestItem(BaseModel):
    friendship_id: int
    requester_id: int
    requester_name: str


TokenResponse.model_rebuild()


# ── Chatbot ────────────────────────────────────────────
class ChatMessageRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    saved: Optional[dict] = None
    turtle_gained: bool = False
    turtle_count: Optional[int] = None
    report_data: Optional[dict] = None
