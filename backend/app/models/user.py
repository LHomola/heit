import enum

from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String, text
from sqlalchemy import Enum as SAEnum

from app.db.database import Base


class UserRole(str, enum.Enum):
    resident = "resident"
    manager = "manager"
    contractor = "contractor"

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True)
    full_name       = Column(String(120), nullable=False)
    email           = Column(String(255), nullable=False, unique=True)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(SAEnum(UserRole, name="user_role"), nullable=False)
    address         = Column(String(200), nullable=True)
    is_active       = Column(Boolean, nullable=False, server_default=text("true"))
    created_at      = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        Index("idx_users_email", "email"),
    )
