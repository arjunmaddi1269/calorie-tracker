"""Main FastAPI application."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.

    Args:
        app: FastAPI application instance
    """
    # Startup: Initialize database
    await init_db()
    yield
    # Shutdown: Close database connections
    await close_db()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Calorie Tracker API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "environment": settings.APP_ENV}


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Calorie Tracker API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }


# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    if settings.DEBUG:
        # In development, show detailed error
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
            },
        )
    else:
        # In production, hide details
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
