"""Subscription database model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Subscription(Base):
    """User subscription model."""

    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_type = Column(String(20), default="free")  # free, premium_monthly, premium_annual
    status = Column(String(20), default="active")  # active, cancelled, expired, trial
    trial_start_date = Column(DateTime(timezone=True))
    trial_end_date = Column(DateTime(timezone=True))
    subscription_start_date = Column(DateTime(timezone=True))
    subscription_end_date = Column(DateTime(timezone=True))
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    daily_scan_limit = Column(Integer, default=5)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subscription")

    def __repr__(self) -> str:
        return f"<Subscription {self.plan_type} - {self.status}>"
