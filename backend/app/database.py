from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

# Railway는 MYSQL_URL을 제공, 로컬은 개별 변수 사용
_mysql_url = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")
if _mysql_url:
    # mysql:// → mysql+pymysql:// 변환
    DB_URL = _mysql_url.replace("mysql://", "mysql+pymysql://", 1) + "?charset=utf8mb4"
else:
    DB_URL = (
        f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        f"?charset=utf8mb4"
    )

engine = create_engine(DB_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
