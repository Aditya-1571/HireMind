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
    target_role: str
    custom_role: str | None = None
    resume_id: UUID | None = None


class SubmitAnswerRequest(BaseModel):
    question_id: UUID
    answer: str


class InterviewQuestionResponse(BaseModel):
    id: UUID
    question_text: str
    user_answer: str | None
    feedback: str | None
    score: float | None
    sequence_number: int

    model_config = {"from_attributes": True}


class QuestionEvaluationResponse(BaseModel):
    sequence_number: int
    score: float
    feedback: str
    strength: str
    improvement: str


class InterviewResponse(BaseModel):
    id: UUID
    interview_type: str
    difficulty: str
    target_role: str
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    answered_count: int
    total_questions: int
    questions: list[InterviewQuestionResponse]
    overall_score: float | None
    overall_feedback: str | None
    strengths: list[str]
    improvements: list[str]
    question_evaluations: list[QuestionEvaluationResponse]


class CreateInterviewResponse(InterviewResponse):
    generation_source: str


class CompleteInterviewResponse(InterviewResponse):
    evaluation_source: str


class InterviewListResponse(BaseModel):
    interviews: list[InterviewResponse]


def _score_value(value: object) -> float | None:
    return float(value) if value is not None else None


def _evaluation_data(interview: Interview) -> dict:
    return interview.evaluation_data if isinstance(interview.evaluation_data, dict) else {}


def _evaluation_text_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str) and item.strip()]


def _question_strengths(interview: Interview) -> dict[int, dict[str, str]]:
    values = _evaluation_data(interview).get("question_evaluations")
    if not isinstance(values, list):
        return {}

    result: dict[int, dict[str, str]] = {}
    for value in values:
        if not isinstance(value, dict):
            continue
        sequence_number = value.get("sequence_number")
        strength = value.get("strength")
        improvement = value.get("improvement")
        if (
            isinstance(sequence_number, int)
            and isinstance(strength, str)
            and isinstance(improvement, str)
        ):
            result[sequence_number] = {
                "strength": strength,
                "improvement": improvement,
            }
    return result


def _serialize_interview(interview: Interview) -> InterviewResponse:
    questions = sorted(interview.questions, key=lambda question: question.sequence_number)
    evaluation_data = _evaluation_data(interview)
    question_strengths = _question_strengths(interview)
    return InterviewResponse(
        id=interview.id,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        target_role=interview.target_role,
        status=interview.status,
        started_at=interview.started_at,
        completed_at=interview.completed_at,
        answered_count=sum(1 for question in questions if question.user_answer),
        total_questions=len(questions),
        questions=[
            InterviewQuestionResponse(
                id=question.id,
                question_text=question.question_text,
                user_answer=question.user_answer,
                feedback=question.feedback,
                score=_score_value(question.score),
                sequence_number=question.sequence_number,
            )
            for question in questions
        ],
        overall_score=_score_value(interview.overall_score),
        overall_feedback=(
            evaluation_data.get("overall_feedback")
            if isinstance(evaluation_data.get("overall_feedback"), str)
            else None
        ),
        strengths=_evaluation_text_list(evaluation_data.get("strengths")),
        improvements=_evaluation_text_list(evaluation_data.get("improvements")),
        question_evaluations=[
            QuestionEvaluationResponse(
                sequence_number=question.sequence_number,
                score=_score_value(question.score) or 0,
                feedback=question.feedback or "",
                strength=question_strengths.get(question.sequence_number, {}).get(
                    "strength",
                    "",
                ),
                improvement=question_strengths.get(question.sequence_number, {}).get(
                    "improvement",
                    "",
                ),
            )
            for question in questions
            if question.score is not None and question.feedback
        ],
    )


def create_interview_endpoint(
    payload: CreateInterviewRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CreateInterviewResponse:
    interview, generation_source = create_interview(
        db=db,
        current_user=current_user,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        target_role=payload.target_role,
        custom_role=payload.custom_role,
        resume_id=payload.resume_id,
    )
    serialized = _serialize_interview(interview)
    return CreateInterviewResponse(
        **serialized.model_dump(),
        generation_source=generation_source,
    )


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
) -> CompleteInterviewResponse:
    interview, evaluation_source = complete_interview(
        db=db,
        current_user=current_user,
        interview_id=interview_id,
    )
    serialized = _serialize_interview(interview)
    return CompleteInterviewResponse(
        **serialized.model_dump(),
        evaluation_source=evaluation_source,
    )
