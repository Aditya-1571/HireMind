from typing import Any

MAX_LIST_ITEMS = 5
MAX_ITEM_LENGTH = 160


def _trim(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.split())[:MAX_ITEM_LENGTH].strip()
    return cleaned or None


def _trim_list(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    trimmed: list[str] = []
    for value in values:
        cleaned = _trim(value)
        if cleaned:
            trimmed.append(cleaned)
        if len(trimmed) >= MAX_LIST_ITEMS:
            break
    return trimmed


def safe_resume_context(analysis_data: dict | None) -> dict[str, list[str]]:
    if not isinstance(analysis_data, dict):
        return {}

    context = {
        "skills": _trim_list(analysis_data.get("skills")),
        "programming_languages": _trim_list(analysis_data.get("programming_languages")),
        "frameworks_and_libraries": _trim_list(
            analysis_data.get("frameworks_and_libraries"),
        ),
        "tools_and_platforms": _trim_list(analysis_data.get("tools_and_platforms")),
        "projects": _trim_list(analysis_data.get("projects")),
        "experience": _trim_list(analysis_data.get("experience")),
        "education": _trim_list(analysis_data.get("education"))[:2],
    }
    return {key: value for key, value in context.items() if value}


def build_question_generation_prompt(
    *,
    target_role: str,
    interview_type: str,
    difficulty: str,
    resume_context: dict[str, list[str]] | None,
    retry_note: str | None = None,
) -> str:
    category_rule = {
        "HR": "Return exactly 5 HR questions. Every category value must be hr.",
        "Technical": "Return exactly 5 technical questions. Every category value must be technical. Do not use hr.",
        "Mixed": "Return exactly 3 technical questions with category technical and 2 HR questions with category hr.",
    }[interview_type]
    context_lines = []
    for key, values in (resume_context or {}).items():
        context_lines.append(f"{key}: {', '.join(values)}")
    context = "\n".join(context_lines) if context_lines else "No resume context provided."
    retry = f"\nFix this validation issue only: {retry_note}." if retry_note else ""

    return f"""You are a professional interview-question generator.
Create concise interview questions for this target role: {target_role}.
Interview type: {interview_type}. Difficulty: {difficulty}.
{category_rule}
Use only the structured resume context below. Do not invent resume facts.
Do not ask for protected personal information. Avoid discriminatory, medical, political, or religious questions.
Avoid duplicate questions. Return only JSON. Do not include markdown fences.
Resume context:
{context}{retry}
JSON shape:
{{"questions":[{{"question":"string","category":"hr | technical","difficulty":"{difficulty.lower()}"}}]}}"""
