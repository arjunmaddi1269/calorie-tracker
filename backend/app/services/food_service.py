"""Food service for managing food logs."""
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.food_log import FoodLog
from app.models.user import UserProfile
from app.schemas.food_log import FoodLogCreate, FoodLogUpdate, DailySummary


class FoodService:
    """Food service for managing food logs and nutrition tracking."""

    @staticmethod
    async def create_food_log(
        db: AsyncSession, user_id: str, food_data: FoodLogCreate
    ) -> FoodLog:
        """
        Create a new food log entry.

        Args:
            db: Database session
            user_id: User ID
            food_data: Food log data

        Returns:
            Created food log
        """
        # Use provided date or default to today
        log_date = food_data.date if food_data.date else date.today()

        food_log = FoodLog(
            user_id=user_id,
            meal_type=food_data.meal_type,
            food_name=food_data.food_name,
            serving_size=food_data.serving_size,
            serving_unit=food_data.serving_unit,
            calories=food_data.calories,
            protein_g=food_data.protein_g,
            carbs_g=food_data.carbs_g,
            fat_g=food_data.fat_g,
            fiber_g=food_data.fiber_g,
            photo_s3_key=food_data.photo_s3_key,
            ai_confidence=food_data.ai_confidence,
            ai_detected_foods=food_data.ai_detected_foods,
            date=log_date,
            is_manual_entry=food_data.is_manual_entry,
        )

        db.add(food_log)
        await db.commit()
        await db.refresh(food_log)

        return food_log

    @staticmethod
    async def get_food_logs(
        db: AsyncSession,
        user_id: str,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[FoodLog], int]:
        """
        Get user's food logs with optional date filtering.

        Args:
            db: Database session
            user_id: User ID
            start_date: Optional start date filter
            end_date: Optional end date filter
            limit: Maximum number of results
            offset: Pagination offset

        Returns:
            Tuple of (food logs list, total count)
        """
        # Build query
        query = select(FoodLog).where(FoodLog.user_id == user_id)

        if start_date:
            query = query.where(FoodLog.date >= start_date)
        if end_date:
            query = query.where(FoodLog.date <= end_date)

        # Get total count
        count_query = select(func.count()).select_from(FoodLog).where(FoodLog.user_id == user_id)
        if start_date:
            count_query = count_query.where(FoodLog.date >= start_date)
        if end_date:
            count_query = count_query.where(FoodLog.date <= end_date)

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(FoodLog.logged_at.desc()).limit(limit).offset(offset)
        result = await db.execute(query)
        food_logs = result.scalars().all()

        return list(food_logs), total

    @staticmethod
    async def get_food_log_by_id(
        db: AsyncSession, user_id: str, log_id: str
    ) -> FoodLog | None:
        """Get a specific food log by ID."""
        result = await db.execute(
            select(FoodLog).where(
                and_(FoodLog.id == log_id, FoodLog.user_id == user_id)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_food_log(
        db: AsyncSession, user_id: str, log_id: str, update_data: FoodLogUpdate
    ) -> FoodLog | None:
        """Update a food log entry."""
        food_log = await FoodService.get_food_log_by_id(db, user_id, log_id)

        if not food_log:
            return None

        # Update fields
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(food_log, field, value)

        await db.commit()
        await db.refresh(food_log)

        return food_log

    @staticmethod
    async def delete_food_log(db: AsyncSession, user_id: str, log_id: str) -> bool:
        """Delete a food log entry."""
        food_log = await FoodService.get_food_log_by_id(db, user_id, log_id)

        if not food_log:
            return False

        await db.delete(food_log)
        await db.commit()

        return True

    @staticmethod
    async def get_daily_summary(
        db: AsyncSession, user_id: str, summary_date: date | None = None
    ) -> DailySummary:
        """
        Get daily nutrition summary for a user.

        Args:
            db: Database session
            user_id: User ID
            summary_date: Date to summarize (default: today)

        Returns:
            Daily summary with totals and targets
        """
        if not summary_date:
            summary_date = date.today()

        # Get food logs for the day
        result = await db.execute(
            select(FoodLog).where(
                and_(FoodLog.user_id == user_id, FoodLog.date == summary_date)
            )
        )
        logs = result.scalars().all()

        # Calculate totals
        total_calories = sum(log.calories for log in logs)
        total_protein = sum(log.protein_g or Decimal(0) for log in logs)
        total_carbs = sum(log.carbs_g or Decimal(0) for log in logs)
        total_fat = sum(log.fat_g or Decimal(0) for log in logs)
        total_fiber = sum(log.fiber_g or Decimal(0) for log in logs)
        meal_count = len(logs)

        # Get user's targets
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()

        calorie_target = profile.daily_calorie_target if profile else None
        protein_target = profile.daily_protein_target if profile else None
        carbs_target = profile.daily_carbs_target if profile else None
        fat_target = profile.daily_fat_target if profile else None

        calories_remaining = (
            calorie_target - total_calories if calorie_target else None
        )

        return DailySummary(
            date=summary_date,
            total_calories=total_calories,
            total_protein_g=total_protein,
            total_carbs_g=total_carbs,
            total_fat_g=total_fat,
            total_fiber_g=total_fiber,
            meal_count=meal_count,
            calorie_target=calorie_target,
            protein_target=protein_target,
            carbs_target=carbs_target,
            fat_target=fat_target,
            calories_remaining=calories_remaining,
        )

    @staticmethod
    async def get_recent_foods(db: AsyncSession, user_id: str, limit: int = 10) -> list[FoodLog]:
        """Get user's recently logged foods."""
        result = await db.execute(
            select(FoodLog)
            .where(FoodLog.user_id == user_id)
            .order_by(FoodLog.logged_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_frequent_foods(
        db: AsyncSession, user_id: str, limit: int = 10
    ) -> list[dict]:
        """Get user's most frequently logged foods."""
        # Get food frequency
        result = await db.execute(
            select(
                FoodLog.food_name,
                func.count(FoodLog.id).label("count"),
                func.avg(FoodLog.calories).label("avg_calories"),
                func.avg(FoodLog.protein_g).label("avg_protein"),
                func.avg(FoodLog.carbs_g).label("avg_carbs"),
                func.avg(FoodLog.fat_g).label("avg_fat"),
            )
            .where(FoodLog.user_id == user_id)
            .group_by(FoodLog.food_name)
            .order_by(func.count(FoodLog.id).desc())
            .limit(limit)
        )

        frequent_foods = []
        for row in result:
            frequent_foods.append({
                "food_name": row.food_name,
                "count": row.count,
                "avg_calories": int(row.avg_calories) if row.avg_calories else 0,
                "avg_protein_g": float(row.avg_protein) if row.avg_protein else 0,
                "avg_carbs_g": float(row.avg_carbs) if row.avg_carbs else 0,
                "avg_fat_g": float(row.avg_fat) if row.avg_fat else 0,
            })

        return frequent_foods
