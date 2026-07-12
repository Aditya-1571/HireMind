from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.data.interview_questions import INTERVIEW_QUESTIONS, QUESTION_COUNT
from app.models import Interview, InterviewQuestion, User


def _get_question_set(interview_type: str, difficulty: str) -> list[str]:
    questions = INTERVIEW_QUESTIONS.get(interview_type, {}).get(difficulty)
    if questions is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choose a valid interview type and difficulty",
        )
    return questions[:QUESTION_COUNT]


def _answered_count(interview: Interview) -> int:
    return sum(1 for question in interview.questions if question.user_answer)


def _load_owned_interview(
    db: Session,
    current_user: User,
    interview_id: UUID,
) -> Interview:
    interview = db.scalar(
        select(Interview)
        .options(selectinload(Interview.questions))
        .where(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
    )
    if interview is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )
    return interview


def create_interview(
    db: Session,
    current_user: User,
    interview_type: str,
    difficulty: str,
) -> Interview:
    questions = _get_question_set(interview_type, difficulty)
    interview = Interview(
        user_id=current_user.id,
        interview_type=interview_type,
        difficulty=difficulty,
        status="in_progress",
        started_at=datetime.now(UTC),
    )
    interview.questions = [
        InterviewQuestion(question_text=question, sequence_number=index)
        for index, question in enumerate(questions, start=1)
    ]

    db.add(interview)
    db.commit()
    db.refresh(interview)
    return _load_owned_interview(db, current_user, interview.id)


def get_interview(
    db: Session,
    current_user: User,
    interview_id: UUID,
) -> Interview:
    return _load_owned_interview(db, current_user, interview_id)


def list_interviews(db: Session, current_user: User) -> list[Interview]:
    return list(
        db.scalars(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.user_id == current_user.id)
            .order_by(Interview.started_at.desc())
        ).all()
    )


def submit_answer(
    db: Session,
    current_user: User,
    interview_id: UUID,
    question_id: UUID,
    answer: str,
) -> Interview:
    cleaned_answer = answer.strip()
    if not cleaned_answer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer cannot be empty",
        )

    interview = _load_owned_interview(db, current_user, interview_id)
    if interview.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is already completed",
        )

    question = next(
        (item for item in interview.questions if item.id == question_id),
        None,
    )
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question does not belong to this interview",
        )
    if question.user_answer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This question has already been answered",
        )

    question.user_answer = cleaned_answer
    db.commit()
    return _load_owned_interview(db, current_user, interview_id)


def complete_interview(
    db: Session,
    current_user: User,
    interview_id: UUID,
) -> Interview:
    interview = _load_owned_interview(db, current_user, interview_id)
    if _answered_count(interview) < QUESTION_COUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer all five questions before completing the interview",
        )

    if interview.status != "completed":
        interview.status = "completed"
        interview.completed_at = datetime.now(UTC)
        db.commit()

    return _load_owned_interview(db, current_user, interview_id)
