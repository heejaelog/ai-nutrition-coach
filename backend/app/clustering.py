"""
K-Means 클러스터링 모듈
AI팀 clustering_v2.ipynb 로직을 FastAPI 모듈로 포팅.
서버 시작 시 합성 데이터(300명, seed=42)로 K-Means(K=4) 사전학습.
"""
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app import models

# ── 클러스터 레이블 (AI팀 노트북 Cell 6 기준) ─────────────
CLUSTER_LABELS_EN = {
    0: "Low Water & Cardio Focused Type",
    1: "Low Water & Strength Focused Type",
    2: "Low Protein & Cardio Focused Type",
    3: "High Water & High Protein Type",
}

CLUSTER_LABELS_KO = {
    0: "저수분 · 유산소 집중형",
    1: "저수분 · 근력 집중형",
    2: "저단백 · 유산소 집중형",
    3: "고수분 · 고단백형",
}

# 클러스터별 centroid 평균 (AI팀 K=4 실행 결과)
CENTROID_FALLBACK = {
    0: {"water_ml": 1296.5, "protein_g": 89.2,  "strength_min": 22.2, "cardio_min": 46.5},
    1: {"water_ml": 1204.7, "protein_g": 95.1,  "strength_min": 55.3, "cardio_min": 20.1},
    2: {"water_ml": 1814.8, "protein_g": 48.6,  "strength_min": 26.8, "cardio_min": 41.4},
    3: {"water_ml": 1971.9, "protein_g": 99.0,  "strength_min": 41.6, "cardio_min": 19.9},
}

LIFESTYLE_COLS = ["water_ml", "protein_g", "strength_min", "cardio_min"]


# ── 합성 데이터 생성 + K-Means 사전학습 ─────────────────────
def _generate_synthetic_data() -> np.ndarray:
    np.random.seed(42)
    n_users = 300
    days = 7
    records = []

    goals = np.random.choice(["muscle_gain", "weight_loss"], size=n_users)

    for i in range(n_users):
        goal = goals[i]
        if goal == "muscle_gain":
            base_protein  = np.random.normal(100, 25)
            base_strength = np.random.normal(50, 18)
            base_cardio   = np.random.normal(20, 14)
        else:
            base_protein  = np.random.normal(72, 25)
            base_strength = np.random.normal(25, 18)
            base_cardio   = np.random.normal(45, 18)
        base_water = np.random.normal(1600, 450)

        daily = []
        for _ in range(days):
            daily.append([
                max(0, base_water    + np.random.normal(0, 150)),
                max(0, base_protein  + np.random.normal(0, 15)),
                max(0, base_strength + np.random.normal(0, 10)),
                max(0, base_cardio   + np.random.normal(0, 10)),
            ])
        records.append(np.mean(daily, axis=0))

    return np.array(records)


def _train_model():
    data = _generate_synthetic_data()
    scaler = StandardScaler()
    scaled = scaler.fit_transform(data)
    km = KMeans(n_clusters=4, random_state=42, n_init=10)
    km.fit(scaled)
    return scaler, km


# 서버 시작 시 모델 로드
_scaler, _km = _train_model()


# ── 내부 유틸 ────────────────────────────────────────────

def _calc_trend(values: list) -> str:
    non_zero = [(i, v) for i, v in enumerate(values) if v > 0]
    if len(non_zero) < 2:
        return "데이터 부족"
    idx  = np.array([x[0] for x in non_zero], dtype=float)
    vals = np.array([x[1] for x in non_zero], dtype=float)
    slope = np.polyfit(idx, vals, 1)[0]
    avg   = vals.mean()
    pct   = (slope * 6 / avg * 100) if avg > 0 else 0
    return "증가" if pct > 5 else "감소" if pct < -5 else "유지"


def _calc_score(my_avg: dict, user) -> int:
    def pct(val, g): return min(val / g, 1.0) if g > 0 else 0
    w = pct(my_avg["water_ml"],     user.water_goal)
    p = pct(my_avg["protein_g"],    user.protein_goal)
    s = pct(my_avg["strength_min"], user.strength_goal)
    c = pct(my_avg["cardio_min"],   user.cardio_goal)
    if user.goal == "muscle_gain":
        score = w*25 + p*35 + s*30 + c*10
    elif user.goal == "weight_loss":
        score = w*25 + p*25 + s*15 + c*35
    else:
        score = w*25 + p*30 + s*22 + c*23
    return round(score)


# ── 공개 함수 ────────────────────────────────────────────

def assign_cluster(water_ml: float, protein_g: float,
                   strength_min: float, cardio_min: float) -> tuple:
    """7일 평균 라이프스타일로 클러스터 배정. (cluster_id, en_name, ko_name) 반환."""
    x = np.array([[water_ml, protein_g, strength_min, cardio_min]])
    scaled = _scaler.transform(x)
    cluster_id = int(_km.predict(scaled)[0])
    return cluster_id, CLUSTER_LABELS_EN[cluster_id], CLUSTER_LABELS_KO[cluster_id]


def get_user_7day_avg(db: Session, user_id: int) -> dict | None:
    """DB에서 최근 7일 평균 계산. 기록 없으면 None."""
    seven_days_ago = date.today() - timedelta(days=7)
    records = (
        db.query(models.DailyRecord)
        .filter(
            models.DailyRecord.user_id == user_id,
            models.DailyRecord.date >= seven_days_ago,
        )
        .all()
    )
    if not records:
        return None

    n = len(records)
    return {
        "water_ml":     round(sum(r.water_ml     for r in records) / n, 1),
        "protein_g":    round(sum(r.protein_g    for r in records) / n, 1),
        "strength_min": round(sum(r.strength_min for r in records) / n, 1),
        "cardio_min":   round(sum(r.cardio_min   for r in records) / n, 1),
    }


def find_similar_users_from_db(db: Session, target: models.User, top_n: int = 5) -> list[dict]:
    """DB에서 성별·목표 동일 + 신체조건 유사 사용자의 7일 평균 반환."""
    candidates = (
        db.query(models.User)
        .filter(
            models.User.id != target.id,
            models.User.gender == target.gender,
            models.User.goal == target.goal,
        )
        .all()
    )

    if not candidates:
        return []

    # 신체조건 절대 차이 합산으로 순위
    scored = sorted(
        candidates,
        key=lambda u: (
            abs((u.height_cm or 170) - (target.height_cm or 170)) +
            abs((u.weight_kg or 65)  - (target.weight_kg or 65)) +
            abs((u.age or 25)        - (target.age or 25))
        ),
    )

    avgs = []
    for u in scored[:top_n]:
        avg = get_user_7day_avg(db, u.id)
        if avg:
            avgs.append(avg)

    return avgs


def make_user_report(db: Session, user: models.User) -> dict:
    """개인화 리포트 생성 — 목표·점수·트렌드 포함."""
    seven_days_ago = date.today() - timedelta(days=7)
    records = (
        db.query(models.DailyRecord)
        .filter(
            models.DailyRecord.user_id == user.id,
            models.DailyRecord.date >= seven_days_ago,
        )
        .order_by(models.DailyRecord.date)
        .all()
    )

    if records:
        n = len(records)
        my_avg = {
            "water_ml":     round(sum(r.water_ml     for r in records) / n, 1),
            "protein_g":    round(sum(r.protein_g    for r in records) / n, 1),
            "strength_min": round(sum(r.strength_min for r in records) / n, 1),
            "cardio_min":   round(sum(r.cardio_min   for r in records) / n, 1),
        }
        water_arr    = [r.water_ml                     for r in records]
        protein_arr  = [r.protein_g                    for r in records]
        exercise_arr = [r.strength_min + r.cardio_min  for r in records]
    else:
        my_avg = {
            "water_ml":     float(user.water_goal),
            "protein_g":    float(user.protein_goal),
            "strength_min": float(user.strength_goal),
            "cardio_min":   float(user.cardio_goal),
        }
        water_arr = protein_arr = exercise_arr = []

    cluster_id, cluster_en, cluster_ko = assign_cluster(
        my_avg["water_ml"], my_avg["protein_g"],
        my_avg["strength_min"], my_avg["cardio_min"],
    )

    similar_avgs = find_similar_users_from_db(db, user)

    if similar_avgs:
        n = len(similar_avgs)
        sim_avg = {
            k: round(sum(a[k] for a in similar_avgs) / n, 1)
            for k in LIFESTYLE_COLS
        }
    else:
        sim_avg = dict(CENTROID_FALLBACK[cluster_id])

    diff = {k: round(my_avg[k] - sim_avg[k], 1) for k in LIFESTYLE_COLS}

    return {
        "user_id":              user.id,
        "name":                 user.name,
        "gender":               user.gender,
        "goal":                 user.goal,
        "height_cm":            user.height_cm,
        "weight_kg":            user.weight_kg,
        "age":                  user.age,
        "cluster_name":         cluster_en,
        "cluster_name_ko":      cluster_ko,
        "my_values":            my_avg,
        "goals": {
            "water_goal":    user.water_goal,
            "protein_goal":  float(user.protein_goal),
            "strength_goal": user.strength_goal,
            "cardio_goal":   user.cardio_goal,
        },
        "score":                _calc_score(my_avg, user),
        "trends": {
            "water":    _calc_trend(water_arr),
            "protein":  _calc_trend(protein_arr),
            "exercise": _calc_trend(exercise_arr),
        },
        "similar_user_average": sim_avg,
        "difference":           diff,
        "similar_user_count":   len(similar_avgs),
    }
