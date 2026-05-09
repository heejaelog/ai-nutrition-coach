"""
식품의약품안전처 식품영양성분DB 조회 모듈
출처: 공공데이터포털(data.go.kr) 식품의약품안전처_식품영양성분DB정보
"""
import os
import requests

FOOD_API_KEY = os.getenv("FOOD_API_KEY", "")
_API_URL = "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02"
SOURCE = "식품의약품안전처 식품영양성분DB (공공데이터포털)"

# 단백질 추천 후보 식품 (검색 키워드)
_PROTEIN_CANDIDATES = [
    ("닭가슴살", "100g"),
    ("달걀", "2개(100g)"),
    ("두부", "150g"),
    ("그릭요거트", "100g"),
    ("연어", "100g"),
    ("참치통조림", "100g"),
    ("저지방우유", "200ml"),
]

_WATER_CANDIDATES = [
    ("물", "250ml"),
    ("스포츠음료", "500ml"),
    ("두유", "200ml"),
    ("수박", "200g"),
    ("오이", "100g"),
]

# 간단한 메모리 캐시 (식품명 → 영양정보)
_cache: dict = {}


def _fetch_nutrition(food_name: str) -> dict | None:
    """API에서 식품 영양정보 조회. 실패 시 None 반환."""
    if food_name in _cache:
        return _cache[food_name]

    if not FOOD_API_KEY:
        return None

    try:
        resp = requests.get(
            _API_URL,
            params={
                "serviceKey": FOOD_API_KEY,
                "pageNo":     1,
                "numOfRows":  3,
                "type":       "json",
                "FOOD_NM_KR": food_name,
            },
            timeout=5,
        )
        body = resp.json()

        # data.go.kr 응답 구조 파싱
        item_list = body.get("body", {}).get("items", [])
        if not item_list:
            return None
        if isinstance(item_list, dict):
            item_list = [item_list]

        row = item_list[0]
        result = {
            "name_db":   row.get("FOOD_NM_KR", food_name),
            "protein_g": _to_float(row.get("AMT_NUM3")),   # 단백질(g)
            "water_ml":  _to_float(row.get("AMT_NUM2")),   # 수분(g)
            "calorie":   _to_float(row.get("AMT_NUM1")),   # 열량(kcal)
        }
        _cache[food_name] = result
        return result

    except Exception:
        return None


def _to_float(val) -> float:
    try:
        return round(float(val or 0), 1)
    except (ValueError, TypeError):
        return 0.0


# 하드코딩 폴백 (API 실패 시)
_FALLBACK_PROTEIN = {
    "닭가슴살":    23.0,
    "달걀":        12.0,
    "두부":        12.8,
    "그릭요거트":  10.0,
    "연어":        20.0,
    "참치통조림":  25.0,
    "저지방우유":   6.6,
}


def get_protein_foods(amount_needed: float) -> dict:
    """
    단백질 보충 추천 식품 목록 반환.
    API 조회 성공 시 실제 DB 값, 실패 시 폴백 값 사용.
    """
    foods = []
    total = 0.0
    api_used = False

    for keyword, serving_label in _PROTEIN_CANDIDATES:
        if total >= amount_needed or len(foods) >= 4:
            break

        nutrition = _fetch_nutrition(keyword)
        if nutrition and nutrition["protein_g"] > 0:
            protein = nutrition["protein_g"]
            api_used = True
        else:
            protein = _FALLBACK_PROTEIN.get(keyword, 0.0)

        if protein <= 0:
            continue

        foods.append({
            "name":   f"{keyword} {serving_label}",
            "amount": protein,
            "unit":   "g",
        })
        total += protein

    return {
        "nutrient":      "protein",
        "label":         "단백질",
        "unit":          "g",
        "amount_needed": round(amount_needed, 1),
        "foods":         foods,
        "total":         round(total, 1),
        "source":        SOURCE if api_used else "식품의약품안전처 식품영양성분DB (참고값)",
        "api_used":      api_used,
    }


def get_water_foods(amount_needed: float) -> dict:
    """수분 보충 추천 식품/음료 목록 반환."""
    _FALLBACK_WATER = {
        "물":       250.0,
        "스포츠음료": 500.0,
        "두유":     190.0,
        "수박":     184.0,
        "오이":      96.0,
    }

    foods = []
    total = 0.0
    api_used = False

    for keyword, serving_label in _WATER_CANDIDATES:
        if total >= amount_needed or len(foods) >= 4:
            break

        nutrition = _fetch_nutrition(keyword)
        if nutrition and nutrition["water_ml"] > 0:
            water = nutrition["water_ml"]
            api_used = True
        else:
            water = _FALLBACK_WATER.get(keyword, 0.0)

        if water <= 0:
            continue

        foods.append({
            "name":   f"{keyword} {serving_label}",
            "amount": water,
            "unit":   "ml",
        })
        total += water

    return {
        "nutrient":      "water",
        "label":         "수분",
        "unit":          "ml",
        "amount_needed": round(amount_needed, 1),
        "foods":         foods,
        "total":         round(total, 1),
        "source":        SOURCE if api_used else "식품의약품안전처 식품영양성분DB (참고값)",
        "api_used":      api_used,
    }
