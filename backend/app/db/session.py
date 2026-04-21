from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()


def build_database_url(raw_url: str) -> str:
    url = raw_url.strip()

    if url.startswith("postgresql+psycopg://"):
        return "postgresql+pg8000://" + url[len("postgresql+psycopg://") :]

    if url.startswith("postgresql://"):
        return "postgresql+pg8000://" + url[len("postgresql://") :]

    return url


database_url = build_database_url(settings.database_url)

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()