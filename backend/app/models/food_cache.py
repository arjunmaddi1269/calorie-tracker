"""Food database cache model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class FoodDatabaseCache(Base):
    """Cached food nutrition data from external APIs."""

    __tablename__ = "food_database_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    food_name = Column(String(255), nullable=False, index=True)
    brand_name = Column(String(255))
    serving_size = Column(Numeric(10, 2))
    serving_unit = Column(String(50))
    calories = Column(Integer)
    protein_g = Column(Numeric(6, 2))
    carbs_g = Column(Numeric(6, 2))
    fat_g = Column(Numeric(6, 2))
    fiber_g = Column(Numeric(6, 2))
    barcode = Column(String(50), index=True)
    external_api = Column(String(50))  # fatsecret, usda, openfoodfacts
    external_id = Column(String(255))
    cached_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    access_count = Column(Integer, default=1)

    def __repr__(self) -> str:
        return f"<FoodDatabaseCache {self.food_name}>"
