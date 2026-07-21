import re
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Resume, User
from app.services.resume_structure_helpers import (
    SECTION_ALIASES,
    certifications_from_sections,
    clean_line,
    extract_skills,
    group_experience,
    group_projects,
    line_items,
    section_items,
    section_text,
    split_sections,
)

ANALYSIS_VERSION = "deterministic-v2"


def _empty_analysis() -> dict[str, Any]:
    categorized_skills = {
        "programming_languages": [],
        "ml_ai": [],
        "frameworks_libraries": [],
        "tools_platforms": [],
        "databases": [],
        "cloud_devops": [],
        "other": [],
    }
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
        "skills_categorized": categorized_skills,
        "programming_languages": [],
        "frameworks_and_libraries": [],
        "tools_and_platforms": [],
        "databases": [],
        "cloud_devops": [],
        "ml_ai": [],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "achievements": [],
    }


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


def _extract_candidate_name(
    lines: list[str],
    email: str | None,
    phone: str | None,
) -> str | None:
    heading_names = {alias for aliases in SECTION_ALIASES.values() for alias in aliases}
    for line in lines[:8]:
        cleaned = clean_line(line)
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


def analyze_resume_text(text: str) -> dict[str, Any]:
    analysis = _empty_analysis()
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    sections = split_sections(lines)
    email, phone = _extract_contact(text)

    analysis["email"] = email
    analysis["phone"] = phone
    analysis["candidate_name"] = _extract_candidate_name(lines, email, phone)
    analysis["summary"] = section_text(sections["summary"])
    analysis["education"] = line_items(sections["education"])
    analysis["experience"] = group_experience(sections["experience"])
    analysis["projects"] = group_projects(sections["projects"])
    analysis["certifications"] = certifications_from_sections(
        sections["certifications"],
        sections["achievements"],
    )
    analysis["achievements"] = line_items(sections["achievements"])

    skills = extract_skills(text, section_items(sections["skills"]))
    categorized = skills["categorized"]
    analysis["skills"] = skills["flat"]
    analysis["skills_categorized"] = categorized
    analysis["programming_languages"] = categorized["programming_languages"]
    analysis["frameworks_and_libraries"] = categorized["frameworks_libraries"]
    analysis["tools_and_platforms"] = categorized["tools_platforms"]
    analysis["databases"] = categorized["databases"]
    analysis["cloud_devops"] = categorized["cloud_devops"]
    analysis["ml_ai"] = categorized["ml_ai"]

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
