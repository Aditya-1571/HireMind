from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from math import ceil
from typing import Literal
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, selectinload

from app.data.interview_questions import QUESTION_COUNT
from app.models import Interview, User

InterviewStatusFilter = Literal["in_progress", "completed"]
InterviewTypeFilter = Literal["HR", "Technical", "Mixed"]
DifficultyFilter = Literal["Easy", "Medium", "Hard"]
InterviewSort = Literal["newest", "oldest", "highest_score", "lowest_score"]

MAX_TREND_ITEMS = 10
VALID_SCORE_CONDITION = and_(
    Interview.overall_score.is_not(None),
    Interview.overall_score >= 0,
    Interview.overall_score <= 100,
)


@dataclass(frozen=True)
class InterviewSummary:
    id: UUID
    target_role: str
    interview_type: str
    difficulty: str
    status: str
    overall_score: float | None
    started_at: datetime | None
    completed_at: datetime | None
    resume_filename: str | None
    answered_count: int
    total_questions: int


@dataclass(frozen=True)
class PaginatedInterviews:
    interviews: list[InterviewSummary]
    page: int
    page_size: int
    total: int
    total_pages: int


@dataclass(frozen=True)
class ScoreTrendItem:
    interview_id: UUID
    date: datetime
    target_role: str
    interview_type: str
    score: float


@dataclass(frozen=True)
class ScoreByTypeItem:
    interview_type: str
    average_score: float
    count: int


@dataclass(frozen=True)
class InterviewAnalyticsSummary:
    total_interviews: int
    completed_interviews: int
    in_progress_interviews: int
    average_completed_score: float | None
    highest_score: float | None
    latest_completed_score: float | None
    most_practised_target_role: str | None
    score_trend: list[ScoreTrendItem]
    average_score_by_type: list[ScoreByTypeItem]


def _score_value(value: Decimal | None) -> float | None:
    return float(value) if value is not None else None


def _round_average(value: float | None) -> float | None:
    return round(value, 1) if value is not None else None


def _filters(
    current_user: User,
    *,
    status: InterviewStatusFilter | None,
    interview_type: InterviewTypeFilter | None,
    difficulty: DifficultyFilter | None,
    target_role: str | None,
) -> list:
    conditions = [Interview.user_id == current_user.id]
    if status:
        conditions.append(Interview.status == status)
    if interview_type:
        conditions.append(Interview.interview_type == interview_type)
    if difficulty:
        conditions.append(Interview.difficulty == difficulty)
    if target_role:
        cleaned_role = target_role.strip()
        if cleaned_role:
            conditions.append(Interview.target_role.ilike(f"%{cleaned_role}%"))
    return conditions


def _ordered_statement(statement, sort: InterviewSort):
    started_at = Interview.started_at
    completed_at = Interview.completed_at
    activity_date = func.coalesce(completed_at, started_at)

    if sort == "oldest":
        return statement.order_by(
            activity_date.asc().nulls_last(),
            Interview.id.asc(),
        )
    if sort == "highest_score":
        return statement.order_by(
            Interview.overall_score.is_(None),
            Interview.overall_score.desc(),
            completed_at.desc().nulls_last(),
            started_at.desc().nulls_last(),
            Interview.id.desc(),
        )
    if sort == "lowest_score":
        return statement.order_by(
            Interview.overall_score.is_(None),
            Interview.overall_score.asc(),
            completed_at.desc().nulls_last(),
            started_at.desc().nulls_last(),
            Interview.id.desc(),
        )
    return statement.order_by(
        activity_date.desc().nulls_last(),
        Interview.id.desc(),
    )


def list_interview_summaries(
    db: Session,
    current_user: User,
    *,
    page: int,
    page_size: int,
    status: InterviewStatusFilter | None = None,
    interview_type: InterviewTypeFilter | None = None,
    difficulty: DifficultyFilter | None = None,
    target_role: str | None = None,
    sort: InterviewSort = "newest",
) -> PaginatedInterviews:
    conditions = _filters(
        current_user,
        status=status,
        interview_type=interview_type,
        difficulty=difficulty,
        target_role=target_role,
    )
    total = db.scalar(select(func.count()).select_from(Interview).where(*conditions)) or 0
    total_pages = ceil(total / page_size) if total else 0
    offset = (page - 1) * page_size

    statement = (
        select(Interview)
        .options(selectinload(Interview.questions), selectinload(Interview.resume))
        .where(*conditions)
        .offset(offset)
        .limit(page_size)
    )
    interviews = db.scalars(_ordered_statement(statement, sort)).all()

    return PaginatedInterviews(
        interviews=[
            InterviewSummary(
                id=interview.id,
                target_role=interview.target_role,
                interview_type=interview.interview_type,
                difficulty=interview.difficulty,
                status=interview.status,
                overall_score=_score_value(interview.overall_score),
                started_at=interview.started_at,
                completed_at=interview.completed_at,
                resume_filename=(
                    interview.resume.original_filename if interview.resume else None
                ),
                answered_count=sum(
                    1 for question in interview.questions if question.user_answer
                ),
                total_questions=len(interview.questions) or QUESTION_COUNT,
            )
            for interview in interviews
        ],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


def get_interview_analytics_summary(
    db: Session,
    current_user: User,
) -> InterviewAnalyticsSummary:
    user_filter = Interview.user_id == current_user.id
    scored_filter = and_(
        user_filter,
        Interview.status == "completed",
        VALID_SCORE_CONDITION,
    )

    total_interviews = (
        db.scalar(select(func.count()).select_from(Interview).where(user_filter)) or 0
    )
    completed_interviews = (
        db.scalar(
            select(func.count()).select_from(Interview).where(
                user_filter,
                Interview.status == "completed",
            )
        )
        or 0
    )
    in_progress_interviews = (
        db.scalar(
            select(func.count()).select_from(Interview).where(
                user_filter,
                Interview.status == "in_progress",
            )
        )
        or 0
    )
    average_completed_score = _round_average(
        db.scalar(select(func.avg(Interview.overall_score)).where(scored_filter)),
    )
    highest_score = _score_value(
        db.scalar(select(func.max(Interview.overall_score)).where(scored_filter)),
    )
    latest_completed_score = _score_value(
        db.scalar(
            select(Interview.overall_score)
            .where(scored_filter)
            .order_by(
                Interview.completed_at.desc().nulls_last(),
                Interview.started_at.desc().nulls_last(),
                Interview.id.desc(),
            )
            .limit(1)
        ),
    )
    most_practised_target_role = db.scalar(
        select(Interview.target_role)
        .where(user_filter)
        .group_by(Interview.target_role)
        .order_by(func.count(Interview.id).desc(), func.lower(Interview.target_role).asc())
        .limit(1)
    )

    trend_rows = list(
        db.execute(
            select(
                Interview.id,
                Interview.completed_at,
                Interview.started_at,
                Interview.target_role,
                Interview.interview_type,
                Interview.overall_score,
            )
            .where(scored_filter)
            .order_by(
                Interview.completed_at.desc().nulls_last(),
                Interview.started_at.desc().nulls_last(),
                Interview.id.desc(),
            )
            .limit(MAX_TREND_ITEMS)
        )
    )
    score_trend = [
        ScoreTrendItem(
            interview_id=row.id,
            date=row.completed_at or row.started_at,
            target_role=row.target_role,
            interview_type=row.interview_type,
            score=float(row.overall_score),
        )
        for row in reversed(trend_rows)
        if row.completed_at or row.started_at
    ]

    average_score_by_type = [
        ScoreByTypeItem(
            interview_type=row.interview_type,
            average_score=round(float(row.average_score), 1),
            count=row.count,
        )
        for row in db.execute(
            select(
                Interview.interview_type,
                func.avg(Interview.overall_score).label("average_score"),
                func.count(Interview.id).label("count"),
            )
            .where(scored_filter)
            .group_by(Interview.interview_type)
            .order_by(Interview.interview_type.asc())
        )
    ]

    return InterviewAnalyticsSummary(
        total_interviews=total_interviews,
        completed_interviews=completed_interviews,
        in_progress_interviews=in_progress_interviews,
        average_completed_score=average_completed_score,
        highest_score=highest_score,
        latest_completed_score=latest_completed_score,
        most_practised_target_role=most_practised_target_role,
        score_trend=score_trend,
        average_score_by_type=average_score_by_type,
    )
