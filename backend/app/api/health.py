from typing import Annotated

from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db


def database_health_check(
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return {
            "status": "error",
            "service": "hiremind-database",
            "message": "Database unavailable",
        }

    return {
        "status": "ok",
        "service": "hiremind-database",
    }


def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "hiremind-api",
    }
