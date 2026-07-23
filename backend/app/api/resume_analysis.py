from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.resumes import ResumeResponse
from app.database import get_db
from app.models import User
from app.services.resume_intelligence_service import analyze_owned_resume


def analyze_resume_endpoint(
    resume_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ResumeResponse:
    resume = analyze_owned_resume(db=db, current_user=current_user, resume_id=resume_id)
    return ResumeResponse.model_validate(resume)
