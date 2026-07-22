from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import User, UserProfile

ExperienceLevel = Literal["student", "fresher", "junior", "mid_level", "senior"]

INTERVIEW_TYPES = {"HR", "Technical", "Mixed"}
DIFFICULTIES = {"Easy", "Medium", "Hard"}
DEFAULT_INTERVIEW_TYPE = "HR"
DEFAULT_DIFFICULTY = "Easy"
DEFAULT_QUESTION_COUNT = 10
SUPPORTED_TIME_LIMITS = {15, 30, 45, 60}
SUPPORTED_EVALUATION_STYLES = {"beginner_friendly", "balanced", "strict"}
DEFAULT_EVALUATION_STYLE = "balanced"
SUPPORTED_ANSWER_MODES = {"text"}
DEFAULT_ANSWER_MODE = "text"
EXPERIENCE_LEVELS = {"student", "fresher", "junior", "mid_level", "senior"}


@dataclass(frozen=True)
class ProfileValues:
    full_name: str | None
    professional_headline: str | None
    target_role: str | None
    experience_level: str | None
    bio: str | None


@dataclass(frozen=True)
class InterviewDefaultValues:
    interview_type: str
    difficulty: str
    question_count: int
    time_limit_minutes: int | None
    evaluation_style: str
    answer_mode: str


@dataclass(frozen=True)
class AccountValues:
    email: str
    auth_provider: str
    created_at: datetime
    profile_picture_url: str | None


@dataclass(frozen=True)
class ProfileResponseValues:
    profile: ProfileValues
    interview_defaults: InterviewDefaultValues
    account: AccountValues
    profile_completion: int


@dataclass(frozen=True)
class ProfilePatchValues:
    full_name: str | None | object = ...
    professional_headline: str | None | object = ...
    target_role: str | None | object = ...
    experience_level: str | None | object = ...
    bio: str | None | object = ...


@dataclass(frozen=True)
class InterviewDefaultsPatchValues:
    interview_type: str | None | object = ...
    difficulty: str | None | object = ...
    question_count: int | object = ...
    time_limit_minutes: int | None | object = ...
    evaluation_style: str | object = ...
    answer_mode: str | object = ...


def get_profile_response(db: Session, current_user: User) -> ProfileResponseValues:
    return build_profile_response(current_user, _get_profile_row(db, current_user))


def patch_profile_response(
    db: Session,
    current_user: User,
    profile_patch: ProfilePatchValues | None = None,
    defaults_patch: InterviewDefaultsPatchValues | None = None,
) -> ProfileResponseValues:
    profile = _get_profile_row(db, current_user)
    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    _apply_profile_patch(profile, profile_patch)
    _apply_defaults_patch(profile, defaults_patch)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        profile = _get_profile_row(db, current_user)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Profile update conflict",
            ) from exc
        _apply_profile_patch(profile, profile_patch)
        _apply_defaults_patch(profile, defaults_patch)
        db.commit()

    db.refresh(profile)
    return build_profile_response(current_user, profile)


def build_profile_response(
    current_user: User,
    profile: UserProfile | None,
) -> ProfileResponseValues:
    profile_values = ProfileValues(
        full_name=_effective_full_name(current_user, profile),
        professional_headline=_stored_text(profile, "professional_headline"),
        target_role=_stored_text(profile, "target_role"),
        experience_level=_valid_choice(
            _stored_text(profile, "experience_level"),
            EXPERIENCE_LEVELS,
            None,
        ),
        bio=_stored_text(profile, "bio"),
    )
    defaults = InterviewDefaultValues(
        interview_type=_valid_choice(
            _stored_text(profile, "default_interview_type"),
            INTERVIEW_TYPES,
            DEFAULT_INTERVIEW_TYPE,
        ),
        difficulty=_valid_choice(
            _stored_text(profile, "default_difficulty"),
            DIFFICULTIES,
            DEFAULT_DIFFICULTY,
        ),
        question_count=_valid_question_count(
            getattr(profile, "default_question_count", None)
            if profile is not None
            else None,
        ),
        time_limit_minutes=_valid_time_limit(
            getattr(profile, "default_time_limit_minutes", None)
            if profile is not None
            else None,
        ),
        evaluation_style=_valid_choice(
            _stored_text(profile, "default_evaluation_style"),
            SUPPORTED_EVALUATION_STYLES,
            DEFAULT_EVALUATION_STYLE,
        ),
        answer_mode=_valid_choice(
            _stored_text(profile, "default_answer_mode"),
            SUPPORTED_ANSWER_MODES,
            DEFAULT_ANSWER_MODE,
        ),
    )
    return ProfileResponseValues(
        profile=profile_values,
        interview_defaults=defaults,
        account=AccountValues(
            email=current_user.email,
            auth_provider="google",
            created_at=current_user.created_at,
            profile_picture_url=current_user.profile_picture,
        ),
        profile_completion=calculate_profile_completion(profile_values),
    )


def calculate_profile_completion(profile: ProfileValues) -> int:
    values = [
        profile.full_name,
        profile.professional_headline,
        profile.target_role,
        profile.experience_level,
        profile.bio,
    ]
    return sum(20 for value in values if isinstance(value, str) and value.strip())


def _get_profile_row(db: Session, current_user: User) -> UserProfile | None:
    return db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))


def _apply_profile_patch(
    profile: UserProfile,
    patch: ProfilePatchValues | None,
) -> None:
    if patch is None:
        return
    for field in (
        "full_name",
        "professional_headline",
        "target_role",
        "experience_level",
        "bio",
    ):
        value = getattr(patch, field)
        if value is not ...:
            setattr(profile, field, value)


def _apply_defaults_patch(
    profile: UserProfile,
    patch: InterviewDefaultsPatchValues | None,
) -> None:
    if patch is None:
        return
    mapping = {
        "interview_type": "default_interview_type",
        "difficulty": "default_difficulty",
        "question_count": "default_question_count",
        "time_limit_minutes": "default_time_limit_minutes",
        "evaluation_style": "default_evaluation_style",
        "answer_mode": "default_answer_mode",
    }
    for patch_field, model_field in mapping.items():
        value = getattr(patch, patch_field)
        if value is not ...:
            setattr(profile, model_field, value)


def _effective_full_name(current_user: User, profile: UserProfile | None) -> str | None:
    return _stored_text(profile, "full_name") or _clean_optional_text(current_user.name)


def _stored_text(profile: UserProfile | None, field: str) -> str | None:
    if profile is None:
        return None
    return _clean_optional_text(getattr(profile, field, None))


def _clean_optional_text(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def _valid_choice(
    value: str | None,
    allowed_values: set[str],
    fallback: str | None,
) -> str | None:
    return value if value in allowed_values else fallback


def _valid_question_count(value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        return DEFAULT_QUESTION_COUNT
    if 5 <= value <= 30:
        return value
    return DEFAULT_QUESTION_COUNT


def _valid_time_limit(value: object) -> int | None:
    if isinstance(value, int) and not isinstance(value, bool) and value in SUPPORTED_TIME_LIMITS:
        return value
    return None
