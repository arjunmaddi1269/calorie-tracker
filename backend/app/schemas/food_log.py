"""Food log schemas."""
from datetime import datetime
from datetime import date as DateType
from decimal import Decimal
from uuid import UUID
from typing import Any, Optional
from pydantic import BaseModel, Field


class FoodLogBase(BaseModel):
    """Base food log schema."""

    meal_type: str | None = Field(None, pattern="^(breakfast|lunch|dinner|snack)$")
    food_name: str = Field(..., min_length=1, max_length=255)
    serving_size: Decimal | None = Field(None, ge=0)
    serving_unit: str | None = Field(None, max_length=50)
    calories: int = Field(..., ge=0)
    protein_g: Decimal | None = Field(None, ge=0)
    carbs_g: Decimal | None = Field(None, ge=0)
    fat_g: Decimal | None = Field(None, ge=0)
    fiber_g: Decimal | None = Field(None, ge=0)


class FoodLogCreate(FoodLogBase):
    """Food log creation schema."""

    date: Optional[DateType] = None
    photo_s3_key: str | None = None
    ai_confidence: Decimal | None = Field(None, ge=0, le=1)
    ai_detected_foods: list[dict[str, Any]] | None = None
    is_manual_entry: bool = False


class FoodLogUpdate(BaseModel):
    """Food log update schema."""

    meal_type: str | None = Field(None, pattern="^(breakfast|lunch|dinner|snack)$")
    food_name: str | None = Field(None, min_length=1, max_length=255)
    serving_size: Decimal | None = Field(None, ge=0)
    serving_unit: str | None = None
    calories: int | None = Field(None, ge=0)
    protein_g: Decimal | None = Field(None, ge=0)
    carbs_g: Decimal | None = Field(None, ge=0)
    fat_g: Decimal | None = Field(None, ge=0)
    fiber_g: Decimal | None = Field(None, ge=0)


class FoodLog(FoodLogBase):
    """Food log response schema."""

    id: UUID
    user_id: UUID
    photo_url: str | None = None
    photo_s3_key: str | None = None
    ai_confidence: Decimal | None = None
    ai_detected_foods: list[dict[str, Any]] | None = None
    logged_at: datetime
    date: DateType
    created_at: datetime
    updated_at: datetime
    is_manual_entry: bool

    class Config:
        from_attributes = True


class FoodLogList(BaseModel):
    """Paginated food log list response."""

    items: list[FoodLog]
    total: int
    page: int
    page_size: int
    pages: int


class DailySummary(BaseModel):
    """Daily calorie and macro summary."""

    date: DateType
    total_calories: int
    total_protein_g: Decimal
    total_carbs_g: Decimal
    total_fat_g: Decimal
    total_fiber_g: Decimal
    meal_count: int
    calorie_target: int | None = None
    protein_target: int | None = None
    carbs_target: int | None = None
    fat_target: int | None = None
    calories_remaining: int | None = None


class AIFoodAnalysis(BaseModel):
    """AI food analysis result."""

    food_name: str
    confidence: float = Field(..., ge=0, le=1)
    calories: int
    protein_g: Decimal
    carbs_g: Decimal
    fat_g: Decimal
    fiber_g: Decimal
    serving_size: Decimal
    serving_unit: str
    detected_items: list[dict[str, Any]] = []
