from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.ticket import TicketStatus


# Details sent by client when creating a ticket (created_by is set from the JWT token on the server side to prevent users from being able to pretend they are someone else)
class TicketCreate(BaseModel):
    title:       str
    description: str
    category_id: int
    is_public:   bool = False


# Note field is optional but allow managers to leave a comment explaining why they changed the ticket's status
class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    note:   Optional[str] = None


# Details send back to client
# Model_config from_attributes tells Pydantic that it can read values directly from SQLAlchemy model object
class TicketResponse(BaseModel):
    id:            int
    title:         str
    description:   str
    category_id:   int
    status:        TicketStatus
    created_by:    int
    manager_id:    Optional[int]
    assigned_to:   Optional[int]
    is_public:     bool
    ai_suggestion: Optional[str]
    created_at:    datetime
    updated_at:    datetime

    model_config = {"from_attributes": True}


# Request body for ticket assignment endpoint
# After staff selects a contractor from the dropdown, the contractor's user id is validated by the endpoint to confirm that it actually belongs to a contractor
class TicketAssign(BaseModel):
    assigned_to: int


# Notice board ticket shares the same fields as TicketResponse but also includes:
# like count (count of like rows) and liked_by_me (does the requestor have a row for this ticket already)
class NoticeBoardTicket(TicketResponse):
    like_count:  int
    liked_by_me: bool


# Returned for by POST and DELETE requests to /tickets/{id}/like
class LikeActionResponse(BaseModel):
    like_count:  int
    liked_by_me: bool