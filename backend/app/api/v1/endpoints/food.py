"""Food logging API endpoints."""
from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.food_log import (
    FoodLog as FoodLogSchema,
    FoodLogCreate,
    FoodLogUpdate,
    FoodLogList,
    DailySummary,
    AIFoodAnalysis,
)
from app.services.food_service import FoodService
from app.services.ai_service import AIService
from app.utils.storage import storage_service

router = APIRouter()
ai_service = AIService()


@router.post("/analyze-photo", response_model=AIFoodAnalysis)
async def analyze_food_photo(
    file: Annotated[UploadFile, File(description="Food photo to analyze")],
    current_user: User = Depends(get_current_user),
):
    """
    Analyze food photo using AI to detect food and nutrition info.

    Args:
        file: Uploaded food image
        current_user: Authenticated user

    Returns:
        AI analysis result with detected food and nutrition

    Raises:
        HTTPException: If file type invalid or analysis fails
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    # Read file data
    try:
        image_data = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}",
        )

    # Analyze with AI
    try:
        analysis = await ai_service.analyze_food_photo(image_data)
        return analysis
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/log", response_model=FoodLogSchema, status_code=status.HTTP_201_CREATED)
async def create_food_log(
    food_data: FoodLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new food log entry.

    Args:
        food_data: Food log data
        current_user: Authenticated user
        db: Database session

    Returns:
        Created food log entry
    """
    food_log = await FoodService.create_food_log(db, str(current_user.id), food_data)
    return food_log


@router.post("/log-with-photo", response_model=FoodLogSchema, status_code=status.HTTP_201_CREATED)
async def create_food_log_with_photo(
    file: Annotated[UploadFile, File(description="Food photo")],
    meal_type: Annotated[str, Form()] = "snack",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze food photo and create log entry in one step.

    Args:
        file: Uploaded food image
        meal_type: Type of meal (breakfast, lunch, dinner, snack)
        current_user: Authenticated user
        db: Database session

    Returns:
        Created food log entry with AI analysis

    Raises:
        HTTPException: If analysis or upload fails
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    # Read file data
    image_data = await file.read()

    # Analyze with AI
    try:
        analysis = await ai_service.analyze_food_photo(image_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}",
        )

    # Upload photo to S3
    try:
        s3_key, photo_url = await storage_service.upload_file(
            image_data,
            str(current_user.id),
            file.filename or "food.jpg",
            file.content_type or "image/jpeg",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload photo: {str(e)}",
        )

    # Create food log
    food_data = FoodLogCreate(
        meal_type=meal_type,
        food_name=analysis.food_name,
        serving_size=analysis.serving_size,
        serving_unit=analysis.serving_unit,
        calories=analysis.calories,
        protein_g=analysis.protein_g,
        carbs_g=analysis.carbs_g,
        fat_g=analysis.fat_g,
        fiber_g=analysis.fiber_g,
        photo_s3_key=s3_key,
        ai_confidence=analysis.confidence,
        ai_detected_foods=analysis.detected_items,
        is_manual_entry=False,
    )

    food_log = await FoodService.create_food_log(db, str(current_user.id), food_data)

    # Set photo URL on response
    food_log.photo_url = photo_url

    return food_log


@router.get("/logs", response_model=FoodLogList)
async def get_food_logs(
    start_date: date | None = None,
    end_date: date | None = None,
    page: int = 1,
    page_size: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user's food logs with optional date filtering and pagination.

    Args:
        start_date: Optional start date filter
        end_date: Optional end date filter
        page: Page number (1-indexed)
        page_size: Items per page
        current_user: Authenticated user
        db: Database session

    Returns:
        Paginated list of food logs
    """
    offset = (page - 1) * page_size
    logs, total = await FoodService.get_food_logs(
        db, str(current_user.id), start_date, end_date, page_size, offset
    )

    pages = (total + page_size - 1) // page_size  # Ceiling division

    return FoodLogList(
        items=logs,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/logs/{log_id}", response_model=FoodLogSchema)
async def get_food_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific food log by ID.

    Args:
        log_id: Food log ID
        current_user: Authenticated user
        db: Database session

    Returns:
        Food log entry

    Raises:
        HTTPException: If log not found
    """
    food_log = await FoodService.get_food_log_by_id(db, str(current_user.id), log_id)

    if not food_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food log not found",
        )

    return food_log


@router.put("/logs/{log_id}", response_model=FoodLogSchema)
async def update_food_log(
    log_id: str,
    update_data: FoodLogUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a food log entry.

    Args:
        log_id: Food log ID
        update_data: Updated data
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated food log

    Raises:
        HTTPException: If log not found
    """
    food_log = await FoodService.update_food_log(
        db, str(current_user.id), log_id, update_data
    )

    if not food_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food log not found",
        )

    return food_log


@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_food_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a food log entry.

    Args:
        log_id: Food log ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTPException: If log not found
    """
    success = await FoodService.delete_food_log(db, str(current_user.id), log_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food log not found",
        )


@router.get("/daily-summary", response_model=DailySummary)
async def get_daily_summary(
    date_param: date | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get daily nutrition summary.

    Args:
        date_param: Date to summarize (default: today)
        current_user: Authenticated user
        db: Database session

    Returns:
        Daily summary with totals and targets
    """
    summary = await FoodService.get_daily_summary(db, str(current_user.id), date_param)
    return summary


@router.get("/recent", response_model=list[FoodLogSchema])
async def get_recent_foods(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get recently logged foods.

    Args:
        limit: Maximum number of results
        current_user: Authenticated user
        db: Database session

    Returns:
        List of recent food logs
    """
    recent = await FoodService.get_recent_foods(db, str(current_user.id), limit)
    return recent


@router.get("/frequent")
async def get_frequent_foods(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get most frequently logged foods.

    Args:
        limit: Maximum number of results
        current_user: Authenticated user
        db: Database session

    Returns:
        List of frequent foods with averages
    """
    frequent = await FoodService.get_frequent_foods(db, str(current_user.id), limit)
    return frequent


@router.get("/search")
async def search_food_database(
    query: str,
    limit: int = 10,
):
    """
    Search food database.

    Args:
        query: Search query
        limit: Maximum results

    Returns:
        List of matching foods
    """
    results = await ai_service.search_food_database(query, limit)
    return results


@router.post("/scan-barcode")
async def scan_barcode(
    barcode: str,
):
    """
    Look up food by barcode.

    Args:
        barcode: Product barcode

    Returns:
        Food nutrition info

    Raises:
        HTTPException: If barcode not found
    """
    result = await ai_service.scan_barcode(barcode)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return result
