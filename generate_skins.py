"""
DALL-E 3로 꼬부기 스킨 이미지 5장 생성 → frontend/assets/skins/ 저장
"""
import os
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("backend/.env")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

OUTPUT_DIR = "frontend/assets/skins"

SKINS = [
    (
        "fire",
        "A cute chibi-style cartoon turtle with blue skin and a brown shell, "
        "surrounded by bright orange and red flames, glowing fire effects, "
        "fierce but adorable expression, on a vivid orange-red gradient background, "
        "clean 2D game character illustration, flat cartoon art style, high quality",
    ),
    (
        "ice",
        "A cute chibi-style cartoon turtle with light blue icy skin and a frosty shell "
        "covered in ice crystals and snowflakes, cool expression, "
        "on a soft pastel blue winter background with snowflakes, "
        "clean 2D game character illustration, flat cartoon art style, high quality",
    ),
    (
        "gold",
        "A cute chibi-style cartoon turtle with shiny golden metallic skin and a glittering gold shell, "
        "sparkles and shine effects, regal expression, "
        "on a bright golden-yellow gradient background with sparkle effects, "
        "clean 2D game character illustration, flat cartoon art style, high quality",
    ),
    (
        "sakura",
        "A cute chibi-style cartoon turtle with soft pink-tinted skin and a shell decorated with cherry blossom flowers, "
        "surrounded by falling sakura petals, gentle sweet expression, "
        "on a soft pink spring background with cherry blossom petals, "
        "clean 2D game character illustration, flat cartoon art style, high quality",
    ),
    (
        "space",
        "A cute chibi-style cartoon turtle wearing a tiny astronaut helmet, "
        "with dark blue cosmic skin and a star-patterned shell, "
        "floating in space with stars and galaxies around it, adventurous expression, "
        "on a deep dark purple cosmic space background with stars and nebula, "
        "clean 2D game character illustration, flat cartoon art style, high quality",
    ),
]


def generate():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for name, prompt in SKINS:
        print(f"생성 중: {name}...")
        try:
            resp = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            url = resp.data[0].url
            img = requests.get(url, timeout=30).content
            out = os.path.join(OUTPUT_DIR, f"{name}.png")
            with open(out, "wb") as f:
                f.write(img)
            print(f"  완료 → {out}")
        except Exception as e:
            print(f"  실패: {e}")

    print("\n모든 스킨 생성 완료!")


if __name__ == "__main__":
    generate()
