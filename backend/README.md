# Calorie Tracker API (Backend)

FastAPI-based backend for the AI-powered calorie tracking application.

## Features

- JWT-based authentication
- User profile and goal management
- AI-powered food photo analysis (OpenAI Vision API)
- Food logging with nutrition tracking
- Daily calorie and macro summaries
- PostgreSQL database with async SQLAlchemy
- Redis caching
- S3/MinIO file storage
- RESTful API design

## Tech Stack

- **Framework**: FastAPI 0.109+
- **Language**: Python 3.11+
- **Database**: PostgreSQL 15+ (async)
- **Cache**: Redis 7+
- **Storage**: MinIO (S3-compatible)
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT (python-jose)

## Prerequisites

- Python 3.11+
- Poetry
- Docker & Docker Compose (for local development)

## Setup

### 1. Install Dependencies

```bash
cd backend
poetry install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `SECRET_KEY`: JWT secret key (generate with `openssl rand -hex 32`)
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for food analysis

### 3. Start Infrastructure

```bash
# From project root
docker-compose up -d postgres redis minio
```

### 4. Run Database Migrations

```bash
poetry run alembic upgrade head
```

### 5. Start Development Server

```bash
poetry run uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000

## API Documentation

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `POST /api/v1/users/onboarding` - Complete onboarding
- `GET /api/v1/users/goals` - Get calorie goals

### Food Logging
- `POST /api/v1/food/analyze-photo` - Analyze food photo
- `POST /api/v1/food/log` - Create food log
- `POST /api/v1/food/log-with-photo` - Analyze and log in one step
- `GET /api/v1/food/logs` - Get food logs (paginated)
- `GET /api/v1/food/logs/{id}` - Get specific log
- `PUT /api/v1/food/logs/{id}` - Update log
- `DELETE /api/v1/food/logs/{id}` - Delete log
- `GET /api/v1/food/daily-summary` - Get daily summary
- `GET /api/v1/food/recent` - Get recent foods
- `GET /api/v1/food/frequent` - Get frequent foods
- `GET /api/v1/food/search` - Search food database
- `POST /api/v1/food/scan-barcode` - Scan barcode

## Database Migrations

```bash
# Create a new migration
poetry run alembic revision --autogenerate -m "Description"

# Apply migrations
poetry run alembic upgrade head

# Rollback one migration
poetry run alembic downgrade -1

# Show current revision
poetry run alembic current
```

## Testing

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=app --cov-report=html

# Run specific test file
poetry run pytest tests/test_auth.py
```

## Code Quality

```bash
# Format code
poetry run black app tests

# Lint code
poetry run ruff check app tests

# Type checking
poetry run mypy app
```

## Docker Deployment

```bash
# Build image
docker build -t calorie-tracker-api .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://... \
  -e SECRET_KEY=... \
  calorie-tracker-api
```

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── app/
│   ├── api/             # API endpoints
│   │   └── v1/
│   │       └── endpoints/
│   ├── core/            # Core configuration
│   ├── models/          # Database models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── tests/               # Test suite
├── Dockerfile           # Docker configuration
├── pyproject.toml       # Poetry dependencies
└── alembic.ini         # Alembic configuration
```

## Environment Variables

See `.env.example` for all available configuration options.

## License

Proprietary
