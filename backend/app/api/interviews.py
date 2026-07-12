from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models import Interview, InterviewQuestion, User
from app.services.interview_service import (
    create_interview,
    get_interview,
    list_interviews,
    submit_answer,
    complete_interview,
)


class CreateInterviewRequest(BaseModel):
    interview_type: str
    difficulty: str


class SubmitAnswerRequest(BaseModel):
    question_id: UUID
    answer: str


class InterviewQuestionResponse(BaseModel):
    id: UUID
    question_text: str
    user_answer: str | None
    sequence_number: int

    model_config = {"from_attributes": True}


class InterviewResponse(BaseModel):
    id: UUID
    interview_type: str
    difficulty: str
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    answered_count: int
    total_questions: int
    questions: list[InterviewQuestionResponse]


class InterviewListResponse(BaseModel):
    interviews: list[InterviewResponse]


def _serialize_interview(interview: Interview) -> InterviewResponse:
    questions = sorted(interview.questions, key=lambda question: question.sequence_number)
    return InterviewResponse(
        id=interview.id,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        status=interview.status,
        started_at=interview.started_at,
        completed_at=interview.completed_at,
        answered_count=sum(1 for question in questions if question.user_answer),
        total_questions=len(questions),
        questions=[
            InterviewQuestionResponse.model_validate(question)
            for question in questions
        ],
    )


def create_interview_endpoint(
    payload: CreateInterviewRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InterviewResponse:
    interview = create_interview(
        db=db,
        current_user=current_user,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
    )
    return _serialize_interview(interview)


def list_interviews_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InterviewListResponse:
    interviews = list_interviews(db=db, current_user=current_user)
    return InterviewListResponse(
        interviews=[_serialize_interview(interview) for interview in interviews],
    )


def get_interview_endpoint(
    interview_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InterviewResponse:
    interview = get_interview(db=db, current_user=current_user, interview_id=interview_id)
    return _serialize_interview(interview)


def submit_answer_endpoint(
    interview_id: UUID,
    payload: SubmitAnswerRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InterviewResponse:
    interview = submit_answer(
        db=db,
        current_user=current_user,
        interview_id=interview_id,
        question_id=payload.question_id,
        answer=payload.answer,
    )
    return _serialize_interview(interview)


def complete_interview_endpoint(
    interview_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InterviewResponse:
    interview = complete_interview(
        db=db,
        current_user=current_user,
        interview_id=interview_id,
    )
    return _serialize_interview(interview)
