from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID
from typing import Optional



class SignupRequest(BaseModel):
    """Request schema for user signup"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    """Request schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginResponse(BaseModel):
    """Response schema for successful login"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """Response schema for user data"""
    id: UUID
    email: str
    created_at: datetime
    gemini_api_key: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    """Request schema for updating profile/email/API key"""
    email: EmailStr
    gemini_api_key: Optional[str] = None



class PasswordChangeRequest(BaseModel):
    """Request schema for changing user password"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    """Request schema for initiating a password reset request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request schema for resetting password using a reset token"""
    email: EmailStr
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

