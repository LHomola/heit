from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, Enum as SAEnum, text
from app.db.database import Base
import enum

class TicketStatus(str, enum.Enum):
    open        = "open"
    triaged     = "triaged"
    assigned    = "assigned"
    in_progress = "in_progress"
    resolved    = "resolved"
    closed      = "closed"

class Ticket(Base):
    __tablename__ = "tickets"

    id            = Column(Integer, primary_key=True)
    title         = Column(String(200), nullable=False)
    description   = Column(Text, nullable=False)
    category_id   = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    status        = Column(SAEnum(TicketStatus, name="ticket_status", create_type=False), nullable=False, server_default="open")
    created_by    = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    manager_id    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to   = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_public     = Column(Boolean, nullable=False, server_default=text("false"))
    ai_suggestion = Column(Text, nullable=True)
    created_at    = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at    = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        Index("idx_tickets_created_by",  "created_by"),
        Index("idx_tickets_manager_id",  "manager_id"),
        Index("idx_tickets_assigned_to", "assigned_to"),
        Index("idx_tickets_status",      "status"),
        Index("idx_tickets_is_public",   "is_public"),
    )