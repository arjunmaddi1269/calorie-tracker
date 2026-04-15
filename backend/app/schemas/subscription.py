"""Subscription schemas."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class SubscriptionBase(BaseModel):
    """Base subscription schema."""

    plan_type: str
    status: str


class SubscriptionUpdate(BaseModel):
    """Subscription update schema."""

    plan_type: str | None = None
    status: str | None = None


class Subscription(SubscriptionBase):
    """Subscription response schema."""

    id: UUID
    user_id: UUID
    trial_start_date: datetime | None = None
    trial_end_date: datetime | None = None
    subscription_start_date: datetime | None = None
    subscription_end_date: datetime | None = None
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    daily_scan_limit: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubscriptionUsage(BaseModel):
    """Subscription usage response."""

    scans_used_today: int
    daily_scan_limit: int
    scans_remaining: int
    is_premium: bool
