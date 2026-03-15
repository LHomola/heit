from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)): #  FastAPI dependency injection that automatically opens closes a database session
    # Confirm that the role is one of the allowed values
    if body.role not in UserRole._value2member_map_:
        raise HTTPException(status_code=400, detail=f"Role must be one of these: resident, manager, contractor")

    # Validate that the email isn't already taken
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="This email is already registered")

    user = User(
        full_name=body.full_name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        address=body.address,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


# This endpoint decodes the JWT -> reads the user ID from the payload -> fetches the live user record from the database
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user