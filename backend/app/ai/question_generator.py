import json
import re
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.ai.ollama_client import (
    OllamaGenerationError,
    OllamaGenerationTimeoutError,
    OllamaModelMissingError,
    OllamaUnavailableError,
    build_ollama_client,
)
from app.ai.prompts import build_question_generation_prompt
from app.config import settings
from app.data.interview_questions import INTERVIEW_QUESTIONS, QUESTION_COUNT

QuestionCategory = Literal["hr", "technical"]


class ModelQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(min_length=1, max_length=300)
    category: QuestionCategory
    difficulty: Literal["easy", "medium", "hard"]


class ModelQuestionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    questions: list[ModelQuestion]


@dataclass(frozen=True)
class GeneratedQuestions:
    questions: list[str]
    source: Literal["ai", "fallback"]


class QuestionValidationError(Exception):
    def __init__(self, retry_note: str) -> None:
        self.retry_note = retry_note
        super().__init__(retry_note)


def _normalized_question(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _expected_mix(interview_type: str) -> dict[str, int]:
    if interview_type == "HR":
        return {"hr": 5, "technical": 0}
    if interview_type == "Technical":
        return {"hr": 0, "technical": 5}
    return {"hr": 2, "technical": 3}


def _schema() -> dict:
    return {
        "type": "object",
        "properties": {
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "category": {"type": "string", "enum": ["hr", "technical"]},
                        "difficulty": {
                            "type": "string",
                            "enum": ["easy", "medium", "hard"],
                        },
                    },
                    "required": ["question", "category", "difficulty"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["questions"],
        "additionalProperties": False,
    }


def _strip_json_fence(raw_response: str) -> str:
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _validate_model_output(
    raw_response: str,
    *,
    interview_type: str,
    difficulty: str,
) -> list[str]:
    try:
        payload = json.loads(_strip_json_fence(raw_response))
        parsed = ModelQuestionResponse.model_validate(payload)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise QuestionValidationError("invalid JSON") from exc

    if len(parsed.questions) != QUESTION_COUNT:
        raise QuestionValidationError("incorrect question count")

    expected_difficulty = difficulty.lower()
    questions: list[str] = []
    seen: set[str] = set()
    counts = {"hr": 0, "technical": 0}
    for item in parsed.questions:
        question = _normalized_question(item.question)
        if not question:
            raise QuestionValidationError("empty questions")
        key = question.casefold()
        if key in seen:
            raise QuestionValidationError("duplicate questions")
        seen.add(key)
        if item.difficulty != expected_difficulty:
            raise QuestionValidationError("wrong difficulty")
        counts[item.category] += 1
        questions.append(question)

    if counts != _expected_mix(interview_type):
        raise QuestionValidationError("wrong category mix")

    return questions


def _fallback_questions(interview_type: str, difficulty: str) -> GeneratedQuestions:
    questions = INTERVIEW_QUESTIONS.get(interview_type, {}).get(difficulty, [])
    if len(questions) < QUESTION_COUNT:
        raise RuntimeError("Static question fallback is incomplete")
    return GeneratedQuestions(
        questions=questions[:QUESTION_COUNT],
        source="fallback",
    )


def generate_interview_questions(
    *,
    target_role: str,
    interview_type: str,
    difficulty: str,
    resume_context: dict[str, list[str]] | None,
) -> GeneratedQuestions:
    client = build_ollama_client(
        settings.ollama_base_url,
        settings.ollama_model,
        settings.ollama_timeout_seconds,
    )
    retry_note: str | None = None
    for _attempt in range(2):
        prompt = build_question_generation_prompt(
            target_role=target_role,
            interview_type=interview_type,
            difficulty=difficulty,
            resume_context=resume_context,
            retry_note=retry_note,
        )
        try:
            raw_response = client.generate_structured_response(prompt, "json")
            questions = _validate_model_output(
                raw_response,
                interview_type=interview_type,
                difficulty=difficulty,
            )
            return GeneratedQuestions(questions=questions, source="ai")
        except QuestionValidationError as exc:
            retry_note = exc.retry_note
            continue
        except (
            OllamaGenerationError,
            OllamaGenerationTimeoutError,
            OllamaModelMissingError,
            OllamaUnavailableError,
        ):
            break

    return _fallback_questions(interview_type, difficulty)
