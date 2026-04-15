"""Weight log schemas."""
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


class WeightLogBase(BaseModel):
    """Base weight log schema."""

    weight_kg: Decimal = Field(..., ge=20, le=500)
    date: date
    notes: str | None = None


class WeightLogCreate(WeightLogBase):
    """Weight log creation schema."""

    pass


class WeightLog(WeightLogBase):
    """Weight log response schema."""

    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class WeightLogList(BaseModel):
    """Weight log list response."""

    items: list[WeightLog]
    total: int
