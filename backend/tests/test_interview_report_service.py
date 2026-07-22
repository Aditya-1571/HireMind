import unittest
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from fastapi import HTTPException

from app.services.interview_report_service import (
    build_interview_report,
    get_interview_report,
    performance_level,
)


def question(
    sequence_number: int,
    *,
    text: str = "Explain API validation.",
    answer: str | None = "I validate input and return clear errors.",
    score: Decimal | None = Decimal("8"),
    feedback: str | None = "Relevant answer.",
) -> SimpleNamespace:
    return SimpleNamespace(
        sequence_number=sequence_number,
        question_text=text,
        user_answer=answer,
        score=score,
        feedback=feedback,
    )


def interview(**overrides: object) -> SimpleNamespace:
    started_at = datetime(2026, 7, 23, 8, 0, tzinfo=UTC)
    completed_at = started_at + timedelta(minutes=20)
    values = {
        "id": uuid4(),
        "user_id": uuid4(),
        "target_role": "Backend Developer",
        "interview_type": "Technical",
        "difficulty": "Medium",
        "status": "completed",
        "question_count": 2,
        "time_limit_minutes": None,
        "evaluation_style": "balanced",
        "answer_mode": "text",
        "overall_score": Decimal("80"),
        "evaluation_data": {
            "overall_feedback": "Good technical clarity.",
            "strengths": ["Clear structure"],
            "improvements": ["API validation", "API validation"],
            "question_evaluations": [
                {
                    "sequence_number": 2,
                    "strength": "Good example",
                    "improvement": "Add tradeoffs",
                },
                {
                    "sequence_number": 1,
                    "strength": "Clear answer",
                    "improvement": "Add edge cases",
                },
            ],
        },
        "started_at": started_at,
        "completed_at": completed_at,
        "duration_seconds": None,
        "questions": [
            question(2, text="How would you debug API failures?", score=Decimal("7")),
            question(1, text="Explain API validation.", score=Decimal("9")),
        ],
        "resume": SimpleNamespace(
            extracted_text="raw resume text",
            email="candidate@example.com",
            phone="1234567890",
        ),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class FakeDb:
    def __init__(self, value: object) -> None:
        self.value = value

    def scalar(self, _statement: object) -> object:
        return self.value


class InterviewReportServiceTests(unittest.TestCase):
    def test_performance_labels(self) -> None:
        self.assertEqual(performance_level(95), "Excellent")
        self.assertEqual(performance_level(80), "Strong")
        self.assertEqual(performance_level(65), "Developing")
        self.assertEqual(performance_level(45), "Needs Improvement")
        self.assertEqual(performance_level(20), "Beginner")
        self.assertIsNone(performance_level(None))

    def test_completed_interview_produces_report(self) -> None:
        report = build_interview_report(interview())

        self.assertEqual(report.summary["overall_score"], 80.0)
        self.assertEqual(report.summary["performance_level"], "Strong")
        self.assertEqual(report.metrics["answered_questions"], 2)
        self.assertEqual(report.metrics["total_questions"], 2)
        self.assertEqual(report.metrics["completion_rate"], 100.0)

    def test_invalid_or_other_user_interview_returns_404(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            get_interview_report(FakeDb(None), SimpleNamespace(id=uuid4()), uuid4())

        self.assertEqual(raised.exception.status_code, 404)

    def test_in_progress_interview_is_rejected(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            get_interview_report(
                FakeDb(interview(status="in_progress")),
                SimpleNamespace(id=uuid4()),
                uuid4(),
            )

        self.assertEqual(raised.exception.status_code, 409)

    def test_old_interview_without_new_fields_is_handled(self) -> None:
        old_interview = interview(
            question_count=None,
            time_limit_minutes=None,
            evaluation_style=None,
            answer_mode=None,
            duration_seconds=None,
        )
        report = build_interview_report(old_interview)

        self.assertEqual(report.interview["question_count"], 2)
        self.assertEqual(report.interview["evaluation_style"], "balanced")
        self.assertEqual(report.interview["answer_mode"], "text")
        self.assertIsNone(report.interview["time_limit_minutes"])

    def test_missing_evaluation_data_and_score_are_handled(self) -> None:
        report = build_interview_report(
            interview(
                overall_score=None,
                evaluation_data=None,
                questions=[question(1, score=None, feedback=None)],
                question_count=1,
            )
        )

        self.assertIsNone(report.summary["overall_score"])
        self.assertIsNone(report.summary["overall_feedback"])
        self.assertEqual(report.summary["strengths"], [])
        self.assertEqual(report.summary["improvements"], [])
        self.assertIsNone(report.metrics["average_question_score"])

    def test_overall_score_is_derived_from_question_scores(self) -> None:
        report = build_interview_report(
            interview(
                overall_score=None,
                questions=[
                    question(1, score=Decimal("5")),
                    question(2, score=Decimal("10")),
                ],
            )
        )

        self.assertEqual(report.summary["overall_score"], 75.0)

    def test_duration_fallback_and_negative_guard(self) -> None:
        started_at = datetime(2026, 7, 23, 9, 0, tzinfo=UTC)
        completed_at = started_at - timedelta(minutes=5)
        report = build_interview_report(
            interview(
                duration_seconds=None,
                started_at=started_at,
                completed_at=completed_at,
            )
        )

        self.assertEqual(report.interview["duration_seconds"], 0)

    def test_empty_questions_do_not_divide_by_zero(self) -> None:
        report = build_interview_report(interview(questions=[], question_count=0))

        self.assertEqual(report.metrics["answered_questions"], 0)
        self.assertEqual(report.metrics["total_questions"], 0)
        self.assertIsNone(report.metrics["completion_rate"])

    def test_questions_are_sorted_by_sequence_number(self) -> None:
        report = build_interview_report(interview())

        self.assertEqual([item.sequence_number for item in report.questions], [1, 2])

    def test_recommendations_use_deduplicated_stored_improvements(self) -> None:
        report = build_interview_report(interview())

        self.assertEqual(report.recommendations["topics"][0], "API validation")
        self.assertEqual(len(report.recommendations["topics"]), len(set(report.recommendations["topics"])))

    def test_recommended_question_count_stays_within_bounds(self) -> None:
        high_score_report = build_interview_report(
            interview(question_count=30, overall_score=Decimal("90"))
        )
        low_score_report = build_interview_report(
            interview(question_count=4, overall_score=Decimal("50"))
        )

        self.assertEqual(
            high_score_report.recommendations["next_interview"]["question_count"],
            30,
        )
        self.assertEqual(
            low_score_report.recommendations["next_interview"]["question_count"],
            5,
        )

    def test_no_sensitive_resume_fields_are_included(self) -> None:
        report = build_interview_report(interview())
        text = str(report)

        self.assertNotIn("candidate@example.com", text)
        self.assertNotIn("1234567890", text)
        self.assertNotIn("raw resume text", text)


if __name__ == "__main__":
    unittest.main()
