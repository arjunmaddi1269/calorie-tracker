"""Authentication API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import UserLogin, UserRegister, Token, RefreshTokenRequest
from app.schemas.user import User as UserSchema
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        Created user object

    Raises:
        HTTPException: If email already exists
    """
    try:
        user = await AuthService.register_user(db, user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login with email and password.

    Args:
        login_data: Login credentials
        db: Database session

    Returns:
        JWT access and refresh tokens

    Raises:
        HTTPException: If authentication fails
    """
    user = await AuthService.authenticate_user(db, login_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthService.create_tokens(str(user.id))


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token.

    Args:
        token_request: Refresh token request with refresh_token field
        db: Database session

    Returns:
        New JWT token pair

    Raises:
        HTTPException: If refresh token invalid
    """
    tokens = await AuthService.refresh_access_token(db, token_request.refresh_token)

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    return tokens


@router.post("/logout")
async def logout():
    """
    Logout user (client-side token deletion).

    Note: Since we're using stateless JWT tokens, actual logout
    happens on the client side by deleting the tokens.
    This endpoint exists for API completeness.
    """
    return {"message": "Successfully logged out"}
