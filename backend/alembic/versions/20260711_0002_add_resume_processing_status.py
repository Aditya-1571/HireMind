"""add resume processing status

Revision ID: 20260711_0002
Revises: 20260711_0001
Create Date: 2026-07-11
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260711_0002"
down_revision: str | None = "20260711_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "resumes",
        sa.Column(
            "processing_status",
            sa.String(length=50),
            server_default="uploaded",
            nullable=False,
        ),
    )
    op.alter_column("resumes", "processing_status", server_default=None)


def downgrade() -> None:
    op.drop_column("resumes", "processing_status")
