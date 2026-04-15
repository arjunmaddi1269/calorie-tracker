"""User service for profile and goal management."""
from datetime import date
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserProfile
from app.schemas.user import OnboardingData, CalorieGoals, UserProfileUpdate


class UserService:
    """User service for managing user profiles and goals."""

    @staticmethod
    def calculate_bmr(
        weight_kg: Decimal, height_cm: Decimal, age: int, sex: str
    ) -> float:
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.

        Args:
            weight_kg: Weight in kilograms
            height_cm: Height in centimeters
            age: Age in years
            sex: Sex (male/female)

        Returns:
            BMR in calories
        """
        # Mifflin-St Jeor equation
        bmr = (10 * float(weight_kg)) + (6.25 * float(height_cm)) - (5 * age)

        if sex == "male":
            bmr += 5
        else:
            bmr -= 161

        return bmr

    @staticmethod
    def calculate_tdee(bmr: float, activity_level: str) -> float:
        """
        Calculate Total Daily Energy Expenditure.

        Args:
            bmr: Basal Metabolic Rate
            activity_level: Activity level (sedentary, light, moderate, active, very_active)

        Returns:
            TDEE in calories
        """
        activity_multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.9,
        }

        multiplier = activity_multipliers.get(activity_level, 1.2)
        return bmr * multiplier

    @staticmethod
    def calculate_calorie_target(
        tdee: float, goal_type: str, target_weight_kg: Decimal, current_weight_kg: Decimal
    ) -> int:
        """
        Calculate daily calorie target based on goal.

        Args:
            tdee: Total Daily Energy Expenditure
            goal_type: Goal type (lose_weight, maintain, gain_muscle)
            target_weight_kg: Target weight
            current_weight_kg: Current weight

        Returns:
            Daily calorie target
        """
        if goal_type == "lose_weight":
            # 500 calorie deficit for ~1 lb/week loss
            return int(tdee - 500)
        elif goal_type == "gain_muscle":
            # 300 calorie surplus for muscle gain
            return int(tdee + 300)
        else:  # maintain
            return int(tdee)

    @staticmethod
    def calculate_macro_targets(calorie_target: int, goal_type: str) -> dict[str, int]:
        """
        Calculate macro targets (protein, carbs, fat).

        Args:
            calorie_target: Daily calorie target
            goal_type: Goal type

        Returns:
            Dictionary with protein, carbs, and fat targets in grams
        """
        if goal_type == "lose_weight":
            # 40% protein, 30% carbs, 30% fat
            protein_ratio = 0.40
            carbs_ratio = 0.30
            fat_ratio = 0.30
        elif goal_type == "gain_muscle":
            # 35% protein, 45% carbs, 20% fat
            protein_ratio = 0.35
            carbs_ratio = 0.45
            fat_ratio = 0.20
        else:  # maintain
            # 30% protein, 40% carbs, 30% fat
            protein_ratio = 0.30
            carbs_ratio = 0.40
            fat_ratio = 0.30

        return {
            "protein": int((calorie_target * protein_ratio) / 4),  # 4 cal/g
            "carbs": int((calorie_target * carbs_ratio) / 4),  # 4 cal/g
            "fat": int((calorie_target * fat_ratio) / 9),  # 9 cal/g
        }

    @staticmethod
    async def complete_onboarding(
        db: AsyncSession, user_id: str, onboarding_data: OnboardingData
    ) -> UserProfile:
        """
        Complete user onboarding and calculate goals.

        Args:
            db: Database session
            user_id: User ID
            onboarding_data: Onboarding form data

        Returns:
            Created user profile with calculated goals
        """
        # Calculate age from date of birth
        today = date.today()
        age = (
            today.year
            - onboarding_data.date_of_birth.year
            - (
                (today.month, today.day)
                < (onboarding_data.date_of_birth.month, onboarding_data.date_of_birth.day)
            )
        )

        # Calculate BMR and TDEE
        bmr = UserService.calculate_bmr(
            onboarding_data.current_weight_kg,
            onboarding_data.height_cm,
            age,
            onboarding_data.sex,
        )

        tdee = UserService.calculate_tdee(bmr, onboarding_data.activity_level)

        # Calculate calorie target
        calorie_target = UserService.calculate_calorie_target(
            tdee,
            onboarding_data.goal_type,
            onboarding_data.target_weight_kg,
            onboarding_data.current_weight_kg,
        )

        # Calculate macro targets
        macros = UserService.calculate_macro_targets(calorie_target, onboarding_data.goal_type)

        # Create or update profile
        result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = result.scalar_one_or_none()

        if profile:
            # Update existing profile
            profile.date_of_birth = onboarding_data.date_of_birth
            profile.sex = onboarding_data.sex
            profile.height_cm = onboarding_data.height_cm
            profile.current_weight_kg = onboarding_data.current_weight_kg
            profile.target_weight_kg = onboarding_data.target_weight_kg
            profile.activity_level = onboarding_data.activity_level
            profile.goal_type = onboarding_data.goal_type
            profile.daily_calorie_target = calorie_target
            profile.daily_protein_target = macros["protein"]
            profile.daily_carbs_target = macros["carbs"]
            profile.daily_fat_target = macros["fat"]
        else:
            # Create new profile
            profile = UserProfile(
                user_id=user_id,
                date_of_birth=onboarding_data.date_of_birth,
                sex=onboarding_data.sex,
                height_cm=onboarding_data.height_cm,
                current_weight_kg=onboarding_data.current_weight_kg,
                target_weight_kg=onboarding_data.target_weight_kg,
                activity_level=onboarding_data.activity_level,
                goal_type=onboarding_data.goal_type,
                daily_calorie_target=calorie_target,
                daily_protein_target=macros["protein"],
                daily_carbs_target=macros["carbs"],
                daily_fat_target=macros["fat"],
            )
            db.add(profile)

        await db.commit()
        await db.refresh(profile)

        return profile

    @staticmethod
    async def get_user_profile(db: AsyncSession, user_id: str) -> UserProfile | None:
        """Get user profile."""
        result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_user_profile(
        db: AsyncSession, user_id: str, profile_data: UserProfileUpdate
    ) -> UserProfile | None:
        """Update user profile."""
        profile = await UserService.get_user_profile(db, user_id)

        if not profile:
            return None

        # Update fields
        for field, value in profile_data.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)

        await db.commit()
        await db.refresh(profile)

        return profile
