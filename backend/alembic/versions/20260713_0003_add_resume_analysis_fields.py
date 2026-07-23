"""add resume analysis fields

Revision ID: 20260713_0003
Revises: 20260711_0002
Create Date: 2026-07-13
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260713_0003"
down_revision: str | None = "20260711_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "resumes",
        sa.Column(
            "analysis_status",
            sa.String(length=50),
            server_default="pending",
            nullable=False,
        ),
    )
    op.add_column(
        "resumes",
        sa.Column("analysis_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.alter_column("resumes", "analysis_status", server_default=None)


def downgrade() -> None:
    op.drop_column("resumes", "analysis_data")
    op.drop_column("resumes", "analysis_status")
