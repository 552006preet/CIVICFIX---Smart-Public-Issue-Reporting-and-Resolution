from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from app.utils.error_handler import log_system_event

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new citizen or administrator.
    Validates input, checks for duplicate email, hashes password,
    and returns a signed JWT authentication token.
    """
    email_clean = user_data.email.lower().strip()
    
    # Check if user already exists
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in.",
        )
    
    # Hash the password for security
    hashed_pwd = hash_password(user_data.password)

    new_user = User(
        full_name=user_data.full_name.strip(),
        email=email_clean,
        hashed_password=hashed_pwd,
        role=user_data.role if user_data.role in ["citizen", "admin"] else "citizen",
        phone=user_data.phone.strip() if user_data.phone else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_system_event(
        level="INFO",
        category="AUTH",
        message=f"New user registered: {new_user.email} (Role: {new_user.role})",
        db=db
    )

    # Generate token
    token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role, "email": new_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates citizen or admin credentials.
    Returns a signed JWT token on success.
    """
    email_clean = credentials.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        log_system_event(
            level="WARNING",
            category="AUTH",
            message=f"Failed login attempt for email: {email_clean}",
            db=db
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )
    
    token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})

    log_system_event(
        level="INFO",
        category="AUTH",
        message=f"Successful login for user: {user.email}",
        db=db
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile information."""
    return current_user
