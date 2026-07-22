from datetime import datetime
from typing import Annotated, Literal

from fastapi import Depends
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models import User
from app.services.profile_service import (
    InterviewDefaultsPatchValues,
    ProfilePatchValues,
    ProfileResponseValues,
    patch_profile_response,
    get_profile_response,
)


class ProfilePatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, max_length=100)
    professional_headline: str | None = Field(default=None, max_length=150)
    target_role: str | None = Field(default=None, max_length=100)
    experience_level: Literal["student", "fresher", "junior", "mid_level", "senior"] | None = None
    bio: str | None = Field(default=None, max_length=500)

    @field_validator(
        "full_name",
        "professional_headline",
        "target_role",
        "bio",
        mode="before",
    )
    @classmethod
    def clean_optional_text(cls, value: object) -> object:
        if value is None:
            return None
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return value


class InterviewDefaultsPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    interview_type: Literal["HR", "Technical", "Mixed"] | None = None
    difficulty: Literal["Easy", "Medium", "Hard"] | None = None
    question_count: int | None = Field(default=None, ge=5, le=30)
    time_limit_minutes: Literal[15, 30, 45, 60] | None = None
    evaluation_style: Literal["beginner_friendly", "balanced", "strict"] | None = None
    answer_mode: Literal["text"] | None = None

    @field_validator("question_count", mode="before")
    @classmethod
    def reject_non_integer_question_count(cls, value: object) -> object:
        if value is None:
            return None
        if isinstance(value, bool) or isinstance(value, float):
            raise ValueError("Question count must be an integer from 5 to 30")
        return value


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    profile: ProfilePatchRequest | None = None
    interview_defaults: InterviewDefaultsPatchRequest | None = None


class ProfileResponse(BaseModel):
    full_name: str | None
    professional_headline: str | None
    target_role: str | None
    experience_level: str | None
    bio: str | None


class InterviewDefaultsResponse(BaseModel):
    interview_type: str
    difficulty: str
    question_count: int
    time_limit_minutes: int | None
    evaluation_style: str
    answer_mode: str


class AccountResponse(BaseModel):
    email: str
    auth_provider: str
    created_at: datetime
    profile_picture_url: str | None


class ProfileSettingsResponse(BaseModel):
    profile: ProfileResponse
    interview_defaults: InterviewDefaultsResponse
    account: AccountResponse
    profile_completion: int


def _service_response_to_api(response: ProfileResponseValues) -> ProfileSettingsResponse:
    return ProfileSettingsResponse(
        profile=ProfileResponse(
            full_name=response.profile.full_name,
            professional_headline=response.profile.professional_headline,
            target_role=response.profile.target_role,
            experience_level=response.profile.experience_level,
            bio=response.profile.bio,
        ),
        interview_defaults=InterviewDefaultsResponse(
            interview_type=response.interview_defaults.interview_type,
            difficulty=response.interview_defaults.difficulty,
            question_count=response.interview_defaults.question_count,
            time_limit_minutes=response.interview_defaults.time_limit_minutes,
            evaluation_style=response.interview_defaults.evaluation_style,
            answer_mode=response.interview_defaults.answer_mode,
        ),
        account=AccountResponse(
            email=response.account.email,
            auth_provider=response.account.auth_provider,
            created_at=response.account.created_at,
            profile_picture_url=response.account.profile_picture_url,
        ),
        profile_completion=response.profile_completion,
    )


def _profile_patch_values(
    payload: ProfilePatchRequest | None,
) -> ProfilePatchValues | None:
    if payload is None:
        return None
    fields = payload.model_fields_set
    return ProfilePatchValues(
        full_name=payload.full_name if "full_name" in fields else ...,
        professional_headline=(
            payload.professional_headline
            if "professional_headline" in fields
            else ...
        ),
        target_role=payload.target_role if "target_role" in fields else ...,
        experience_level=(
            payload.experience_level if "experience_level" in fields else ...
        ),
        bio=payload.bio if "bio" in fields else ...,
    )


def _defaults_patch_values(
    payload: InterviewDefaultsPatchRequest | None,
) -> InterviewDefaultsPatchValues | None:
    if payload is None:
        return None
    fields = payload.model_fields_set
    return InterviewDefaultsPatchValues(
        interview_type=payload.interview_type if "interview_type" in fields else ...,
        difficulty=payload.difficulty if "difficulty" in fields else ...,
        question_count=payload.question_count if "question_count" in fields else ...,
        time_limit_minutes=(
            payload.time_limit_minutes if "time_limit_minutes" in fields else ...
        ),
        evaluation_style=(
            payload.evaluation_style if "evaluation_style" in fields else ...
        ),
        answer_mode=payload.answer_mode if "answer_mode" in fields else ...,
    )


def get_profile_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProfileSettingsResponse:
    return _service_response_to_api(get_profile_response(db, current_user))


def patch_profile_endpoint(
    payload: ProfileUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProfileSettingsResponse:
    return _service_response_to_api(
        patch_profile_response(
            db,
            current_user,
            profile_patch=_profile_patch_values(payload.profile),
            defaults_patch=_defaults_patch_values(payload.interview_defaults),
        )
    )
