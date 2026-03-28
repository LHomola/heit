"""
Users router

Only managers are able to enumerate other users in the system.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserSummary

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserSummary])
def list_users(
    role: str | None = None, # optional role param
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return a list of users which can filtered by role.

    Only managers are allowed to access this endpoint.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only manager company staff is allowed to access the list of users",
        )

    # query for all users
    q = db.query(User)

    # if a role param is provided validate it against the UserRole enum and return 400 status if the value is incorrect
    if role is not None:
        if role not in UserRole._value2member_map_:
            raise HTTPException(status_code=400, detail="Invalid role value")
        q = q.filter(User.role == role)

    # order users by name
    return q.order_by(User.full_name).all()
