from datetime import datetime, timedelta, timezone
from typing import Optional
import asyncio
from jose import JWTError, jwt
import bcrypt
from core.config import settings


# ---------------------------------------------------------------------------
# Password hashing — bcrypt with 10 rounds (fast but still secure)
# Run in thread pool to avoid blocking the async event loop
# ---------------------------------------------------------------------------

_BCRYPT_ROUNDS = 10  # 10 rounds ≈ 0.1s vs 12 rounds ≈ 0.4s


def hash_password(password: str) -> str:
    """Hash a password using bcrypt (sync — call from thread or startup only)."""
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its bcrypt hash (sync)."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


async def hash_password_async(password: str) -> str:
    """Non-blocking password hash — runs bcrypt in a thread pool executor."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, hash_password, password)


async def verify_password_async(plain_password: str, hashed_password: str) -> bool:
    """Non-blocking password verify — runs bcrypt in a thread pool executor."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, verify_password, plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token. Returns None on any error."""
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        return None
