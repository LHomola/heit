from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.ticket import Ticket
from app.models.user import User, UserRole
from app.schemas.ticket import TicketCreate, TicketResponse

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    body: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # get the info about logged in user which is from the decoded JWT
):
    # Only residents and managers should be able to create a ticket
    if current_user.role == UserRole.contractor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contractors cannot create tickets",
        )

    # confirm if category_id exists here for easier error handling
    from app.models.category import Category
    if not db.get(Category, body.category_id):
        raise HTTPException(status_code=400, detail="Category not found")

    ticket = Ticket(
        title=body.title,
        description=body.description,
        category_id=body.category_id,
        is_public=body.is_public,
        photo_url=body.photo_url,
        created_by=current_user.id,  # use token (instead of the request body)
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)  # read the row again so server that the defaults (status, created_at etc) are populated
    return ticket