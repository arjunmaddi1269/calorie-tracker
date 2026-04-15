"""Food log database model."""
import uuid
from datetime import datetime, date
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class FoodLog(Base):
    """Food log entry model."""

    __tablename__ = "food_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meal_type = Column(String(20))  # breakfast, lunch, dinner, snack
    food_name = Column(String(255), nullable=False)
    serving_size = Column(Numeric(10, 2))
    serving_unit = Column(String(50))
    calories = Column(Integer, nullable=False)
    protein_g = Column(Numeric(6, 2))
    carbs_g = Column(Numeric(6, 2))
    fat_g = Column(Numeric(6, 2))
    fiber_g = Column(Numeric(6, 2))
    photo_url = Column(Text)
    photo_s3_key = Column(String(500))
    ai_confidence = Column(Numeric(3, 2))  # 0.00 to 1.00
    ai_detected_foods = Column(JSONB)  # Array of detected items
    logged_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    is_manual_entry = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="food_logs")

    def __repr__(self) -> str:
        return f"<FoodLog {self.food_name} - {self.calories} cal>"
