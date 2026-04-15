"""Authentication schemas."""
from pydantic import BaseModel, EmailStr, Field


class UserLogin(BaseModel):
    """User login request schema."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)


class UserRegister(BaseModel):
    """User registration request schema."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)


class Token(BaseModel):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""

    refresh_token: str


class TokenData(BaseModel):
    """Decoded token data schema."""

    sub: str  # user_id
    type: str  # access or refresh


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""

    email: EmailStr


class PasswordReset(BaseModel):
    """Password reset schema."""

    token: str
    new_password: str = Field(..., min_length=8)


class EmailVerification(BaseModel):
    """Email verification schema."""

    token: str
