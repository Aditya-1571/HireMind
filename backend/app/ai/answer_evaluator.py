import json
import re
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.ai.evaluation_prompts import (
    EvaluationStyle,
    EvaluationAnswer,
    build_answer_evaluation_prompt,
)
from app.ai.ollama_client import (
    OllamaGenerationError,
    OllamaGenerationTimeoutError,
    OllamaModelMissingError,
    OllamaUnavailableError,
    build_ollama_client,
)
from app.config import settings

EvaluationSource = Literal["ai", "fallback"]
MAX_FEEDBACK_LENGTH = 500
MAX_SUMMARY_ITEMS = 4


class ModelQuestionEvaluation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sequence_number: int
    score: int = Field(ge=0, le=10)
    feedback: str = Field(min_length=1, max_length=MAX_FEEDBACK_LENGTH)
    strength: str = Field(min_length=1, max_length=MAX_FEEDBACK_LENGTH)
    improvement: str = Field(min_length=1, max_length=MAX_FEEDBACK_LENGTH)


class ModelEvaluationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overall_feedback: str = Field(min_length=1, max_length=MAX_FEEDBACK_LENGTH)
    strengths: list[str] = Field(min_length=1, max_length=MAX_SUMMARY_ITEMS)
    improvements: list[str] = Field(min_length=1, max_length=MAX_SUMMARY_ITEMS)
    question_evaluations: list[ModelQuestionEvaluation]


@dataclass(frozen=True)
class QuestionEvaluation:
    sequence_number: int
    score: int
    feedback: str
    strength: str
    improvement: str


@dataclass(frozen=True)
class AnswerEvaluationResult:
    overall_score: int
    overall_feedback: str
    strengths: list[str]
    improvements: list[str]
    question_evaluations: list[QuestionEvaluation]
    source: EvaluationSource

    @property
    def evaluation_data(self) -> dict:
        return {
            "overall_feedback": self.overall_feedback,
            "strengths": self.strengths,
            "improvements": self.improvements,
            "question_evaluations": [
                {
                    "sequence_number": item.sequence_number,
                    "strength": item.strength,
                    "improvement": item.improvement,
                }
                for item in self.question_evaluations
            ],
        }


class EvaluationValidationError(Exception):
    def __init__(self, retry_note: str) -> None:
        self.retry_note = retry_note
        super().__init__(retry_note)


def _strip_json_fence(raw_response: str) -> str:
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _compact(value: str, max_length: int = MAX_FEEDBACK_LENGTH) -> str:
    cleaned = " ".join(value.split()).strip()
    if len(cleaned) <= max_length:
        return cleaned
    return cleaned[:max_length].rstrip()


def _overall_score(question_evaluations: list[QuestionEvaluation]) -> int:
    if not question_evaluations:
        return 0
    return round(
        sum(item.score for item in question_evaluations)
        / (len(question_evaluations) * 10)
        * 100,
    )


def _validate_model_output(
    raw_response: str,
    *,
    expected_sequences: set[int],
) -> AnswerEvaluationResult:
    try:
        payload = json.loads(_strip_json_fence(raw_response))
    except json.JSONDecodeError as exc:
        raise EvaluationValidationError("invalid JSON") from exc
    try:
        parsed = ModelEvaluationResponse.model_validate(payload)
    except ValidationError as exc:
        raise EvaluationValidationError("invalid fields or scores") from exc

    if len(parsed.question_evaluations) != len(expected_sequences):
        raise EvaluationValidationError("missing question evaluation")

    seen: set[int] = set()
    evaluations: list[QuestionEvaluation] = []
    for item in parsed.question_evaluations:
        if item.sequence_number in seen:
            raise EvaluationValidationError("duplicate sequence number")
        seen.add(item.sequence_number)
        if item.sequence_number not in expected_sequences:
            raise EvaluationValidationError("unknown sequence number")
        evaluations.append(
            QuestionEvaluation(
                sequence_number=item.sequence_number,
                score=item.score,
                feedback=_compact(item.feedback),
                strength=_compact(item.strength),
                improvement=_compact(item.improvement),
            ),
        )

    if seen != expected_sequences:
        raise EvaluationValidationError("missing question evaluation")

    strengths = [_compact(item, 180) for item in parsed.strengths]
    strengths = [item for item in strengths if item]
    improvements = [_compact(item, 180) for item in parsed.improvements]
    improvements = [item for item in improvements if item]
    if not strengths or not improvements:
        raise EvaluationValidationError("missing summary feedback")

    evaluations.sort(key=lambda item: item.sequence_number)
    return AnswerEvaluationResult(
        overall_score=_overall_score(evaluations),
        overall_feedback=_compact(parsed.overall_feedback),
        strengths=strengths,
        improvements=improvements,
        question_evaluations=evaluations,
        source="ai",
    )


def _tokenize(value: str) -> set[str]:
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}", value.lower())
    stop_words = {
        "and",
        "are",
        "for",
        "how",
        "the",
        "this",
        "that",
        "what",
        "when",
        "where",
        "why",
        "with",
        "you",
        "your",
    }
    return {word for word in words if word not in stop_words}


def _fallback_score(question: str, answer: str) -> int:
    cleaned = " ".join(answer.split()).strip()
    if not cleaned:
        return 0

    score = 1
    length = len(cleaned)
    if length >= 40:
        score += 1
    if length >= 120:
        score += 2
    if length >= 260:
        score += 1

    overlap = _tokenize(question) & _tokenize(cleaned)
    if overlap:
        score += 1
    if len(overlap) >= 3:
        score += 1

    example_markers = ("for example", "such as", "because", "result", "built", "used")
    if any(marker in cleaned.lower() for marker in example_markers):
        score += 1

    return min(score, 7)


def _fallback_evaluation(
    answers: list[EvaluationAnswer],
    evaluation_style: EvaluationStyle,
) -> AnswerEvaluationResult:
    evaluations: list[QuestionEvaluation] = []
    for item in answers:
        score = _fallback_score(item.question, item.answer)
        if score == 0:
            feedback = "No answer was available to evaluate."
            strength = "No clear strength was shown in this answer."
            improvement = "Provide a relevant answer with a clear example."
        elif score <= 3:
            feedback = "The answer is present but needs more detail and clearer connection to the question."
            strength = "The answer makes an initial attempt to respond."
            improvement = "Add specific details, reasoning, and an example."
        elif score <= 5:
            feedback = "The answer is understandable and partially developed, but could be more specific."
            strength = "The answer gives some relevant information."
            improvement = "Expand on the reasoning and connect it more directly to the role."
        else:
            feedback = "The answer is reasonably detailed and relevant, with room for sharper examples."
            strength = "The answer provides useful detail and communicates a clear response."
            improvement = "Make the example more concrete and include the outcome or impact."

        if evaluation_style == "beginner_friendly":
            feedback = f"{feedback} Focus next on one concrete improvement step."
        elif evaluation_style == "strict":
            feedback = f"{feedback} A stronger answer should be more precise, complete, and evidence-backed."

        evaluations.append(
            QuestionEvaluation(
                sequence_number=item.sequence_number,
                score=score,
                feedback=feedback,
                strength=strength,
                improvement=improvement,
            ),
        )

    return AnswerEvaluationResult(
        overall_score=_overall_score(evaluations),
        overall_feedback=(
            "This standard evaluation is based on answer completeness, relevance, "
            "clarity, and use of examples. The selected evaluation style guided "
            "the feedback tone and expectations."
        ),
        strengths=[
            "Completed all interview answers.",
            "Provided responses that can be reviewed against each question.",
        ],
        improvements=[
            "Use more specific examples where possible.",
            "Connect each answer clearly to the target role and question.",
        ],
        question_evaluations=evaluations,
        source="fallback",
    )


def evaluate_interview_answers(
    *,
    target_role: str,
    interview_type: str,
    difficulty: str,
    evaluation_style: EvaluationStyle = "balanced",
    answers: list[EvaluationAnswer],
    resume_context: dict[str, list[str]] | None = None,
) -> AnswerEvaluationResult:
    if not 1 <= len(answers) <= 30:
        raise RuntimeError("Interview evaluation requires 1 to 30 answers")

    expected_sequences = {item.sequence_number for item in answers}
    if len(expected_sequences) != len(answers):
        raise RuntimeError("Interview evaluation requires unique question sequences")

    client = build_ollama_client(
        settings.ollama_base_url,
        settings.ollama_model,
        settings.ollama_timeout_seconds,
    )
    retry_note: str | None = None
    for _attempt in range(2):
        prompt = build_answer_evaluation_prompt(
            target_role=target_role,
            interview_type=interview_type,
            difficulty=difficulty,
            evaluation_style=evaluation_style,
            answers=answers,
            resume_context=resume_context,
            retry_note=retry_note,
        )
        try:
            raw_response = client.generate_structured_response(prompt, "json")
            return _validate_model_output(
                raw_response,
                expected_sequences=expected_sequences,
            )
        except EvaluationValidationError as exc:
            retry_note = exc.retry_note
            continue
        except (
            OllamaGenerationError,
            OllamaGenerationTimeoutError,
            OllamaModelMissingError,
            OllamaUnavailableError,
        ):
            break

    return _fallback_evaluation(answers, evaluation_style)
