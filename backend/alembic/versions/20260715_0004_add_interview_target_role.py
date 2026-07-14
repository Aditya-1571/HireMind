"""add interview target role

Revision ID: 20260715_0004
Revises: 20260713_0003
Create Date: 2026-07-15
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260715_0004"
down_revision: str | None = "20260713_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "interviews",
        sa.Column("target_role", sa.String(length=100), nullable=True),
    )
    op.execute("UPDATE interviews SET target_role = 'Software Engineer'")
    op.alter_column("interviews", "target_role", nullable=False)


def downgrade() -> None:
    op.drop_column("interviews", "target_role")
