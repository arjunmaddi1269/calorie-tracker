"""User and profile schemas."""
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None


class UserCreate(UserBase):
    """User creation schema."""

    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """User update schema."""

    first_name: str | None = None
    last_name: str | None = None


class User(UserBase):
    """User response schema."""

    id: UUID
    email_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileBase(BaseModel):
    """Base user profile schema."""

    date_of_birth: date | None = None
    sex: str | None = Field(None, pattern="^(male|female|other)$")
    height_cm: Decimal | None = Field(None, ge=50, le=300)
    current_weight_kg: Decimal | None = Field(None, ge=20, le=500)
    target_weight_kg: Decimal | None = Field(None, ge=20, le=500)
    activity_level: str | None = Field(
        None, pattern="^(sedentary|light|moderate|active|very_active)$"
    )
    goal_type: str | None = Field(None, pattern="^(lose_weight|maintain|gain_muscle)$")
    timezone: str | None = "UTC"


class UserProfileUpdate(UserProfileBase):
    """User profile update schema."""

    pass


class UserProfile(UserProfileBase):
    """User profile response schema."""

    id: UUID
    user_id: UUID
    daily_calorie_target: int | None = None
    daily_protein_target: int | None = None
    daily_carbs_target: int | None = None
    daily_fat_target: int | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OnboardingData(BaseModel):
    """Onboarding data schema."""

    date_of_birth: date
    sex: str = Field(..., pattern="^(male|female|other)$")
    height_cm: Decimal = Field(..., ge=50, le=300)
    current_weight_kg: Decimal = Field(..., ge=20, le=500)
    target_weight_kg: Decimal = Field(..., ge=20, le=500)
    activity_level: str = Field(..., pattern="^(sedentary|light|moderate|active|very_active)$")
    goal_type: str = Field(..., pattern="^(lose_weight|maintain|gain_muscle)$")


class CalorieGoals(BaseModel):
    """Calorie and macro goals response."""

    daily_calorie_target: int
    daily_protein_target: int
    daily_carbs_target: int
    daily_fat_target: int
