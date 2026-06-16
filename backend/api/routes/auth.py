from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from uuid import UUID

from db.session import get_db
from models.user import User
from models.document import Document
from schemas.auth import (
    SignupRequest, LoginRequest, LoginResponse,
    UserResponse, ProfileUpdateRequest, PasswordChangeRequest,
    ForgotPasswordRequest, ResetPasswordRequest
)
from core.security import hash_password_async, verify_password_async, create_access_token, decode_access_token
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)

from utils.email import send_reset_password_email

router = APIRouter(prefix="/auth", tags=["authentication"])

_bearer = HTTPBearer(auto_error=True)


# ---------------------------------------------------------------------------
# Helper: get current user from Bearer token
# ---------------------------------------------------------------------------

async def _resolve_user(
    credentials: HTTPAuthorizationCredentials,
    db: AsyncSession,
) -> User:
    """Decode JWT and fetch the matching User row. Raises 401 on any failure."""
    token = credentials.credentials

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Parse UUID safely
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    new_user = User(
        email=request.email,
        password_hash=await hash_password_async(request.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    logger.info(f"New user registered: {new_user.email} (id={new_user.id})")
    return new_user


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and return a JWT access token."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    password_ok = user is not None and await verify_password_async(request.password, user.password_hash)
    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.JWT_EXPIRATION_MINUTES),
    )

    logger.info(f"User logged in: {user.email}")
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRATION_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user's profile."""
    user = await _resolve_user(credentials, db)
    return user


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """
    Logout endpoint (JWT is stateless — client must discard the token).
    Included for API completeness and future token-blacklist support.
    """
    return {"message": "Logged out successfully"}


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Update user email and/or Gemini API key."""
    current_user = await _resolve_user(credentials, db)

    if request.email != current_user.email:
        result = await db.execute(select(User).where(User.email == request.email))
        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )
        current_user.email = request.email

    current_user.gemini_api_key = request.gemini_api_key
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.put("/password", status_code=status.HTTP_200_OK)
async def update_password(
    request: PasswordChangeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Change the authenticated user's password."""
    current_user = await _resolve_user(credentials, db)

    if not await verify_password_async(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.password_hash = await hash_password_async(request.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Delete the authenticated user's account and all associated data."""
    current_user = await _resolve_user(credentials, db)

    # Delete user documents first
    result = await db.execute(select(Document).where(Document.user_id == current_user.id))
    documents = result.scalars().all()

    from services.ingestion import delete_document_data
    for doc in documents:
        try:
            await delete_document_data(doc.id, db)
        except Exception as e:
            logger.error(f"Failed to delete document {doc.id} during account deletion: {e}")

    await db.delete(current_user)
    await db.commit()

    logger.info(f"Account deleted: {current_user.email}")
    return {"message": "Account deleted successfully"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a password reset token for the user.
    If RESEND_API_KEY is available, we email it to them. Otherwise, we fall back to dev mode.
    """
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user is None:
        # To prevent user enumeration, we still return success but do not return a token.
        return {
            "message": "If this email exists in our system, a password reset link has been generated.",
            "token": None
        }

    # Generate a short-lived reset token (15 mins)
    reset_token = create_access_token(
        data={"sub": user.email, "type": "reset"},
        expires_delta=timedelta(minutes=15)
    )

    # Attempt to send via Resend
    email_sent = False
    if settings.RESEND_API_KEY:
        email_sent = await send_reset_password_email(user.email, reset_token)

    logger.info(f"Password reset requested for: {user.email} (Email sent: {email_sent})")
    
    if email_sent:
        return {
            "message": "A password reset code has been sent to your email address.",
            "token": None
        }
    else:
        return {
            "message": "Password reset token generated successfully (Dev Mode fallback).",
            "token": reset_token
        }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify the reset token and update the user's password.
    """
    payload = decode_access_token(request.token)
    if payload is None or payload.get("type") != "reset" or payload.get("sub") != request.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    # Find the user
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found",
        )

    # Update password hash
    user.password_hash = await hash_password_async(request.new_password)
    await db.commit()

    logger.info(f"Password reset successfully for: {user.email}")
    return {"message": "Password has been reset successfully"}
