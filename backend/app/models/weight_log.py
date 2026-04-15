"""Weight log database model."""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, Date, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class WeightLog(Base):
    """Weight tracking log model."""

    __tablename__ = "weight_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weight_kg = Column(Numeric(5, 2), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="weight_logs")

    def __repr__(self) -> str:
        return f"<WeightLog {self.weight_kg} kg on {self.date}>"
