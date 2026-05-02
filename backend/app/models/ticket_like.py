from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint, text
from app.db.database import Base


class TicketLike(Base):
    """
    This table contains details about which user liked which ticket on the notice board and when.
    In order to ensure that a user can only like a ticket once, the composite unique constraint (ticket_id, user_id)
    has been applied here and the API layer can then rely on it instead of perform its own checks before processing a like.
    """

    __tablename__ = "ticket_likes"

    id = Column(Integer, primary_key=True)

    # If a ticket or a user are removed from the system, the likes will be remove also
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        UniqueConstraint("ticket_id", "user_id", name="uq_one_like_per_user"),
    )