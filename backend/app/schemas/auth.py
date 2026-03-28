from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# Request

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str # resident,manager, contractor
    address: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Response

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    address: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

# This summary only provides basic user details for lists of users so as to prevent revealing sensitive user data
class UserSummary(BaseModel):
    id: int # primary key
    full_name: str

    # Pydantic can read data from SQLAlchemy model attributes
    model_config = {"from_attributes": True}
