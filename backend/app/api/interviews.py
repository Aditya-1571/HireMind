from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import Depends, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models import Interview, InterviewQuestion, User
from app.services.interview_analytics_service import (
    DifficultyFilter,
    InterviewSort,
    InterviewStatusFilter,
    InterviewSummary,
    InterviewTypeFilter,
    PaginatedInterviews,
    get_interview_analytics_summary,
    list_interview_summaries,
)
from app.services.interview_service import (
    create_interview,
    get_interview,
    submit_answer,
    complete_interview,
)
from app.services.interview_report_service import (
    InterviewReport,
    get_interview_report,
)


class CreateInterviewRequest(BaseModel):
    interview_type: str
    difficulty: str
    target_role: str
    custom_role: str | None = None
    resume_id: UUID | None = None
    question_count: int = Field(default=10, ge=5, le=30)
    time_limit_minutes: Literal[15, 30, 45, 60] | None = None
    evaluation_style: Literal["beginner_friendly", "balanced", "strict"] = "balanced"
    answer_mode: Literal["text"] = "text"

    @field_validator("question_count", mode="before")
    @classmethod
    def reject_non_integer_question_count(cls, value: object) -> object:
        if isinstance(value, bool):
            raise ValueError("Question count must be an integer from 5 to 30")
        if isinstance(value, float):
            raise ValueError("Question count must be an integer from 5 to 30")
        return value


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
    question_count: int
    time_limit_minutes: int | None
    evaluation_style: str
    answer_mode: str
    duration_seconds: int | None
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


class InterviewSummaryResponse(BaseModel):
    id: UUID
    target_role: str
    interview_type: str
    difficulty: str
    status: str
    overall_score: float | None
    started_at: datetime | None
    completed_at: datetime | None
    question_count: int
    time_limit_minutes: int | None
    evaluation_style: str
    answer_mode: str
    duration_seconds: int | None
    resume_filename: str | None
    answered_count: int
    total_questions: int


class InterviewListResponse(BaseModel):
    interviews: list[InterviewSummaryResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class ScoreTrendItemResponse(BaseModel):
    interview_id: UUID
    date: datetime
    target_role: str
    interview_type: str
    score: float


class ScoreByTypeResponse(BaseModel):
    interview_type: str
    average_score: float
    count: int


class InterviewAnalyticsSummaryResponse(BaseModel):
    total_interviews: int
    completed_interviews: int
    in_progress_interviews: int
    average_completed_score: float | None
    highest_score: float | None
    latest_completed_score: float | None
    most_practised_target_role: str | None
    score_trend: list[ScoreTrendItemResponse]
    average_score_by_type: list[ScoreByTypeResponse]


class ReportInterviewResponse(BaseModel):
    id: UUID
    target_role: str
    interview_type: str
    difficulty: str
    evaluation_style: str
    answer_mode: str
    question_count: int
    answered_count: int
    started_at: datetime | None
    completed_at: datetime | None
    duration_seconds: int | None
    time_limit_minutes: int | None


class ReportSummaryResponse(BaseModel):
    overall_score: float | None
    performance_level: str | None
    overall_feedback: str | None
    strengths: list[str]
    improvements: list[str]


class ReportMetricsResponse(BaseModel):
    average_question_score: float | None
    completion_rate: float | None
    answered_questions: int
    total_questions: int


class ReportQuestionResponse(BaseModel):
    sequence_number: int
    question_text: str
    candidate_answer: str | None
    score: float | None
    feedback: str | None
    strength: str | None
    improvement: str | None


class NextInterviewRecommendationResponse(BaseModel):
    target_role: str
    difficulty: str
    interview_type: str
    question_count: int
    focus_topics: list[str]


class ReportRecommendationsResponse(BaseModel):
    topics: list[str]
    next_interview: NextInterviewRecommendationResponse


class InterviewReportResponse(BaseModel):
    interview: ReportInterviewResponse
    summary: ReportSummaryResponse
    metrics: ReportMetricsResponse
    questions: list[ReportQuestionResponse]
    recommendations: ReportRecommendationsResponse


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
        question_count=getattr(interview, "question_count", None) or len(questions),
        time_limit_minutes=getattr(interview, "time_limit_minutes", None),
        evaluation_style=getattr(interview, "evaluation_style", None) or "balanced",
        answer_mode=getattr(interview, "answer_mode", None) or "text",
        duration_seconds=getattr(interview, "duration_seconds", None),
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


def _serialize_interview_summary(
    summary: InterviewSummary,
) -> InterviewSummaryResponse:
    return InterviewSummaryResponse(
        id=summary.id,
        target_role=summary.target_role,
        interview_type=summary.interview_type,
        difficulty=summary.difficulty,
        status=summary.status,
        overall_score=summary.overall_score,
        started_at=summary.started_at,
        completed_at=summary.completed_at,
        question_count=summary.question_count,
        time_limit_minutes=summary.time_limit_minutes,
        evaluation_style=summary.evaluation_style,
        answer_mode=summary.answer_mode,
        duration_seconds=summary.duration_seconds,
        resume_filename=summary.resume_filename,
        answered_count=summary.answered_count,
        total_questions=summary.total_questions,
    )


def _serialize_paginated_interviews(
    paginated: PaginatedInterviews,
) -> InterviewListResponse:
    return InterviewListResponse(
        interviews=[
            _serialize_interview_summary(interview)
            for interview in paginated.interviews
        ],
        page=paginated.page,
        page_size=paginated.page_size,
        total=paginated.total,
        total_pages=paginated.total_pages,
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
        question_count=payload.question_count,
        time_limit_minutes=payload.time_limit_minutes,
        evaluation_style=payload.evaluation_style,
        answer_mode=payload.answer_mode,
    )
    serialized = _serialize_interview(interview)
    return CreateInterviewResponse(
        **serialized.model_dump(),
        generation_source=generation_source,
    )


def list_interviews_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 10,
    status: Annotated[InterviewStatusFilter | None, Query()] = None,
    interview_type: Annotated[InterviewTypeFilter | None, Query()] = None,
    difficulty: Annotated[DifficultyFilter | None, Query()] = None,
    target_role: Annotated[str | None, Query(max_length=100)] = None,
    sort: Annotated[InterviewSort, Query()] = "newest",
) -> InterviewListResponse:
    return _serialize_paginated_interviews(
        list_interview_summaries(
            db=db,
            current_user=current_user,
            page=page,
            page_size=page_size,
            status=status,
            interview_type=interview_type,
            difficulty=difficulty,
            target_role=target_role,
            sort=sort,
        ),
    )


def get_interview_analytics_summary_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InterviewAnalyticsSummaryResponse:
    summary = get_interview_analytics_summary(db=db, current_user=current_user)
    return InterviewAnalyticsSummaryResponse(
        total_interviews=summary.total_interviews,
        completed_interviews=summary.completed_interviews,
        in_progress_interviews=summary.in_progress_interviews,
        average_completed_score=summary.average_completed_score,
        highest_score=summary.highest_score,
        latest_completed_score=summary.latest_completed_score,
        most_practised_target_role=summary.most_practised_target_role,
        score_trend=[
            ScoreTrendItemResponse(
                interview_id=item.interview_id,
                date=item.date,
                target_role=item.target_role,
                interview_type=item.interview_type,
                score=item.score,
            )
            for item in summary.score_trend
        ],
        average_score_by_type=[
            ScoreByTypeResponse(
                interview_type=item.interview_type,
                average_score=item.average_score,
                count=item.count,
            )
            for item in summary.average_score_by_type
        ],
    )


def _serialize_interview_report(report: InterviewReport) -> InterviewReportResponse:
    return InterviewReportResponse(
        interview=ReportInterviewResponse(**report.interview),
        summary=ReportSummaryResponse(**report.summary),
        metrics=ReportMetricsResponse(**report.metrics),
        questions=[
            ReportQuestionResponse(
                sequence_number=question.sequence_number,
                question_text=question.question_text,
                candidate_answer=question.candidate_answer,
                score=question.score,
                feedback=question.feedback,
                strength=question.strength,
                improvement=question.improvement,
            )
            for question in report.questions
        ],
        recommendations=ReportRecommendationsResponse(**report.recommendations),
    )


def get_interview_report_endpoint(
    interview_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InterviewReportResponse:
    return _serialize_interview_report(
        get_interview_report(db=db, current_user=current_user, interview_id=interview_id),
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
