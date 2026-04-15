"""Application configuration settings."""
from typing import List
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Calorie Tracker API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return []

    # AWS S3 / MinIO
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_S3_BUCKET: str
    AWS_S3_ENDPOINT_URL: str = ""
    AWS_S3_REGION: str = "us-east-1"

    # AWS Bedrock
    AWS_BEDROCK_REGION: str = "us-east-1"

    # OpenAI (Legacy - use Bedrock instead)
    OPENAI_API_KEY: str = ""

    # Anthropic (Legacy - use Bedrock instead)
    ANTHROPIC_API_KEY: str = ""

    # FatSecret API
    FATSECRET_CLIENT_ID: str = ""
    FATSECRET_CLIENT_SECRET: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_ID_MONTHLY: str = ""
    STRIPE_PRICE_ID_ANNUAL: str = ""

    # Email
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@example.com"

    # Sentry
    SENTRY_DSN: str = ""

    # Rate Limiting
    RATE_LIMIT_PHOTO_ANALYSIS: str = "10/minute"
    RATE_LIMIT_API_DEFAULT: str = "100/minute"
    FREE_TIER_DAILY_SCANS: int = 5

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/google/callback"


# Create settings instance
settings = Settings()
