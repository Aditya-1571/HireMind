import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Interview, User

MIN_RECOMMENDED_QUESTIONS = 5
MAX_RECOMMENDED_QUESTIONS = 30
MAX_RECOMMENDATION_TOPICS = 5


@dataclass(frozen=True)
class ReportQuestion:
    sequence_number: int
    question_text: str
    candidate_answer: str | None
    score: float | None
    feedback: str | None
    strength: str | None
    improvement: str | None


@dataclass(frozen=True)
class InterviewReport:
    interview: dict[str, Any]
    summary: dict[str, Any]
    metrics: dict[str, Any]
    questions: list[ReportQuestion]
    recommendations: dict[str, Any]


def performance_level(score: float | int | Decimal | None) -> str | None:
    value = _score_value(score)
    if value is None:
        return None
    if value >= 90:
        return "Excellent"
    if value >= 75:
        return "Strong"
    if value >= 60:
        return "Developing"
    if value >= 40:
        return "Needs Improvement"
    return "Beginner"


def get_interview_report(
    db: Session,
    current_user: User,
    interview_id: UUID,
) -> InterviewReport:
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
            detail="Interview report not found",
        )
    if interview.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complete the interview before viewing the report",
        )
    return build_interview_report(interview)


def build_interview_report(interview: Interview) -> InterviewReport:
    questions = sorted(interview.questions or [], key=lambda item: item.sequence_number)
    answered_count = sum(1 for question in questions if _has_answer(question.user_answer))
    total_questions = len(questions)
    question_count = getattr(interview, "question_count", None) or total_questions
    duration_seconds = _duration_seconds(
        getattr(interview, "duration_seconds", None),
        interview.started_at,
        interview.completed_at,
    )
    question_strengths = _question_strengths(interview)
    report_questions = [
        ReportQuestion(
            sequence_number=question.sequence_number,
            question_text=question.question_text,
            candidate_answer=question.user_answer,
            score=_score_value(question.score),
            feedback=question.feedback,
            strength=question_strengths.get(question.sequence_number, {}).get("strength"),
            improvement=question_strengths.get(question.sequence_number, {}).get(
                "improvement"
            ),
        )
        for question in questions
    ]

    overall_score = _overall_score(interview, report_questions)
    strengths = _text_list(_evaluation_data(interview).get("strengths"))
    improvements = _text_list(_evaluation_data(interview).get("improvements"))
    topics = _recommendation_topics(improvements, report_questions)

    return InterviewReport(
        interview={
            "id": interview.id,
            "target_role": interview.target_role,
            "interview_type": interview.interview_type,
            "difficulty": interview.difficulty,
            "evaluation_style": getattr(interview, "evaluation_style", None)
            or "balanced",
            "answer_mode": getattr(interview, "answer_mode", None) or "text",
            "question_count": question_count or total_questions,
            "answered_count": answered_count,
            "started_at": interview.started_at,
            "completed_at": interview.completed_at,
            "duration_seconds": duration_seconds,
            "time_limit_minutes": getattr(interview, "time_limit_minutes", None),
        },
        summary={
            "overall_score": overall_score,
            "performance_level": performance_level(overall_score),
            "overall_feedback": _overall_feedback(interview),
            "strengths": strengths,
            "improvements": improvements,
        },
        metrics={
            "average_question_score": _average_question_score(report_questions),
            "completion_rate": _completion_rate(answered_count, total_questions),
            "answered_questions": answered_count,
            "total_questions": total_questions,
        },
        questions=report_questions,
        recommendations={
            "topics": topics,
            "next_interview": {
                "target_role": interview.target_role,
                "difficulty": _recommended_difficulty(interview.difficulty, overall_score),
                "interview_type": interview.interview_type,
                "question_count": _recommended_question_count(
                    int(question_count or total_questions or MIN_RECOMMENDED_QUESTIONS),
                    overall_score,
                ),
                "focus_topics": topics,
            },
        },
    )


def _score_value(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _evaluation_data(interview: Interview) -> dict[str, Any]:
    return interview.evaluation_data if isinstance(interview.evaluation_data, dict) else {}


def _text_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [" ".join(item.split()).strip() for item in value if isinstance(item, str) and item.strip()]


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
        if isinstance(sequence_number, int):
            result[sequence_number] = {
                "strength": strength.strip() if isinstance(strength, str) else "",
                "improvement": improvement.strip()
                if isinstance(improvement, str)
                else "",
            }
    return result


def _has_answer(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _duration_seconds(
    stored_duration: int | None,
    started_at: datetime | None,
    completed_at: datetime | None,
) -> int | None:
    if isinstance(stored_duration, int):
        return max(0, stored_duration)
    if started_at and completed_at:
        return max(0, int((completed_at - started_at).total_seconds()))
    return None


def _overall_feedback(interview: Interview) -> str | None:
    value = _evaluation_data(interview).get("overall_feedback")
    return " ".join(value.split()).strip() if isinstance(value, str) and value.strip() else None


def _overall_score(
    interview: Interview,
    questions: list[ReportQuestion],
) -> float | None:
    stored = _score_value(interview.overall_score)
    if stored is not None:
        return max(0, min(100, round(stored, 1)))

    scored_questions = [item.score for item in questions if item.score is not None]
    if not scored_questions:
        return None
    return round(sum(scored_questions) / (len(scored_questions) * 10) * 100, 1)


def _average_question_score(questions: list[ReportQuestion]) -> float | None:
    scored_questions = [item.score for item in questions if item.score is not None]
    if not scored_questions:
        return None
    return round(sum(scored_questions) / len(scored_questions), 1)


def _completion_rate(answered_count: int, total_questions: int) -> float | None:
    if total_questions <= 0:
        return None
    return round(answered_count / total_questions * 100, 1)


def _recommended_difficulty(current: str, score: float | None) -> str:
    order = ["Easy", "Medium", "Hard"]
    if current not in order or score is None:
        return current
    index = order.index(current)
    if score >= 85:
        return order[min(index + 1, len(order) - 1)]
    if score < 60:
        return order[max(index - 1, 0)]
    return current


def _recommended_question_count(current_count: int, score: float | None) -> int:
    current_count = max(
        MIN_RECOMMENDED_QUESTIONS,
        min(MAX_RECOMMENDED_QUESTIONS, current_count),
    )
    if score is not None and score >= 75:
        return min(current_count + 5, MAX_RECOMMENDED_QUESTIONS)
    return current_count


def _recommendation_topics(
    improvements: list[str],
    questions: list[ReportQuestion],
) -> list[str]:
    topics: list[str] = []
    low_score_text = " ".join(
        question.question_text
        for question in questions
        if question.score is not None and question.score < 6
    )
    sources = [*improvements]
    sources.extend(
        question.improvement or ""
        for question in questions
        if question.improvement
    )
    sources.extend(_meaningful_terms(low_score_text))

    seen: set[str] = set()
    for source in sources:
        for topic in _topic_candidates(source):
            key = topic.casefold()
            if key not in seen:
                seen.add(key)
                topics.append(topic)
            if len(topics) >= MAX_RECOMMENDATION_TOPICS:
                return topics
    return topics


def _topic_candidates(value: str) -> list[str]:
    cleaned = " ".join(value.split()).strip(" .,:;-")
    if not cleaned:
        return []
    generic = {
        "improve more",
        "do better",
        "practice more",
        "not found",
        "n/a",
        "none",
    }
    if cleaned.casefold() in generic:
        return []
    if len(cleaned) <= 80 and len(cleaned.split()) <= 8:
        return [cleaned]
    return _meaningful_terms(cleaned)


def _meaningful_terms(value: str) -> list[str]:
    stop_words = {
        "about",
        "answer",
        "better",
        "clear",
        "could",
        "detail",
        "example",
        "explain",
        "improve",
        "interview",
        "question",
        "relevant",
        "should",
        "specific",
        "stronger",
        "with",
        "your",
    }
    words = re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{2,}", value)
    counts: dict[str, int] = {}
    labels: dict[str, str] = {}
    for word in words:
        key = word.casefold()
        if key in stop_words:
            continue
        counts[key] = counts.get(key, 0) + 1
        labels.setdefault(key, word)
    ordered = sorted(counts, key=lambda key: (-counts[key], key))
    return [labels[key] for key in ordered[:MAX_RECOMMENDATION_TOPICS]]
