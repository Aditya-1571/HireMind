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


def _project_items(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    items: list[str] = []
    for value in values:
        if isinstance(value, str):
            cleaned = _trim(value)
        elif isinstance(value, dict):
            name = _trim(value.get("name"))
            descriptions = _trim_list(value.get("description"))[:2]
            technologies = _trim_list(value.get("technologies"))[:4]
            parts = [part for part in [name, "; ".join(descriptions)] if part]
            cleaned = " - ".join(parts)
            if technologies:
                cleaned = f"{cleaned} ({', '.join(technologies)})" if cleaned else ", ".join(technologies)
        else:
            cleaned = None
        if cleaned:
            items.append(cleaned[:MAX_ITEM_LENGTH].strip())
        if len(items) >= MAX_LIST_ITEMS:
            break
    return items


def _experience_items(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    items: list[str] = []
    for value in values:
        if isinstance(value, str):
            cleaned = _trim(value)
        elif isinstance(value, dict):
            organization = _trim(value.get("organization"))
            role = _trim(value.get("role"))
            experience_type = _trim(value.get("experience_type"))
            descriptions = _trim_list(value.get("description"))[:2]
            header = " - ".join(
                part for part in [role, organization, experience_type] if part
            )
            cleaned = "; ".join(part for part in [header, *descriptions] if part)
        else:
            cleaned = None
        if cleaned:
            items.append(cleaned[:MAX_ITEM_LENGTH].strip())
        if len(items) >= MAX_LIST_ITEMS:
            break
    return items


def _categorized_skill_items(analysis_data: dict) -> list[str]:
    categorized = analysis_data.get("skills_categorized")
    if not isinstance(categorized, dict):
        return _trim_list(analysis_data.get("skills"))

    items: list[str] = []
    for key in (
        "programming_languages",
        "ml_ai",
        "frameworks_libraries",
        "tools_platforms",
        "databases",
        "cloud_devops",
        "other",
    ):
        values = _trim_list(categorized.get(key))[:MAX_LIST_ITEMS]
        if values:
            items.append(f"{key}: {', '.join(values)}")
        if len(items) >= MAX_LIST_ITEMS:
            break
    return items


def safe_resume_context(analysis_data: dict | None) -> dict[str, list[str]]:
    if not isinstance(analysis_data, dict):
        return {}

    context = {
        "skills": _categorized_skill_items(analysis_data),
        "programming_languages": _trim_list(analysis_data.get("programming_languages")),
        "frameworks_and_libraries": _trim_list(
            analysis_data.get("frameworks_and_libraries"),
        ),
        "tools_and_platforms": _trim_list(analysis_data.get("tools_and_platforms")),
        "projects": _project_items(analysis_data.get("projects")),
        "experience": _experience_items(analysis_data.get("experience")),
        "education": _trim_list(analysis_data.get("education"))[:2],
    }
    return {key: value for key, value in context.items() if value}


def build_question_generation_prompt(
    *,
    target_role: str,
    interview_type: str,
    difficulty: str,
    resume_context: dict[str, list[str]] | None,
    question_count: int,
    retry_note: str | None = None,
) -> str:
    technical_target = (question_count * 6 + 9) // 10
    hr_target = question_count - technical_target
    category_rule = {
        "HR": f"Return exactly {question_count} HR questions. Every category value must be hr.",
        "Technical": f"Return exactly {question_count} technical questions. Every category value must be technical. Do not use hr.",
        "Mixed": f"Return exactly {technical_target} technical questions and {hr_target} HR questions.",
    }[interview_type]
    context_lines = []
    for key, values in (resume_context or {}).items():
        context_lines.append(f"{key}: {', '.join(values)}")
    context = "\n".join(context_lines) if context_lines else "No resume context provided."
    retry = f"\nFix this validation issue only: {retry_note}." if retry_note else ""

    return f"""You are a professional interview-question generator.
Create exactly {question_count} concise interview questions for this target role: {target_role}.
Interview type: {interview_type}. Difficulty: {difficulty}.
{category_rule}
Use only the structured resume context below. Do not invent resume facts.
Do not ask for protected personal information. Avoid discriminatory, medical, political, or religious questions.
Avoid duplicate questions. Return only JSON. Do not include markdown fences.
Resume context:
{context}{retry}
JSON shape:
{{"questions":[{{"question":"string","category":"hr | technical","difficulty":"{difficulty.lower()}"}}]}}"""
