from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.db.database import Base

class Category(Base):
    __tablename__ = "categories"

    id          = Column(Integer, primary_key=True)
    name        = Column(String(80), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_by  = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime(timezone=True), nullable=False)