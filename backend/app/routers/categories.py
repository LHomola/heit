"""
Categories router - list of ticket categories available to all users

This endpoints is needed to provide values for the categories dropdown on the form used for creating tickets. The list of categories is sorted alphabetically.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.category import Category
from app.models.user import User

router = APIRouter(prefix="/categories", tags=["categories"])


# Provide id, name, and description (if one exists) of the categories
class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None

    # Pydantic will read values from SQLAlchemy
    model_config = {"from_attributes": True}


@router.get("/", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user), # authentication is required but not the actual user object
):
    """
    Return all categories ordered alphabetically by name.

    This endpoint is used by the CreateTicketPage to populate the category dropdown.
    """
    return db.query(Category).order_by(Category.name).all()
