"""add status and book_id to issued_books

Revision ID: dca421dd85e5
Revises: 1dd2456be4b7
Create Date: 2026-05-02 20:44:39.576902

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dca421dd85e5'
down_revision: Union[str, Sequence[str], None] = '1dd2456be4b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add columns needed by the library routes.
    # FK constraints are skipped — existing data has trailing-space roll_no
    # values that don't match students, so strict FK enforcement would fail.
    op.add_column('issued_books', sa.Column('book_id', sa.Integer(), nullable=True))
    op.add_column('issued_books', sa.Column('status', sa.String(length=20), nullable=True))
    op.create_index(op.f('ix_issued_books_book_id'), 'issued_books', ['book_id'], unique=False)
    op.create_index(op.f('ix_issued_books_roll_no'), 'issued_books', ['roll_no'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_issued_books_roll_no'), table_name='issued_books')
    op.drop_index(op.f('ix_issued_books_book_id'), table_name='issued_books')
    op.drop_column('issued_books', 'status')
    op.drop_column('issued_books', 'book_id')
