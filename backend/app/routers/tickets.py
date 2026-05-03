from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
import google.generativeai as genai
from sqlalchemy import func, literal, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.ticket import Ticket, TicketStatus
from app.models.ticket_status_history import TicketStatusHistory
from app.models.user import User, UserRole
from app.models.ticket_like import TicketLike
from app.schemas.ticket import LikeActionResponse, NoticeBoardTicket, TicketAssign, TicketCreate, TicketResponse, TicketStatusUpdate, TicketVisibilityUpdate

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


@router.get("/notice-board", response_model=List[NoticeBoardTicket])
def list_notice_board(
    sort: str = "recent",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Public notice board. This route returns all tickets that have been marked as public
    by the user creating the ticket. 

    There are two additional fields attached per each ticket: 
    how many likes does the ticket have and whether the requesting user has already liked it.

    Any authenticated user of the application can view access the board.
    """

    # Validate the sorting option
    if sort not in {"recent", "liked"}:
        raise HTTPException(
            status_code=400,
            detail="Select 'recent' or 'liked'",
        )

    # Like count for each ticket
    like_count_col = (
        select(func.count(TicketLike.id))
        .where(TicketLike.ticket_id == Ticket.id)
        .correlate(Ticket)
        .scalar_subquery()
        .label("like_count")
    )

    # Check if the user has already liked the ticket
    liked_by_me_col = (
        select(literal(1))
        .where(TicketLike.ticket_id == Ticket.id)
        .where(TicketLike.user_id == current_user.id)
        .correlate(Ticket)
        .exists()
        .label("liked_by_me")
    )

    # Get a tuple of the ticket instance, like_count and liked_by_me
    q = (
        db.query(Ticket, like_count_col, liked_by_me_col)
        .filter(Ticket.is_public.is_(True))
    )

    if sort == "liked":
        # sort tickets by created_at if two tickets have the same amount of likes
        q = q.order_by(like_count_col.desc(), Ticket.created_at.desc())
    else:
        q = q.order_by(Ticket.created_at.desc())

    rows = q.all()

    # Add the values to the Ticket instance so for later processing by Pydantic
    result = []
    for ticket, like_count, liked_by_me in rows:
        ticket.like_count = like_count
        ticket.liked_by_me = liked_by_me
        result.append(ticket)
    return result


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Ensure all residents can open all tickets on the notice board and view their details
    if not ticket.is_public:
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


@router.patch("/{ticket_id}/visibility", response_model=TicketResponse)
def update_ticket_visibility(
    ticket_id: int,
    body: TicketVisibilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggle a ticket's is_public setting.

    A resident can decide when creating a ticket whether it should public or not.
    This endpoint lets them change the setting afterwards.

    Residents can only change visibility on tickets that they created.
    Managers can change visibility on any ticket.
    Contractors cannot change visibility of tickets at all.
    """

    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Check if user is authorized to change the setting
    is_manager = current_user.role == UserRole.manager
    is_owning_resident = (
        current_user.role == UserRole.resident
        and ticket.created_by == current_user.id
    )
    if not (is_manager or is_owning_resident):
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Update and timestamp the change
    ticket.is_public = body.is_public
    ticket.updated_at = datetime.now(timezone.utc)

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


@router.post("/{ticket_id}/ai-suggest", response_model=TicketResponse)
def ai_suggest(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Obtain a suggestion for resolving a ticket from Google Gemini.

    This endpoint sends the ticket's title and description to the Google
    Gemini API and asks for help with resolving the issue. The response
    will be saved to the ticket's ai_suggestion column so that it only needs to be
    generated once, when viewing the ticket again the
    saved suggestion will be displayed as well without making another API call.

    Only residents can request AI suggestions, however, if needed, the feature
    can be implemented for management staff or for contractors as well.
    """

    # Only residents can request AI suggestions
    if current_user.role != UserRole.resident:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only residents can request AI suggestions",
        )

    # Looking the ticket up
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket was not found")

    # Residents are only allowed to get suggestions for their own tickets
    if ticket.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # If a suggestion already exists for the given ticket, the ticket is returned without calling the API again
    if ticket.ai_suggestion:
        return ticket

    # Check that the API key is configured
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured",
        )

    # Here we build the prompt for Gemini
    prompt = (
        "You are a helpful assistant for a residential housing estate. "
        "A resident has reported the following maintenance issue.\n\n"
        f"Title: {ticket.title}\n"
        f"Description: {ticket.description}\n\n"
        "Suggest 3-5 practical steps the resident could take to resolve "
        "or mitigate this issue themselves before a contractor is sent. "
        "Keep the language simple and focus on safe, non-technical actions. "
        "If the issue clearly requires a professional (e.g. gas leak, "
        "structural damage), say so and advise the resident not to attempt "
        "a fix themselves."
    )

    # Call the Gemini API
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        suggestion = response.text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        )

    # Save the suggestion to the ticket so it does not need to be generated again
    ticket.ai_suggestion = suggestion
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/like", response_model=LikeActionResponse, status_code=201)
def like_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update database to show that the user has liked a ticket on the notice board.

    The database checks if the ticket has already been liked and rejects the request with 409 if that's the case.
    """

    # Check that the ticket exists and is set as public
    ticket = db.get(Ticket, ticket_id)
    if not ticket or not ticket.is_public:
        # Either the ticket isn't there or it isn't public — either way
        # the caller has no business knowing the difference.
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.add(TicketLike(ticket_id=ticket_id, user_id=current_user.id))

    try:
        db.commit()
    except IntegrityError:
        # Roll back if ticket has already been liked and throw an error
        db.rollback()
        raise HTTPException(status_code=409, detail="Already liked")

    # Once the change has been commited, count likes again
    like_count = db.query(func.count(TicketLike.id)).filter(
        TicketLike.ticket_id == ticket_id
    ).scalar()

    return LikeActionResponse(like_count=like_count, liked_by_me=True)


@router.delete("/{ticket_id}/like", response_model=LikeActionResponse)
def unlike_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the database to show that the user has unliked a ticket on the notice board.

    If there is no like to remove the request simply returns the current like count.
    """

    # Check that the ticket exists and is set as public
    ticket = db.get(Ticket, ticket_id)
    if not ticket or not ticket.is_public:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Using filter to delete the like to achieve idempotent behaviour where the request simply returns 0 if there are no matchin rows
    db.query(TicketLike).filter(
        TicketLike.ticket_id == ticket_id,
        TicketLike.user_id == current_user.id,
    ).delete()
    db.commit()

    # Once the change has been commited, count likes again
    like_count = db.query(func.count(TicketLike.id)).filter(
        TicketLike.ticket_id == ticket_id
    ).scalar()

    return LikeActionResponse(like_count=like_count, liked_by_me=False)