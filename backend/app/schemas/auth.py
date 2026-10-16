"""
ApplyZen Authentication Schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserSignUp(BaseModel):
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=30, description="Username for login")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2)


class UserLogin(BaseModel):
    # Flexible credentials: username or email
    email: Optional[str] = None
    username: Optional[str] = None
    username_or_email: Optional[str] = None
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: Optional[str] = None
    email: Optional[EmailStr] = None
    otp: Optional[str] = None
    new_password: str = Field(..., min_length=6)


class GoogleAuthRequest(BaseModel):
    token: Optional[str] = None
    id_token: Optional[str] = None
    access_token: Optional[str] = None
    credential: Optional[str] = None
    mode: Optional[str] = "login"  # "login" or "signup"


class MicrosoftAuthRequest(BaseModel):
    token: Optional[str] = None
    access_token: Optional[str] = None
    id_token: Optional[str] = None
    code: Optional[str] = None
    redirect_uri: Optional[str] = None
    mode: Optional[str] = "login"  # "login" or "signup"


class VerifyEmailRequest(BaseModel):
    token: Optional[str] = None
    email: Optional[str] = None
    otp: Optional[str] = None


class ResendVerificationRequest(BaseModel):
    email: EmailStr
