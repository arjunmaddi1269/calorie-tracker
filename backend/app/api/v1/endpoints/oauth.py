"""OAuth authentication endpoints (Google, Apple, etc.)"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.auth import Token
from app.services.auth_service import AuthService

router = APIRouter()


class GoogleAuthRequest(BaseModel):
    """Google OAuth token request."""
    id_token: str


class GoogleAuthResponse(BaseModel):
    """Google OAuth response."""
    access_token: str
    refresh_token: str
    token_type: str
    is_new_user: bool


@router.post("/google", response_model=GoogleAuthResponse)
async def google_auth(
    auth_data: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate with Google OAuth.

    This endpoint accepts a Google ID token from the frontend,
    verifies it, and creates or logs in the user.

    Args:
        auth_data: Google ID token from frontend
        db: Database session

    Returns:
        JWT access and refresh tokens

    Raises:
        HTTPException: If token is invalid or authentication fails
    """
    try:
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            auth_data.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        # Extract user info from token
        google_user_id = idinfo['sub']
        email = idinfo.get('email')
        email_verified = idinfo.get('email_verified', False)
        first_name = idinfo.get('given_name')
        last_name = idinfo.get('family_name')
        picture = idinfo.get('picture')

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google",
            )

        # Check if user exists by OAuth ID
        result = await db.execute(
            select(User).where(
                User.oauth_provider == "google",
                User.oauth_id == google_user_id
            )
        )
        user = result.scalar_one_or_none()

        is_new_user = False

        if user:
            # Existing OAuth user - just login
            pass
        else:
            # Check if email already exists (maybe registered with password)
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

            if user:
                # User exists with this email, link OAuth account
                user.oauth_provider = "google"
                user.oauth_id = google_user_id
                user.email_verified = email_verified or user.email_verified

                # Update name if not set
                if not user.first_name and first_name:
                    user.first_name = first_name
                if not user.last_name and last_name:
                    user.last_name = last_name
            else:
                # New user - create account
                user = User(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    email_verified=email_verified,
                    oauth_provider="google",
                    oauth_id=google_user_id,
                    password_hash=None,  # No password for OAuth users
                )
                db.add(user)
                await db.flush()

                # Create free subscription
                subscription = Subscription(
                    user_id=user.id,
                    plan_type="free",
                    status="active",
                    daily_scan_limit=5,
                )
                db.add(subscription)

                is_new_user = True

        await db.commit()
        await db.refresh(user)

        # Create JWT tokens
        tokens = AuthService.create_tokens(str(user.id))

        return GoogleAuthResponse(
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token,
            token_type=tokens.token_type,
            is_new_user=is_new_user,
        )

    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )
    except Exception as e:
        # Other errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}",
        )


@router.get("/google/url")
async def get_google_auth_url():
    """
    Get Google OAuth URL for client-side authentication.

    Returns the OAuth URL that the frontend should redirect to.
    This is optional - the frontend can construct this URL itself.
    """
    # Google OAuth URL format
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "token id_token",
        "scope": "openid email profile",
        "nonce": "random_nonce",  # In production, generate a random nonce
    }

    # Construct URL
    url = f"{base_url}?" + "&".join([f"{k}={v}" for k, v in params.items()])

    return {"url": url}
