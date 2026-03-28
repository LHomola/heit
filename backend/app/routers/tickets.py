from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.ticket import Ticket, TicketStatus
from app.models.ticket_status_history import TicketStatusHistory
from app.models.user import User, UserRole
from app.schemas.ticket import TicketCreate, TicketResponse, TicketStatusUpdate, TicketAssign

router = APIRouter(prefix="/tickets", tags=["tickets"])

# Check if the user is authorized to access a ticket (used by both GET /tickets/{id} and PATCH /tickets/{id}/status)
# As one of cybersecurity best practices, raising 404 errorto prevent confirming whether a ticket exists to user who is not authorized to see them
def _check_ticket_access(ticket: Ticket, user: User) -> None:
    if user.role == UserRole.manager:
        return  # managers is allowed to see everything
    if user.role == UserRole.resident and ticket.created_by == user.id:
        return  # residents can only see their own tickets
    if user.role == UserRole.contractor and ticket.assigned_to == user.id:
        return  # contractors are only allowed to see tickets which have been assigned to them
    raise HTTPException(status_code=404, detail="Ticket not found")


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    body: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # get the info about logged in user (from the decoded JWT)
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
    db.refresh(ticket)  # read the row again so that server defaults (status, created_at etc) are populated
    return ticket


@router.get("/", response_model=List[TicketResponse])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Starting with a base query but then taking into account who is asking:
    # Managers should see everything
    # Residents should only see their own tickets
    # Contractors ahould only see tickets assigned to them
    q = db.query(Ticket)

    if current_user.role == UserRole.resident:
        q = q.filter(Ticket.created_by == current_user.id)
    elif current_user.role == UserRole.contractor:
        q = q.filter(Ticket.assigned_to == current_user.id)

    return q.order_by(Ticket.created_at.desc()).all()


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # primary key lookup
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    _check_ticket_access(ticket, current_user)
    return ticket

@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
def assign_ticket(
    ticket_id: int,
    body: TicketAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Assign a ticket to a contractor.

    Upon calling this endpoint, the following will happen:
    1. The manager_id value is automatically set to the ID of the staff who is currently logged in
    1. Assigned_to value is set to the selected contractor
    3. Ticket status is set to 'assigned' (this is especially useful if a ticket was previously
		being managed by a different contractor - the new contractor needs to acknowledge
		the ticket by moving it to 'in_progress' to ensure everything is tracked in the ticket history
    """

    # If the logged in user is not a manager, throw an exception
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers are allowed to assign tickets",
        )

    # Use the ticket ID to find the ticket and throw an exception if the ticket is not found
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket was not found")

    # Confirm that the ID of the user we are assigning to actually exists in the db and that it belongs to a contractor
    contractor = db.get(User, body.assigned_to)
    if not contractor or contractor.role != UserRole.contractor:
        raise HTTPException(
            status_code=400,
            detail="The value in assigned_to field must belong to an existing contractor!",
        )

    # Take a note of the old status
    old_status = ticket.status

    # Update the assignment fields
    ticket.manager_id = current_user.id
    ticket.assigned_to = body.assigned_to # new contractor
    ticket.status = TicketStatus.assigned
    ticket.updated_at = datetime.now(timezone.utc)

    # Check if ticket status is changing (e.g., we are not just reassiggning the ticket to a different contractor)
    # If the ticket was already assigned to a contractor, skip the history row
    if old_status != TicketStatus.assigned:
        db.add(TicketStatusHistory(
            ticket_id = ticket_id,
            old_status = old_status,
            new_status = TicketStatus.assigned,
            changed_by = current_user.id,
            note = f"Ticket has been assigned to contractor (user id {body.assigned_to})",
        ))

    # Commit the updates
    db.commit()
    db.refresh(ticket)
    return ticket

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    body: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # A user should only be able to update a ticket that they are allowed to see
    _check_ticket_access(ticket, current_user)

    # Residents can view tickets but are not allowed to change their status
    if current_user.role == UserRole.resident:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Residents cannot change ticket status",
        )

    # Contractors can change the status of a ticket to "in_progress" or "resolved"
    # Managers can set any status
    if current_user.role == UserRole.contractor:
        allowed = {TicketStatus.in_progress, TicketStatus.resolved}
        if body.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Contractors can only set status to in_progress or resolved",
            )

    # Record the old status before it gets overwritten
    ticket.updated_at = datetime.now(timezone.utc)
    old_status = ticket.status

    # Update the ticket
    ticket.status = body.status

    # History row preparation —> it will be commited together with the ticket update so that every status change has a corresponding history record
    history_row = TicketStatusHistory(
        ticket_id=ticket_id,
        old_status=old_status,
        new_status=body.status,
        changed_by=current_user.id,
        note=body.note,
    )
    db.add(history_row)
    db.commit()
    db.refresh(ticket)
    return ticket
