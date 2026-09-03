from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user
from app.database import get_db
from app.models import User


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


VALID_ROLES = ("admin", "officer", "viewer")


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "viewer"
    full_name: Optional[str] = None
    badge_number: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    username_exists = (
        db.query(User)
        .filter(User.username == payload.username)
        .first()
    )

    if username_exists:
        raise HTTPException(
            status_code=409,
            detail="Username already exists",
        )

    email_exists = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if email_exists:
        raise HTTPException(
            status_code=409,
            detail="Email already exists",
        )

    role = (payload.role or "viewer").lower()

    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}",
        )

    # Public registration can only create viewer accounts.
    role = "viewer"

    user = User(
        username=payload.username,
        email=payload.email,
        role=role,
        full_name=payload.full_name,
        badge_number=payload.badge_number,
    )

    user.set_password(payload.password)

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully",
        "user": user.to_dict(),
    }


@router.post("/login")
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user or not user.check_password(payload.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "user": current_user.to_dict(),
    }