"""
챗봇 라우터 — OpenAI Function Calling 기반
- 자연어로 수분/단백질/운동 기록 저장 (누적)
- 오늘 현황 조회
- 7일 분석 + 유사 사용자 비교 코칭 리포트
"""
import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from openai import OpenAI
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.clustering import make_user_report

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

GOAL_KO   = {"muscle_gain": "근육 증량", "weight_loss": "체중 감량", "health_maintenance": "건강 유지"}
GENDER_KO = {"male": "남성", "female": "여성"}

# ── OpenAI 클라이언트 ──────────────────────────────────────
def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY가 설정되지 않았습니다.")
    return OpenAI(api_key=api_key)


# ── Function 정의 ──────────────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "save_record_data",
            "description": (
                "사용자가 오늘 섭취한 수분, 단백질 또는 운동 기록을 저장합니다. "
                "언급된 항목만 전달하세요. 단백질은 음식에서 직접 계산하세요."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "water_ml":      {"type": "integer", "description": "추가할 수분(ml). 예: 물 500ml → 500"},
                    "protein_g":     {"type": "number",  "description": "추가할 단백질(g). 음식에서 추정."},
                    "strength_min":  {"type": "integer", "description": "근력 운동 시간(분)"},
                    "strength_type": {"type": "string",  "description": "근력 운동 종류 (예: 웨이트 트레이닝)"},
                    "cardio_min":    {"type": "integer", "description": "유산소 운동 시간(분)"},
                    "cardio_type":   {"type": "string",  "description": "유산소 운동 종류 (예: 러닝, 자전거)"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_today_status",
            "description": "오늘 수분, 단백질, 운동 달성 현황을 조회합니다.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_coaching_report",
            "description": (
                "사용자의 7일 평균 데이터와 유사 사용자 비교 기반 개인화 코칭 리포트를 생성합니다. "
                "'코칭해줘', '분석해줘', '이번 주 어때', '피드백' 등의 요청에 사용하세요."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


# ── 내부 실행 함수 ─────────────────────────────────────────
def _get_today_record(db: Session, user_id: int):
    return (
        db.query(models.DailyRecord)
        .filter(
            models.DailyRecord.user_id == user_id,
            models.DailyRecord.date == date.today(),
        )
        .first()
    )


def _execute_save(db: Session, user: models.User, args: dict) -> dict:
    """기존 오늘 기록에 누적하여 저장."""
    existing = _get_today_record(db, user.id)

    if existing:
        water    = existing.water_ml    + args.get("water_ml", 0)
        protein  = round(existing.protein_g + args.get("protein_g", 0.0), 1)
        strength = existing.strength_min + args.get("strength_min", 0)
        cardio   = existing.cardio_min   + args.get("cardio_min", 0)
        s_type   = args.get("strength_type", existing.strength_type)
        c_type   = args.get("cardio_type",   existing.cardio_type)

        existing.water_ml     = water
        existing.protein_g    = protein
        existing.strength_min = strength
        existing.cardio_min   = cardio
        existing.strength_type = s_type
        existing.cardio_type   = c_type
        record = existing
    else:
        water    = args.get("water_ml", 0)
        protein  = round(args.get("protein_g", 0.0), 1)
        strength = args.get("strength_min", 0)
        cardio   = args.get("cardio_min", 0)
        s_type   = args.get("strength_type", "")
        c_type   = args.get("cardio_type", "")

        record = models.DailyRecord(
            user_id=user.id,
            date=date.today(),
            water_ml=water,
            protein_g=protein,
            strength_min=strength,
            strength_kcal=0,
            strength_type=s_type,
            cardio_min=cardio,
            cardio_kcal=0,
            cardio_type=c_type,
        )
        db.add(record)

    # 거북이 지급 (하루 최초 1회)
    turtle_gained = False
    already_awarded = existing.turtle_awarded if existing else 0
    if not already_awarded and any([water > 0, protein > 0, strength > 0, cardio > 0]):
        record.turtle_awarded = 1
        user.turtle_count += 1
        turtle_gained = True

    db.commit()

    return {
        "added": {k: v for k, v in args.items() if v},
        "total_today": {
            "water_ml":     water,
            "protein_g":    protein,
            "strength_min": strength,
            "cardio_min":   cardio,
        },
        "goals": {
            "water_goal":    user.water_goal,
            "protein_goal":  user.protein_goal,
            "strength_goal": user.strength_goal,
            "cardio_goal":   user.cardio_goal,
        },
        "turtle_gained": turtle_gained,
        "turtle_count":  user.turtle_count,
    }


def _execute_today_status(db: Session, user: models.User) -> dict:
    record = _get_today_record(db, user.id)
    return {
        "water_ml":      record.water_ml      if record else 0,
        "water_goal":    user.water_goal,
        "protein_g":     record.protein_g     if record else 0,
        "protein_goal":  user.protein_goal,
        "strength_min":  record.strength_min  if record else 0,
        "strength_goal": user.strength_goal,
        "cardio_min":    record.cardio_min    if record else 0,
        "cardio_goal":   user.cardio_goal,
        "turtle_count":  user.turtle_count,
    }


def _build_system_prompt(user: models.User) -> str:
    return f"""당신은 '꼬부기 AI 코치'입니다. 사용자의 영양 및 운동 기록을 도와주고 개인화된 건강 코칭을 제공합니다.
항상 한국어로 응답하세요. 친근하고 격려하는 말투를 사용하세요.
🐢 거북이 이모티콘은 절대 사용하지 마세요.

[사용자 정보]
- 이름: {user.name}
- 성별: {GENDER_KO.get(user.gender, user.gender)}
- 나이: {user.age}세 / 키: {user.height_cm}cm / 체중: {user.weight_kg}kg
- 목표: {GOAL_KO.get(user.goal, user.goal)}
- 하루 목표: 수분 {user.water_goal}ml | 단백질 {user.protein_goal}g | 근력 {user.strength_goal}분 | 유산소 {user.cardio_goal}분

[기록 저장 규칙]
- 사용자가 음식/음료/운동을 언급하면 save_record_data 함수 호출
- 단백질 추정: 닭가슴살 100g=23g, 두부 100g=8.5g, 계란 1개=6g, 그릭요거트 100g=10g, 소고기 100g=26g, 연어 100g=20g
- 수분: 물/아메리카노/스포츠음료 등 모두 포함
- 근력: 헬스/웨이트/PT/스쿼트 등
- 유산소: 러닝/자전거/수영/줄넘기 등

[조회 규칙]
- "오늘 현황", "얼마나 했어", "몇 퍼센트" → get_today_status
- "코칭해줘", "분석해줘", "이번 주 어때", "피드백", "비교해줘" → get_coaching_report

[코칭 리포트 출력 형식 - get_coaching_report 호출 후]
get_coaching_report 결과를 받으면 아래처럼 짧게 답하세요:
"{{이름}}님! 이번 주 기록을 분석했어요. 아래 리포트를 확인해보세요 📋
궁금한 점이 있으면 언제든 물어보세요!"
수치, 분석 내용은 답변에 포함하지 마세요. 카드 UI에서 자동으로 표시됩니다.
"""


# ── 엔드포인트 ─────────────────────────────────────────────
@router.post("/message", response_model=schemas.ChatResponse)
def chat(
    req: schemas.ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    client = _get_client()

    messages = [
        {"role": "system", "content": _build_system_prompt(current_user)},
        {"role": "user",   "content": req.message},
    ]

    # 1차 GPT 호출
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=TOOLS,
        tool_choice="auto",
    )
    msg = resp.choices[0].message

    saved_data    = None
    turtle_gained = False
    turtle_count  = None
    report_payload = None

    if msg.tool_calls:
        messages.append(msg)

        for tool_call in msg.tool_calls:
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)

            if fn_name == "save_record_data":
                result = _execute_save(db, current_user, fn_args)
                saved_data    = result.get("total_today")
                turtle_gained = result.get("turtle_gained", False)
                turtle_count  = result.get("turtle_count")
                fn_result = json.dumps(result, ensure_ascii=False)

            elif fn_name == "get_today_status":
                result = _execute_today_status(db, current_user)
                fn_result = json.dumps(result, ensure_ascii=False)

            elif fn_name == "get_coaching_report":
                report = make_user_report(db, current_user)
                report_payload = report
                fn_result = json.dumps(report, ensure_ascii=False)

            else:
                fn_result = "{}"

            messages.append({
                "role":         "tool",
                "tool_call_id": tool_call.id,
                "content":      fn_result,
            })

        # 2차 GPT 호출 (함수 결과 포함)
        resp2 = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )
        reply = resp2.choices[0].message.content

    else:
        reply = msg.content

    return schemas.ChatResponse(
        reply=reply,
        saved=saved_data,
        turtle_gained=turtle_gained,
        turtle_count=turtle_count,
        report_data=report_payload,
    )
