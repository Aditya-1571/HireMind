from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.datastructures import UploadFile

from app.api.auth import get_current_user
from app.database import get_db
from app.models import Resume, User

MAX_RESUME_BYTES = 5 * 1024 * 1024
SUPPORTED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


class ResumeResponse(BaseModel):
    id: UUID
    original_filename: str
    file_type: str
    extracted_text: str | None

    model_config = {"from_attributes": True}


class ResumeListResponse(BaseModel):
    resumes: list[ResumeResponse]


def _extract_text(file: UploadFile, content: bytes) -> str | None:
    if file.content_type == "text/plain":
        return content.decode("utf-8", errors="ignore").strip() or None

    if file.content_type == "application/pdf":
        try:
            from io import BytesIO

            from pypdf import PdfReader

            reader = PdfReader(BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            return text.strip() or None
        except Exception:
            return None

    if (
        file.content_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):
        try:
            from io import BytesIO

            from docx import Document

            document = Document(BytesIO(content))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
            return text.strip() or None
        except Exception:
            return None

    return None


async def upload_resume(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ResumeResponse:
    form = await request.form()
    file = form.get("file")

    if not isinstance(file, UploadFile):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume file is required",
        )

    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a PDF, DOCX, or TXT resume",
        )

    content = await file.read(MAX_RESUME_BYTES + 1)
    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Resume must be 5 MB or smaller",
        )

    resume = Resume(
        user_id=current_user.id,
        original_filename=file.filename or "resume",
        file_type=file.content_type,
        extracted_text=_extract_text(file, content),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeResponse.model_validate(resume)


def list_resumes(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ResumeListResponse:
    resumes = db.scalars(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
    ).all()

    return ResumeListResponse(
        resumes=[ResumeResponse.model_validate(resume) for resume in resumes],
    )
