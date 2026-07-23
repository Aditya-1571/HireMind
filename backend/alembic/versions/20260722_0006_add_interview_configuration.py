"""add interview configuration

Revision ID: 20260722_0006
Revises: 20260718_0005
Create Date: 2026-07-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260722_0006"
down_revision: str | None = "20260718_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "interviews",
        sa.Column("question_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "interviews",
        sa.Column("time_limit_minutes", sa.Integer(), nullable=True),
    )
    op.add_column(
        "interviews",
        sa.Column(
            "evaluation_style",
            sa.String(length=50),
            server_default="balanced",
            nullable=False,
        ),
    )
    op.add_column(
        "interviews",
        sa.Column(
            "answer_mode",
            sa.String(length=50),
            server_default="text",
            nullable=False,
        ),
    )
    op.add_column(
        "interviews",
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
    )

    op.execute(
        """
        UPDATE interviews
        SET question_count = COALESCE(question_totals.total_questions, 5)
        FROM (
            SELECT interview_id, COUNT(*)::integer AS total_questions
            FROM interview_questions
            GROUP BY interview_id
        ) AS question_totals
        WHERE interviews.id = question_totals.interview_id
        """
    )
    op.execute("UPDATE interviews SET question_count = 5 WHERE question_count IS NULL")
    op.alter_column("interviews", "question_count", nullable=False)
    op.alter_column("interviews", "evaluation_style", server_default=None)
    op.alter_column("interviews", "answer_mode", server_default=None)


def downgrade() -> None:
    op.drop_column("interviews", "duration_seconds")
    op.drop_column("interviews", "answer_mode")
    op.drop_column("interviews", "evaluation_style")
    op.drop_column("interviews", "time_limit_minutes")
    op.drop_column("interviews", "question_count")
