import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    full_name: Mapped[str | None] = mapped_column(String(100))
    professional_headline: Mapped[str | None] = mapped_column(String(150))
    target_role: Mapped[str | None] = mapped_column(String(100))
    experience_level: Mapped[str | None] = mapped_column(String(50))
    bio: Mapped[str | None] = mapped_column(String(500))
    default_interview_type: Mapped[str | None] = mapped_column(String(50))
    default_difficulty: Mapped[str | None] = mapped_column(String(50))
    default_question_count: Mapped[int] = mapped_column(Integer, default=10)
    default_time_limit_minutes: Mapped[int | None] = mapped_column(Integer)
    default_evaluation_style: Mapped[str] = mapped_column(
        String(50),
        default="balanced",
    )
    default_answer_mode: Mapped[str] = mapped_column(String(50), default="text")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="profile")
