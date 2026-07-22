"""add user profile settings

Revision ID: 20260723_0007
Revises: 20260722_0006
Create Date: 2026-07-23
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260723_0007"
down_revision: str | None = "20260722_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=True),
        sa.Column("professional_headline", sa.String(length=150), nullable=True),
        sa.Column("target_role", sa.String(length=100), nullable=True),
        sa.Column("experience_level", sa.String(length=50), nullable=True),
        sa.Column("bio", sa.String(length=500), nullable=True),
        sa.Column("default_interview_type", sa.String(length=50), nullable=True),
        sa.Column("default_difficulty", sa.String(length=50), nullable=True),
        sa.Column(
            "default_question_count",
            sa.Integer(),
            server_default="10",
            nullable=False,
        ),
        sa.Column("default_time_limit_minutes", sa.Integer(), nullable=True),
        sa.Column(
            "default_evaluation_style",
            sa.String(length=50),
            server_default="balanced",
            nullable=False,
        ),
        sa.Column(
            "default_answer_mode",
            sa.String(length=50),
            server_default="text",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_profiles_user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_profiles")
