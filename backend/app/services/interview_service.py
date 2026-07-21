import re
import string
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.ai.answer_evaluator import AnswerEvaluationResult, evaluate_interview_answers
from app.ai.evaluation_prompts import EvaluationAnswer
from app.ai.prompts import safe_resume_context
from app.ai.question_generator import generate_interview_questions
from app.data.interview_questions import INTERVIEW_QUESTIONS
from app.models import Interview, InterviewQuestion, Resume, User

MIN_QUESTION_COUNT = 5
MAX_QUESTION_COUNT = 30
DEFAULT_QUESTION_COUNT = 10
LEGACY_QUESTION_COUNT = 5
SUPPORTED_TIME_LIMITS = {15, 30, 45, 60}
SUPPORTED_EVALUATION_STYLES = {"beginner_friendly", "balanced", "strict"}
SUPPORTED_ANSWER_MODES = {"text"}


def _question_key(value: str) -> str:
    normalized = re.sub(r"\s+", " ", value).strip().casefold()
    normalized = normalized.translate(str.maketrans("", "", string.punctuation))
    return re.sub(r"\s+", " ", normalized).strip()

PREDEFINED_TARGET_ROLES = {
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Software Engineer",
    "Data Analyst",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
}
CUSTOM_ROLE_OPTION = "Custom Role"


def _get_question_set(interview_type: str, difficulty: str) -> list[str]:
    questions = INTERVIEW_QUESTIONS.get(interview_type, {}).get(difficulty)
    if questions is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choose a valid interview type and difficulty",
        )
    return questions


def _validate_question_count(question_count: int) -> int:
    if not MIN_QUESTION_COUNT <= question_count <= MAX_QUESTION_COUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question count must be between 5 and 30",
        )
    return question_count


def _validate_time_limit(time_limit_minutes: int | None) -> int | None:
    if time_limit_minutes is not None and time_limit_minutes not in SUPPORTED_TIME_LIMITS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choose a valid time limit",
        )
    return time_limit_minutes


def _validate_evaluation_style(evaluation_style: str) -> str:
    if evaluation_style not in SUPPORTED_EVALUATION_STYLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choose a valid evaluation style",
        )
    return evaluation_style


def _validate_answer_mode(answer_mode: str) -> str:
    if answer_mode not in SUPPORTED_ANSWER_MODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only text answers are supported",
        )
    return answer_mode


def validate_target_role(target_role: str, custom_role: str | None = None) -> str:
    if target_role in PREDEFINED_TARGET_ROLES:
        return target_role

    if target_role == CUSTOM_ROLE_OPTION:
        cleaned = (custom_role or "").strip()
        if not 2 <= len(cleaned) <= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom role must be between 2 and 100 characters",
            )
        return cleaned

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Choose a valid target role",
    )


def _answered_count(interview: Interview) -> int:
    return sum(1 for question in interview.questions if question.user_answer)


def _actual_question_count(interview: Interview) -> int:
    return len(interview.questions) or getattr(interview, "question_count", 0) or LEGACY_QUESTION_COUNT


def _load_owned_interview(
    db: Session,
    current_user: User,
    interview_id: UUID,
) -> Interview:
    interview = db.scalar(
        select(Interview)
        .options(selectinload(Interview.questions), selectinload(Interview.resume))
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
    target_role: str,
    custom_role: str | None = None,
    resume_id: UUID | None = None,
    question_count: int = DEFAULT_QUESTION_COUNT,
    time_limit_minutes: int | None = None,
    evaluation_style: str = "balanced",
    answer_mode: str = "text",
) -> tuple[Interview, str]:
    _get_question_set(interview_type, difficulty)
    question_count = _validate_question_count(question_count)
    time_limit_minutes = _validate_time_limit(time_limit_minutes)
    evaluation_style = _validate_evaluation_style(evaluation_style)
    answer_mode = _validate_answer_mode(answer_mode)
    final_target_role = validate_target_role(target_role, custom_role)
    resume = _load_usable_resume_analysis(db, current_user, resume_id)
    generated = generate_interview_questions(
        target_role=final_target_role,
        interview_type=interview_type,
        difficulty=difficulty,
        resume_context=safe_resume_context(resume.analysis_data) if resume else None,
        question_count=question_count,
    )
    if len({_question_key(question) for question in generated.questions}) != len(
        generated.questions
    ):
        raise RuntimeError("Generated interview questions must be unique")
    if len(generated.questions) != question_count:
        raise RuntimeError("Generated interview questions did not match requested count")
    interview = Interview(
        user_id=current_user.id,
        resume_id=resume.id if resume else None,
        interview_type=interview_type,
        difficulty=difficulty,
        target_role=final_target_role,
        status="in_progress",
        question_count=question_count,
        time_limit_minutes=time_limit_minutes,
        evaluation_style=evaluation_style,
        answer_mode=answer_mode,
        started_at=datetime.now(UTC),
    )
    interview.questions = [
        InterviewQuestion(question_text=question, sequence_number=index)
        for index, question in enumerate(generated.questions, start=1)
    ]

    db.add(interview)
    db.commit()
    db.refresh(interview)
    return _load_owned_interview(db, current_user, interview.id), generated.source


def _load_usable_resume_analysis(
    db: Session,
    current_user: User,
    resume_id: UUID | None,
) -> Resume | None:
    if resume_id is None:
        return None

    resume = db.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
    )
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    if resume.analysis_status != "ready" or not isinstance(resume.analysis_data, dict):
        return None
    return resume


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
) -> tuple[Interview, str]:
    interview = _load_owned_interview(db, current_user, interview_id)
    actual_question_count = len(interview.questions)
    expected_count = actual_question_count if actual_question_count > 0 else _actual_question_count(interview)
    if expected_count <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview has no questions to evaluate",
        )
    if _answered_count(interview) < expected_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer all questions before completing the interview",
        )

    if _has_saved_evaluation(interview):
        return _load_owned_interview(db, current_user, interview_id), "fallback"

    evaluation = evaluate_interview_answers(
        target_role=interview.target_role,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        evaluation_style=interview.evaluation_style or "balanced",
        answers=[
            EvaluationAnswer(
                sequence_number=question.sequence_number,
                question=question.question_text,
                answer=question.user_answer or "",
            )
            for question in sorted(
                interview.questions,
                key=lambda item: item.sequence_number,
            )
        ],
        resume_context=(
            safe_resume_context(interview.resume.analysis_data)
            if interview.resume
            and interview.resume.analysis_status == "ready"
            and isinstance(interview.resume.analysis_data, dict)
            else None
        ),
    )
    _apply_evaluation(interview, evaluation)

    if interview.status != "completed":
        interview.status = "completed"
    if interview.completed_at is None:
        interview.completed_at = datetime.now(UTC)
    if interview.started_at and interview.completed_at:
        duration = int((interview.completed_at - interview.started_at).total_seconds())
        interview.duration_seconds = max(0, duration)

    db.commit()
    return _load_owned_interview(db, current_user, interview_id), evaluation.source


def _has_saved_evaluation(interview: Interview) -> bool:
    return (
        interview.status == "completed"
        and isinstance(interview.evaluation_data, dict)
        and interview.overall_score is not None
        and all(
            question.score is not None and question.feedback
            for question in interview.questions
        )
    )


def _apply_evaluation(
    interview: Interview,
    evaluation: AnswerEvaluationResult,
) -> None:
    by_sequence = {
        item.sequence_number: item for item in evaluation.question_evaluations
    }
    for question in interview.questions:
        question_evaluation = by_sequence[question.sequence_number]
        question.score = Decimal(str(question_evaluation.score))
        question.feedback = question_evaluation.feedback

    interview.overall_score = Decimal(str(evaluation.overall_score))
    interview.evaluation_data = evaluation.evaluation_data
