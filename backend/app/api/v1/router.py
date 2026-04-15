"""API v1 router combining all endpoints."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, food, oauth

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["oauth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(food.router, prefix="/food", tags=["food"])
