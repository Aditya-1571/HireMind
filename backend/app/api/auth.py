from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, Header, HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=10, max_length=4096)

    model_config = {"extra": "forbid"}


class UserResponse(BaseModel):
    id: UUID
    google_id: str
    email: str
    name: str
    profile_picture: str | None

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    session_token: str


class MeResponse(BaseModel):
    user: UserResponse


def _create_session_token(user: User) -> str:
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.session_expire_minutes)
    return jwt.encode(
        {
            "sub": str(user.id),
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
        },
        settings.session_secret,
        algorithm="HS256",
    )


def _decode_session_token(token: str) -> UUID:
    try:
        payload = jwt.decode(token, settings.session_secret, algorithms=["HS256"])
        subject = payload.get("sub")
        if not isinstance(subject, str):
            raise ValueError
        return UUID(subject)
    except (jwt.InvalidTokenError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from exc


def _get_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing session",
        )
    return authorization.removeprefix("Bearer ").strip()


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    token = _get_bearer_token(authorization)
    user_id = _decode_session_token(token)
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    return user


def login_with_google(
    payload: GoogleLoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication is not configured",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            payload.credential,
            requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        ) from exc

    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name")

    if not isinstance(google_id, str) or not isinstance(email, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        )

    user = db.scalar(select(User).where(User.google_id == google_id))

    if user is None:
        user = User(
            google_id=google_id,
            email=email,
            name=name if isinstance(name, str) else email,
            profile_picture=google_user.get("picture")
            if isinstance(google_user.get("picture"), str)
            else None,
        )
        db.add(user)
    else:
        user.email = email
        user.name = name if isinstance(name, str) else user.name
        picture = google_user.get("picture")
        user.profile_picture = picture if isinstance(picture, str) else None

    db.commit()
    db.refresh(user)

    return AuthResponse(user=UserResponse.model_validate(user), session_token=_create_session_token(user))


def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> MeResponse:
    return MeResponse(user=UserResponse.model_validate(current_user))
