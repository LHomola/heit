"""drop photo_url column and ticket_comments table

Revision ID: 73aaca044f06
Revises: 8e00e0f63c53
Create Date: 2026-05-02 12:00:00.000000

Photo_url column on tickets and ticket_comments table were originally included but are being dropped. 
Storing only a URL for the photo would be poor user experience (a resident would need to upload the image to a third-party image hosting service first). 
The ticket_comments table doesn't add enough value in addition to already implemented features to justify the time and effort needed to implement it.

This migration removes both features from the live database.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '73aaca044f06'
down_revision: Union[str, None] = '8e00e0f63c53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop ticket_comments table
    op.drop_index('idx_comments_ticket_id', table_name='ticket_comments')
    op.drop_table('ticket_comments')

    # Drop photo_url column from tickets table
    op.drop_column('tickets', 'photo_url')


def downgrade() -> None:
    # Recreate photo_url column
    op.add_column(
        'tickets',
        sa.Column('photo_url', sa.String(length=500), nullable=True),
    )

    # Recreate ticket_comments table
    op.create_table(
        'ticket_comments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column(
            'ticket_id',
            sa.Integer(),
            sa.ForeignKey('tickets.id', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column(
            'author_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='RESTRICT'),
            nullable=False,
        ),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
    )
    op.create_index(
        'idx_comments_ticket_id',
        'ticket_comments',
        ['ticket_id'],
    )
