"""User and UserProfile database models."""
import uuid
from datetime import datetime, date
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Nullable for OAuth users
    first_name = Column(String(100))
    last_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    email_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # OAuth fields
    oauth_provider = Column(String(50), nullable=True)  # google, apple, facebook, etc.
    oauth_id = Column(String(255), nullable=True)  # Provider's user ID

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    food_logs = relationship("FoodLog", back_populates="user", cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class UserProfile(Base):
    """User profile with health goals and metrics."""

    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(Date)
    sex = Column(String(10))  # male, female, other
    height_cm = Column(Numeric(5, 2))
    current_weight_kg = Column(Numeric(5, 2))
    target_weight_kg = Column(Numeric(5, 2))
    activity_level = Column(String(20))  # sedentary, light, moderate, active, very_active
    goal_type = Column(String(20))  # lose_weight, maintain, gain_muscle
    daily_calorie_target = Column(Integer)
    daily_protein_target = Column(Integer)
    daily_carbs_target = Column(Integer)
    daily_fat_target = Column(Integer)
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<UserProfile user_id={self.user_id}>"
