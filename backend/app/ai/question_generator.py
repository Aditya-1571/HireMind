import json
import math
import re
import string
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
from app.data.interview_questions import INTERVIEW_QUESTIONS

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


@dataclass(frozen=True)
class QuestionCandidate:
    question: str
    category: QuestionCategory


class QuestionValidationError(Exception):
    def __init__(self, retry_note: str) -> None:
        self.retry_note = retry_note
        super().__init__(retry_note)


def _normalized_question(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _question_key(value: str) -> str:
    normalized = _normalized_question(value).casefold()
    normalized = normalized.translate(str.maketrans("", "", string.punctuation))
    return re.sub(r"\s+", " ", normalized).strip()


def _expected_mix(interview_type: str, question_count: int) -> dict[str, int]:
    if interview_type == "HR":
        return {"hr": question_count, "technical": 0}
    if interview_type == "Technical":
        return {"hr": 0, "technical": question_count}
    technical_target = math.ceil(question_count * 0.6)
    return {"hr": question_count - technical_target, "technical": technical_target}


def _strip_json_fence(raw_response: str) -> str:
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _allowed_categories(interview_type: str) -> set[str]:
    if interview_type == "HR":
        return {"hr"}
    if interview_type == "Technical":
        return {"technical"}
    return {"hr", "technical"}


def _validate_model_output(
    raw_response: str,
    *,
    interview_type: str,
    difficulty: str,
) -> list[QuestionCandidate]:
    try:
        payload = json.loads(_strip_json_fence(raw_response))
    except json.JSONDecodeError as exc:
        raise QuestionValidationError("invalid JSON") from exc
    try:
        parsed = ModelQuestionResponse.model_validate(payload)
    except ValidationError as exc:
        raise QuestionValidationError("invalid fields") from exc

    expected_difficulty = difficulty.lower()
    allowed_categories = _allowed_categories(interview_type)
    candidates: list[QuestionCandidate] = []
    seen: set[str] = set()
    for item in parsed.questions:
        question = _normalized_question(item.question)
        key = _question_key(question)
        if not question:
            continue
        if key in seen:
            continue
        if item.difficulty != expected_difficulty:
            continue
        if item.category not in allowed_categories:
            continue
        seen.add(key)
        candidates.append(QuestionCandidate(question=question, category=item.category))
    return candidates


def _context_values(resume_context: dict[str, list[str]] | None, key: str) -> list[str]:
    values = (resume_context or {}).get(key)
    return values if isinstance(values, list) else []


def _fallback_templates(
    *,
    target_role: str,
    difficulty: str,
    resume_context: dict[str, list[str]] | None,
    category: QuestionCategory,
) -> list[str]:
    skills = _context_values(resume_context, "skills")
    projects = _context_values(resume_context, "projects")
    experience = _context_values(resume_context, "experience")
    skill = skills[0] if skills else "a core tool or skill from your background"
    project = projects[0] if projects else "a recent project"
    experience_item = experience[0] if experience else "your previous learning or work"

    if category == "hr":
        return [
            f"Tell me about yourself and why you are preparing for a {target_role} role.",
            f"Why are you interested in this {target_role} opportunity?",
            "Describe a time you worked effectively with a team.",
            "How do you organize your work when deadlines are close?",
            "What are you hoping to learn in your next role?",
            "Tell me about a time you handled conflicting priorities.",
            "Describe a difficult conversation you handled professionally.",
            "How do you respond to feedback that you initially disagree with?",
            "What motivates you during a challenging project?",
            "How do you build trust with new teammates?",
            "Tell me about a major setback and how you recovered.",
            "Describe a time you influenced a decision without formal authority.",
            "How would you handle a teammate who repeatedly misses commitments?",
            "What tradeoff have you made between speed and quality?",
            "Describe a time you had to adapt to a significant change.",
            f"How would you explain your fit for a {target_role} position?",
            f"What part of {experience_item} best shows your professional growth?",
            f"How did you manage ownership or responsibility in {project}?",
            "Describe a time you learned something quickly to unblock work.",
            "How do you handle ambiguity when requirements are unclear?",
            "Tell me about a time you made a mistake and what changed afterward.",
            "How do you prioritize communication during a busy week?",
            "Describe your preferred way to collaborate with cross-functional partners.",
            "What does a high-quality work product mean to you?",
            "How do you decide when to ask for help?",
            "Describe a time you stayed calm under pressure.",
            "How do you keep improving after completing a project?",
            "What kind of manager or team environment helps you do your best work?",
            "Tell me about a goal you set and how you tracked progress.",
            f"How would you continue developing as a {target_role} over the next year?",
            "Describe a time you balanced independent work with team alignment.",
            "How do you handle repeated blockers on an important task?",
        ]

    return [
        f"Explain a core concept in {skill} that is important for a {target_role}.",
        f"How would you design a small but reliable feature for a {target_role} workflow?",
        f"Describe how you would debug a failing system related to {skill}.",
        f"What tradeoffs would you consider when choosing tools for {project}?",
        f"Walk me through how you would validate input and handle errors in {project}.",
        "How would you design pagination for a large API response?",
        "Explain how you would prevent duplicate form submissions.",
        "What are the tradeoffs between SQL and NoSQL databases?",
        "How would you structure validation between frontend and backend?",
        "Describe how authentication tokens should be handled securely.",
        "Design a reliable job processing system for long-running tasks.",
        "How would you investigate intermittent database latency?",
        "Explain how you would migrate a busy production table safely.",
        "How would you design rate limiting for a public API?",
        "Describe how you would make a service resilient to partial outages.",
        f"How would you test the most important behavior in {project}?",
        f"What performance bottlenecks might appear in {project}, and how would you measure them?",
        f"How would you monitor a production service used by a {target_role} team?",
        "Explain the difference between horizontal and vertical scaling.",
        "How would you choose between synchronous and asynchronous processing?",
        "How would you design secure file upload handling?",
        "Describe a strategy for database indexing and query optimization.",
        "How would you handle retries without causing duplicate side effects?",
        "What makes an API contract maintainable over time?",
        "How would you approach logging without exposing sensitive data?",
        "Describe how you would review a pull request for correctness and maintainability.",
        "How would you design a rollback plan for a risky deployment?",
        "Explain how caching can help and when it can create problems.",
        "How would you model permissions for different user roles?",
        "Describe how you would troubleshoot a memory or CPU spike in production.",
        "How would you split responsibilities between client and server code?",
        f"How would you improve {experience_item} if you had another iteration?",
    ]


def _fallback_candidates(
    *,
    interview_type: str,
    difficulty: str,
    target_role: str,
    resume_context: dict[str, list[str]] | None,
    category: QuestionCategory,
) -> list[QuestionCandidate]:
    questions: list[str] = []
    source_type = "HR" if category == "hr" else "Technical"
    questions.extend(INTERVIEW_QUESTIONS.get(source_type, {}).get(difficulty, []))
    questions.extend(
        _fallback_templates(
            target_role=target_role,
            difficulty=difficulty,
            resume_context=resume_context,
            category=category,
        )
    )
    if interview_type == "Mixed":
        questions.extend(INTERVIEW_QUESTIONS.get("Mixed", {}).get(difficulty, []))

    candidates: list[QuestionCandidate] = []
    seen: set[str] = set()
    for question in questions:
        cleaned = _normalized_question(question)
        key = _question_key(cleaned)
        if cleaned and key not in seen:
            seen.add(key)
            candidates.append(QuestionCandidate(question=cleaned, category=category))
    return candidates


def _assemble_questions(
    *,
    ai_candidates: list[QuestionCandidate],
    question_count: int,
    interview_type: str,
    difficulty: str,
    target_role: str,
    resume_context: dict[str, list[str]] | None,
) -> list[str]:
    targets = _expected_mix(interview_type, question_count)
    used_counts = {"hr": 0, "technical": 0}
    seen: set[str] = set()
    selected: list[QuestionCandidate] = []

    def add_candidate(candidate: QuestionCandidate) -> bool:
        if used_counts[candidate.category] >= targets[candidate.category]:
            return False
        key = _question_key(candidate.question)
        if not key or key in seen:
            return False
        seen.add(key)
        selected.append(candidate)
        used_counts[candidate.category] += 1
        return True

    for candidate in ai_candidates:
        add_candidate(candidate)

    for category, target in targets.items():
        if used_counts[category] >= target:
            continue
        for candidate in _fallback_candidates(
            interview_type=interview_type,
            difficulty=difficulty,
            target_role=target_role,
            resume_context=resume_context,
            category=category,  # type: ignore[arg-type]
        ):
            add_candidate(candidate)
            if used_counts[category] >= target:
                break

    if len(selected) != question_count:
        raise RuntimeError("Deterministic question fallback is incomplete")
    return [candidate.question for candidate in selected[:question_count]]


def generate_interview_questions(
    *,
    target_role: str,
    interview_type: str,
    difficulty: str,
    resume_context: dict[str, list[str]] | None,
    question_count: int,
) -> GeneratedQuestions:
    client = build_ollama_client(
        settings.ollama_base_url,
        settings.ollama_model,
        settings.ollama_timeout_seconds,
    )
    retry_note: str | None = None
    ai_candidates: list[QuestionCandidate] = []
    for _attempt in range(2):
        prompt = build_question_generation_prompt(
            target_role=target_role,
            interview_type=interview_type,
            difficulty=difficulty,
            resume_context=resume_context,
            question_count=question_count,
            retry_note=retry_note,
        )
        try:
            raw_response = client.generate_structured_response(
                prompt,
                "json",
                num_predict=max(900, question_count * 120),
            )
            ai_candidates = _validate_model_output(
                raw_response,
                interview_type=interview_type,
                difficulty=difficulty,
            )
            if len(ai_candidates) >= question_count:
                break
            retry_note = "incorrect question count"
        except QuestionValidationError as exc:
            retry_note = exc.retry_note
            continue
        except (
            OllamaGenerationError,
            OllamaGenerationTimeoutError,
            OllamaModelMissingError,
            OllamaUnavailableError,
        ):
            ai_candidates = []
            break

    questions = _assemble_questions(
        ai_candidates=ai_candidates,
        question_count=question_count,
        interview_type=interview_type,
        difficulty=difficulty,
        target_role=target_role,
        resume_context=resume_context,
    )
    if not questions:
        raise RuntimeError("Interview question generation returned no questions")
    return GeneratedQuestions(
        questions=questions,
        source="ai" if ai_candidates else "fallback",
    )
