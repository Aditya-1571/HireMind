import re
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Resume, User

ANALYSIS_VERSION = "deterministic-v1"
SECTION_ALIASES = {
    "summary": {"summary", "professional summary", "profile", "objective"},
    "skills": {"skills", "technical skills", "core skills", "competencies"},
    "education": {"education", "academic background"},
    "experience": {
        "experience",
        "work experience",
        "professional experience",
        "employment history",
    },
    "projects": {"projects", "personal projects", "selected projects"},
    "certifications": {"certifications", "certificates", "licenses"},
}
PROGRAMMING_LANGUAGES = [
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "C++",
    "C#",
    "C",
    "Go",
    "Rust",
    "Ruby",
    "PHP",
    "Swift",
    "Kotlin",
    "SQL",
    "HTML",
    "CSS",
]
FRAMEWORKS_AND_LIBRARIES = [
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "FastAPI",
    "Django",
    "Flask",
    "Spring",
    "Angular",
    "Vue",
    "Tailwind",
    "Pandas",
    "NumPy",
]
TOOLS_AND_PLATFORMS = [
    "Git",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "PostgreSQL",
    "MongoDB",
    "MySQL",
    "Redis",
    "Linux",
    "Jira",
    "Figma",
]


def _empty_analysis() -> dict[str, Any]:
    return {
        "metadata": {
            "analysis_version": ANALYSIS_VERSION,
            "generated_at": datetime.now(UTC).isoformat(),
            "parser_type": "deterministic_regex_sections",
        },
        "candidate_name": None,
        "email": None,
        "phone": None,
        "summary": None,
        "skills": [],
        "programming_languages": [],
        "frameworks_and_libraries": [],
        "tools_and_platforms": [],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
    }


def _clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip(" -•\t")


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for item in items:
        cleaned = _clean_line(item)
        key = cleaned.casefold()
        if cleaned and key not in seen:
            seen.add(key)
            deduped.append(cleaned)
    return deduped


def _normalize_phone(value: str) -> str | None:
    cleaned = re.sub(r"[^\d+()\-.\s]", "", value)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    digits = re.sub(r"\D", "", cleaned)
    if 10 <= len(digits) <= 15:
        return cleaned
    return None


def _extract_contact(text: str) -> tuple[str | None, str | None]:
    email_match = re.search(
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
        text,
        flags=re.IGNORECASE,
    )
    email = email_match.group(0).lower() if email_match else None

    phone = None
    for match in re.finditer(r"(?:\+?\d[\d\s().-]{8,}\d)", text):
        phone = _normalize_phone(match.group(0))
        if phone:
            break

    return email, phone


def _extract_candidate_name(lines: list[str], email: str | None, phone: str | None) -> str | None:
    heading_names = {alias for aliases in SECTION_ALIASES.values() for alias in aliases}
    for line in lines[:8]:
        cleaned = _clean_line(line)
        if not cleaned:
            continue
        lowered = cleaned.casefold()
        if email and email in lowered:
            continue
        if phone and phone in cleaned:
            continue
        if lowered in heading_names:
            continue
        if re.search(r"[@|]|\d{4,}", cleaned):
            continue
        words = cleaned.split()
        if 2 <= len(words) <= 5 and all(re.search(r"[A-Za-z]", word) for word in words):
            return cleaned
    return None


def _section_key(line: str) -> str | None:
    normalized = _clean_line(line).rstrip(":").casefold()
    for key, aliases in SECTION_ALIASES.items():
        if normalized in aliases:
            return key
    return None


def _split_sections(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {key: [] for key in SECTION_ALIASES}
    current: str | None = None
    for line in lines:
        key = _section_key(line)
        if key:
            current = key
            continue
        if current and _clean_line(line):
            sections[current].append(_clean_line(line))
    return sections


def _section_text(lines: list[str]) -> str | None:
    text = "\n".join(_dedupe(lines)).strip()
    return text or None


def _section_items(lines: list[str]) -> list[str]:
    items: list[str] = []
    for line in lines:
        parts = re.split(r"[,;]| \| ", line)
        if len(parts) > 1:
            items.extend(parts)
        else:
            items.append(line)
    return _dedupe(items)


def _line_items(lines: list[str]) -> list[str]:
    return _dedupe(lines)


def _keyword_matches(text: str, keywords: list[str]) -> list[str]:
    matches: list[str] = []
    for keyword in keywords:
        pattern = rf"(?<![A-Za-z0-9+#.]){re.escape(keyword)}(?![A-Za-z0-9+#.])"
        if re.search(pattern, text, flags=re.IGNORECASE):
            matches.append(keyword)
    return _dedupe(matches)


def analyze_resume_text(text: str) -> dict[str, Any]:
    analysis = _empty_analysis()
    lines = [_clean_line(line) for line in text.splitlines()]
    lines = [line for line in lines if line]
    sections = _split_sections(lines)
    email, phone = _extract_contact(text)

    analysis["email"] = email
    analysis["phone"] = phone
    analysis["candidate_name"] = _extract_candidate_name(lines, email, phone)
    analysis["summary"] = _section_text(sections["summary"])
    analysis["education"] = _line_items(sections["education"])
    analysis["experience"] = _line_items(sections["experience"])
    analysis["projects"] = _line_items(sections["projects"])
    analysis["certifications"] = _line_items(sections["certifications"])

    programming_languages = _keyword_matches(text, PROGRAMMING_LANGUAGES)
    frameworks = _keyword_matches(text, FRAMEWORKS_AND_LIBRARIES)
    tools = _keyword_matches(text, TOOLS_AND_PLATFORMS)
    explicit_skills = _section_items(sections["skills"])

    analysis["programming_languages"] = programming_languages
    analysis["frameworks_and_libraries"] = frameworks
    analysis["tools_and_platforms"] = tools
    analysis["skills"] = _dedupe(explicit_skills + programming_languages + frameworks + tools)

    return analysis


def analyze_owned_resume(db: Session, current_user: User, resume_id: UUID) -> Resume:
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
    if resume.processing_status != "ready" or not resume.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume must be successfully parsed before analysis",
        )

    resume.analysis_status = "analyzing"
    db.commit()

    try:
        resume.analysis_data = analyze_resume_text(resume.extracted_text)
        resume.analysis_status = "ready"
        db.commit()
        db.refresh(resume)
        return resume
    except Exception as exc:
        resume.analysis_status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resume analysis failed",
        ) from exc
