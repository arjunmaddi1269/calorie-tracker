"""Authentication service."""
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.auth import UserLogin, UserRegister, Token


class AuthService:
    """Authentication service for handling login, registration, and token management."""

    @staticmethod
    async def register_user(db: AsyncSession, user_data: UserRegister) -> User:
        """
        Register a new user.

        Args:
            db: Database session
            user_data: User registration data

        Returns:
            Created user object

        Raises:
            ValueError: If email already exists
        """
        # Check if user exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise ValueError("Email already registered")

        # Create new user
        new_user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
        )

        db.add(new_user)
        await db.flush()

        # Create free subscription for new user
        subscription = Subscription(
            user_id=new_user.id,
            plan_type="free",
            status="active",
            daily_scan_limit=5,
        )
        db.add(subscription)

        await db.commit()
        await db.refresh(new_user)

        return new_user

    @staticmethod
    async def authenticate_user(db: AsyncSession, login_data: UserLogin) -> User | None:
        """
        Authenticate a user with email and password.

        Args:
            db: Database session
            login_data: Login credentials

        Returns:
            User object if authentication successful, None otherwise
        """
        result = await db.execute(select(User).where(User.email == login_data.email))
        user = result.scalar_one_or_none()

        if not user:
            return None

        if not verify_password(login_data.password, user.password_hash):
            return None

        if not user.is_active:
            return None

        return user

    @staticmethod
    def create_tokens(user_id: str) -> Token:
        """
        Create access and refresh tokens for a user.

        Args:
            user_id: User ID

        Returns:
            Token object with access and refresh tokens
        """
        access_token = create_access_token(data={"sub": str(user_id)})
        refresh_token = create_refresh_token(data={"sub": str(user_id)})

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    @staticmethod
    async def get_current_user(db: AsyncSession, token: str) -> User | None:
        """
        Get current user from access token.

        Args:
            db: Database session
            token: JWT access token

        Returns:
            User object if token valid, None otherwise
        """
        payload = decode_token(token)

        if not payload or payload.get("type") != "access":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        return user

    @staticmethod
    async def refresh_access_token(db: AsyncSession, refresh_token: str) -> Token | None:
        """
        Refresh access token using refresh token.

        Args:
            db: Database session
            refresh_token: JWT refresh token

        Returns:
            New token pair if refresh token valid, None otherwise
        """
        payload = decode_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        # Verify user still exists and is active
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            return None

        return AuthService.create_tokens(user_id)
