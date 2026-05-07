from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, Text, text
from sqlalchemy import Enum as SAEnum

from app.db.database import Base
from app.models.ticket import TicketStatus


class TicketStatusHistory(Base):
    __tablename__ = "ticket_status_history"

    id         = Column(Integer, primary_key=True)
    ticket_id  = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)

    # While old status should never be null (a ticket starts as "open" and then has a status for the rest of its lifetime)
    # It is kept as nullable here to match the schema
    old_status = Column(SAEnum(TicketStatus, name="ticket_status", create_type=False), nullable=True)
    new_status = Column(SAEnum(TicketStatus, name="ticket_status", create_type=False), nullable=False)

    # The history row will be preserved if the creator is deleted, however, changed_by value will be set to null
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note       = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        Index("idx_tsh_ticket_id", "ticket_id"),
    )
