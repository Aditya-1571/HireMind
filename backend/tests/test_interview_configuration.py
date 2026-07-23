import json
import unittest
from unittest.mock import patch

from pydantic import ValidationError

from app.ai.evaluation_prompts import (
    MAX_ANSWER_LENGTH,
    EvaluationAnswer,
    build_answer_evaluation_prompt,
    prepare_evaluation_answers,
)
from app.ai.answer_evaluator import evaluate_interview_answers
from app.ai.ollama_client import OllamaUnavailableError
from app.ai.question_generator import _expected_mix, generate_interview_questions
from app.api.interviews import CreateInterviewRequest


def _question_payload(
    count: int,
    *,
    category: str = "technical",
    difficulty: str = "medium",
    start: int = 1,
) -> str:
    return json.dumps(
        {
            "questions": [
                {
                    "question": f"{category.title()} question {index}?",
                    "category": category,
                    "difficulty": difficulty,
                }
                for index in range(start, start + count)
            ]
        },
    )


class FakeQuestionClient:
    def __init__(self, responses: list[str]) -> None:
        self.responses = responses
        self.calls = 0

    def generate_structured_response(
        self,
        prompt: str,
        response_format: str = "json",
        num_predict: int = 700,
        temperature: float = 0.1,
    ) -> str:
        self.calls += 1
        if self.calls <= len(self.responses):
            return self.responses[self.calls - 1]
        return self.responses[-1]


class UnavailableClient:
    def generate_structured_response(self, *args: object, **kwargs: object) -> str:
        raise OllamaUnavailableError


class InterviewConfigurationTests(unittest.TestCase):
    def test_create_request_defaults_to_ten_questions(self) -> None:
        payload = CreateInterviewRequest.model_validate(
            {
                "interview_type": "Technical",
                "difficulty": "Medium",
                "target_role": "Software Engineer",
            },
        )

        self.assertEqual(payload.question_count, 10)
        self.assertIsNone(payload.time_limit_minutes)
        self.assertEqual(payload.evaluation_style, "balanced")
        self.assertEqual(payload.answer_mode, "text")

    def test_create_request_rejects_invalid_configuration_values(self) -> None:
        invalid_payloads = [
            {"question_count": 4},
            {"question_count": 31},
            {"question_count": True},
            {"question_count": 10.5},
            {"time_limit_minutes": 20},
            {"evaluation_style": "casual"},
            {"answer_mode": "voice"},
        ]
        base = {
            "interview_type": "Technical",
            "difficulty": "Medium",
            "target_role": "Software Engineer",
        }

        for invalid in invalid_payloads:
            with self.subTest(invalid=invalid):
                with self.assertRaises(ValidationError):
                    CreateInterviewRequest.model_validate({**base, **invalid})

    def test_create_request_accepts_supported_question_counts(self) -> None:
        base = {
            "interview_type": "Technical",
            "difficulty": "Medium",
            "target_role": "Software Engineer",
        }

        for question_count in (5, 10, 30):
            with self.subTest(question_count=question_count):
                payload = CreateInterviewRequest.model_validate(
                    {**base, "question_count": question_count},
                )
                self.assertEqual(payload.question_count, question_count)

    def test_ai_exact_question_count_is_accepted(self) -> None:
        client = FakeQuestionClient([_question_payload(10)])

        with patch("app.ai.question_generator.build_ollama_client", return_value=client):
            result = generate_interview_questions(
                target_role="Backend Developer",
                interview_type="Technical",
                difficulty="Medium",
                resume_context=None,
                question_count=10,
            )

        self.assertEqual(result.source, "ai")
        self.assertEqual(len(result.questions), 10)
        self.assertEqual(client.calls, 1)

    def test_ai_excess_is_trimmed_to_requested_count(self) -> None:
        client = FakeQuestionClient([_question_payload(12)])

        with patch("app.ai.question_generator.build_ollama_client", return_value=client):
            result = generate_interview_questions(
                target_role="Backend Developer",
                interview_type="Technical",
                difficulty="Medium",
                resume_context=None,
                question_count=10,
            )

        self.assertEqual(len(result.questions), 10)
        self.assertEqual(len(set(result.questions)), 10)

    def test_ai_shortage_retries_once_then_fills_with_fallback(self) -> None:
        client = FakeQuestionClient([_question_payload(4), _question_payload(4)])

        with patch("app.ai.question_generator.build_ollama_client", return_value=client):
            result = generate_interview_questions(
                target_role="Backend Developer",
                interview_type="Technical",
                difficulty="Medium",
                resume_context=None,
                question_count=10,
            )

        self.assertEqual(client.calls, 2)
        self.assertEqual(len(result.questions), 10)
        self.assertEqual(len(set(result.questions)), 10)

    def test_duplicate_ai_questions_are_removed_before_fallback_fill(self) -> None:
        duplicate_payload = json.dumps(
            {
                "questions": [
                    {
                        "question": "How would you debug an API?",
                        "category": "technical",
                        "difficulty": "medium",
                    },
                    {
                        "question": "How would you debug an API",
                        "category": "technical",
                        "difficulty": "medium",
                    },
                ]
            },
        )
        client = FakeQuestionClient([duplicate_payload, duplicate_payload])

        with patch("app.ai.question_generator.build_ollama_client", return_value=client):
            result = generate_interview_questions(
                target_role="Backend Developer",
                interview_type="Technical",
                difficulty="Medium",
                resume_context=None,
                question_count=10,
            )

        self.assertEqual(len(result.questions), 10)
        self.assertEqual(len({question.lower().rstrip("?") for question in result.questions}), 10)

    def test_fallback_supports_thirty_unique_questions(self) -> None:
        for interview_type in ("HR", "Technical", "Mixed"):
            with self.subTest(interview_type=interview_type):
                with patch(
                    "app.ai.question_generator.build_ollama_client",
                    return_value=UnavailableClient(),
                ):
                    result = generate_interview_questions(
                        target_role="Full Stack Developer",
                        interview_type=interview_type,
                        difficulty="Medium",
                        resume_context={
                            "skills": ["React", "Node.js"],
                            "projects": ["Inventory Platform"],
                            "experience": ["Retail software team"],
                        },
                        question_count=30,
                    )

                self.assertEqual(result.source, "fallback")
                self.assertEqual(len(result.questions), 30)
                self.assertEqual(len(set(result.questions)), 30)

    def test_mixed_interview_uses_reasonable_distribution(self) -> None:
        self.assertEqual(_expected_mix("Mixed", 10), {"hr": 4, "technical": 6})
        with patch(
            "app.ai.question_generator.build_ollama_client",
            return_value=UnavailableClient(),
        ):
            result = generate_interview_questions(
                target_role="Software Engineer",
                interview_type="Mixed",
                difficulty="Medium",
                resume_context=None,
                question_count=10,
            )

        self.assertEqual(len(result.questions), 10)

    def test_evaluation_fallback_processes_variable_answer_count(self) -> None:
        answers = [
            EvaluationAnswer(
                sequence_number=index,
                question=f"Question {index}?",
                answer=(
                    "I would explain the tradeoff, give an example, and describe "
                    "the result for the team."
                ),
            )
            for index in range(1, 11)
        ]

        with patch(
            "app.ai.answer_evaluator.build_ollama_client",
            return_value=UnavailableClient(),
        ):
            result = evaluate_interview_answers(
                target_role="Software Engineer",
                interview_type="Technical",
                difficulty="Medium",
                evaluation_style="strict",
                answers=answers,
            )

        self.assertEqual(result.source, "fallback")
        self.assertEqual(len(result.question_evaluations), 10)
        self.assertTrue(0 <= result.overall_score <= 100)

    def test_evaluation_style_changes_prompt_guidance(self) -> None:
        answers = [
            EvaluationAnswer(
                sequence_number=1,
                question="Explain API validation.",
                answer="I validate input and return clear errors.",
            )
        ]

        beginner = build_answer_evaluation_prompt(
            target_role="Software Engineer",
            interview_type="Technical",
            difficulty="Medium",
            evaluation_style="beginner_friendly",
            answers=answers,
        )
        strict = build_answer_evaluation_prompt(
            target_role="Software Engineer",
            interview_type="Technical",
            difficulty="Medium",
            evaluation_style="strict",
            answers=answers,
        )

        self.assertIn("supportive tone", beginner)
        self.assertIn("higher expectations", strict)
        self.assertNotEqual(beginner, strict)

    def test_oversized_answers_are_truncated_without_dropping_questions(self) -> None:
        answers = [
            EvaluationAnswer(
                sequence_number=index,
                question=f"Question {index}?",
                answer="detail " * 500,
            )
            for index in range(1, 31)
        ]

        prepared = prepare_evaluation_answers(answers)

        self.assertEqual(len(prepared), 30)
        self.assertTrue(all(len(item.answer) <= MAX_ANSWER_LENGTH for item in prepared))


if __name__ == "__main__":
    unittest.main()
