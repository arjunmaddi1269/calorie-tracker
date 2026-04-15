"""User management API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import (
    User as UserSchema,
    UserProfile as UserProfileSchema,
    UserProfileUpdate,
    OnboardingData,
    CalorieGoals,
)
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user information.

    Args:
        current_user: Authenticated user

    Returns:
        User object
    """
    return current_user


@router.get("/profile", response_model=UserProfileSchema)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user profile with health goals.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        User profile

    Raises:
        HTTPException: If profile not found
    """
    profile = await UserService.get_user_profile(db, str(current_user.id))

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete onboarding.",
        )

    return profile


@router.put("/profile", response_model=UserProfileSchema)
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update user profile.

    Args:
        profile_data: Profile update data
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated profile

    Raises:
        HTTPException: If profile not found
    """
    profile = await UserService.update_user_profile(
        db, str(current_user.id), profile_data
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return profile


@router.post("/onboarding", response_model=UserProfileSchema, status_code=status.HTTP_201_CREATED)
async def complete_onboarding(
    onboarding_data: OnboardingData,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Complete user onboarding and set goals.

    This calculates daily calorie and macro targets based on user data.

    Args:
        onboarding_data: Onboarding form data
        current_user: Authenticated user
        db: Database session

    Returns:
        Created user profile with calculated goals
    """
    profile = await UserService.complete_onboarding(
        db, str(current_user.id), onboarding_data
    )

    return profile


@router.get("/goals", response_model=CalorieGoals)
async def get_calorie_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user's daily calorie and macro goals.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        Calorie and macro goals

    Raises:
        HTTPException: If profile/goals not set
    """
    profile = await UserService.get_user_profile(db, str(current_user.id))

    if not profile or not profile.daily_calorie_target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goals not set. Please complete onboarding.",
        )

    return CalorieGoals(
        daily_calorie_target=profile.daily_calorie_target,
        daily_protein_target=profile.daily_protein_target or 0,
        daily_carbs_target=profile.daily_carbs_target or 0,
        daily_fat_target=profile.daily_fat_target or 0,
    )
