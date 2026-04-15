# Technical Architecture Document
## AI-Powered Calorie Tracker

**Version**: 1.0
**Date**: March 11, 2026
**Tech Stack**: React (Web/Native) + Python (FastAPI)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├──────────────────────────┬──────────────────────────────────┤
│   Web Client (React)     │  Mobile Client (React Native)    │
│   - Progressive Web App  │  - iOS & Android                 │
│   - Responsive Design    │  - Native Camera Access          │
│   - Desktop/Tablet       │  - Depth Sensor Integration      │
└──────────────────────────┴──────────────────────────────────┘
                            │
                            │ REST API (HTTPS)
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                    API Gateway Layer                          │
│                   (FastAPI + Nginx)                          │
│   - Authentication Middleware                                 │
│   - Rate Limiting                                            │
│   - Request Validation                                       │
└───────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
┌─────────▼──────┐ ┌───────▼────────┐ ┌─────▼──────────┐
│  Auth Service  │ │  Core Service  │ │  AI Service    │
│  - JWT tokens  │ │  - Food logs   │ │  - Vision API  │
│  - User mgmt   │ │  - Dashboard   │ │  - Processing  │
└────────────────┘ └────────────────┘ └────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                     Data Layer                                │
├──────────────────────┬────────────────────┬──────────────────┤
│  PostgreSQL          │  Redis Cache       │  S3 Storage      │
│  - User data         │  - Session data    │  - Food photos   │
│  - Food logs         │  - API responses   │  - User images   │
│  - Subscriptions     │  - Rate limits     │                  │
└──────────────────────┴────────────────────┴──────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                  External Services                            │
├──────────────────────┬────────────────────┬──────────────────┤
│  OpenAI Vision API   │  FatSecret API     │  Stripe API      │
│  - Food recognition  │  - Food database   │  - Payments      │
│  - Portion sizing    │  - Nutrition data  │  - Subscriptions │
└──────────────────────┴────────────────────┴──────────────────┘
```

---

## Technology Stack

### Frontend

**Web Client**
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (lightweight, simple)
- **Routing**: React Router v6
- **UI Components**: Tailwind CSS + HeadlessUI
- **Forms**: React Hook Form + Zod validation
- **API Client**: Axios with React Query
- **Camera**: Browser MediaDevices API
- **Charts**: Recharts
- **PWA**: Vite PWA plugin

**Mobile Client**
- **Framework**: React Native with TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand (shared logic with web)
- **UI Library**: React Native Paper
- **Camera**: react-native-vision-camera
- **Depth Sensor**: react-native-arkit (iOS) / ARCore (Android)
- **Storage**: AsyncStorage + SQLite (offline)
- **API Client**: Axios with React Query

### Backend

**API Server**
- **Framework**: FastAPI 0.109+
- **Language**: Python 3.11+
- **ASGI Server**: Uvicorn
- **Async ORM**: SQLAlchemy 2.0 (async)
- **Migration Tool**: Alembic
- **Validation**: Pydantic v2
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt

**Background Jobs**
- **Task Queue**: Celery
- **Message Broker**: Redis
- **Scheduler**: Celery Beat

### Database & Storage

**Primary Database**
- **PostgreSQL 15+**
- **Extensions**: pgcrypto, uuid-ossp
- **Connection Pool**: asyncpg

**Cache Layer**
- **Redis 7+**
- **Use Cases**: Session storage, API response cache, rate limiting

**Object Storage**
- **Development**: MinIO (local S3-compatible)
- **Production**: AWS S3 or compatible service

### External APIs

**AI/ML Services**
- **Primary**: OpenAI GPT-4 Vision API
- **Fallback**: Anthropic Claude 3 with vision
- **Cost Management**: Response caching, batch processing

**Nutrition Database**
- **Primary**: FatSecret Platform API
- **Fallback**: USDA FoodData Central API
- **Barcode**: OpenFoodFacts API

**Payment Processing**
- **Development**: Stripe Test Mode
- **Production**: Stripe (web), Apple/Google IAP (mobile)

### DevOps & Infrastructure

**Development**
- **Containerization**: Docker + Docker Compose
- **Package Management**: Poetry (Python), pnpm (Node)
- **Code Quality**: Ruff (Python), ESLint + Prettier (JS/TS)
- **Pre-commit**: Husky + lint-staged

**CI/CD**
- **Platform**: GitHub Actions
- **Testing**: pytest (backend), Jest + Testing Library (frontend)
- **Coverage**: 80%+ target

**Monitoring**
- **Logging**: Structlog (Python), Winston (Node)
- **Metrics**: Prometheus + Grafana
- **Error Tracking**: Sentry
- **APM**: OpenTelemetry

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
```

### User Profiles Table
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    sex VARCHAR(10), -- male, female, other
    height_cm DECIMAL(5,2),
    current_weight_kg DECIMAL(5,2),
    target_weight_kg DECIMAL(5,2),
    activity_level VARCHAR(20), -- sedentary, light, moderate, active, very_active
    goal_type VARCHAR(20), -- lose_weight, maintain, gain_muscle
    daily_calorie_target INTEGER,
    daily_protein_target INTEGER,
    daily_carbs_target INTEGER,
    daily_fat_target INTEGER,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

### Food Logs Table
```sql
CREATE TABLE food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(20), -- breakfast, lunch, dinner, snack
    food_name VARCHAR(255) NOT NULL,
    serving_size DECIMAL(10,2),
    serving_unit VARCHAR(50),
    calories INTEGER NOT NULL,
    protein_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2),
    fat_g DECIMAL(6,2),
    fiber_g DECIMAL(6,2),
    photo_url TEXT,
    photo_s3_key VARCHAR(500),
    ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
    ai_detected_foods JSONB, -- array of detected items
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL, -- for easier querying
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_manual_entry BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, date DESC);
CREATE INDEX idx_food_logs_user_logged_at ON food_logs(user_id, logged_at DESC);
```

### Weight Tracking Table
```sql
CREATE TABLE weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    weight_kg DECIMAL(5,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, date DESC);
CREATE UNIQUE INDEX idx_weight_logs_user_date_unique ON weight_logs(user_id, date);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20), -- free, premium_monthly, premium_annual
    status VARCHAR(20), -- active, cancelled, expired, trial
    trial_start_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    daily_scan_limit INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### Food Database Cache Table
```sql
CREATE TABLE food_database_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    serving_size DECIMAL(10,2),
    serving_unit VARCHAR(50),
    calories INTEGER,
    protein_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2),
    fat_g DECIMAL(6,2),
    fiber_g DECIMAL(6,2),
    barcode VARCHAR(50),
    external_api VARCHAR(50), -- fatsecret, usda, openfoodfacts
    external_id VARCHAR(255),
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 1
);

CREATE INDEX idx_food_cache_name ON food_database_cache(food_name);
CREATE INDEX idx_food_cache_barcode ON food_database_cache(barcode);
CREATE INDEX idx_food_cache_access_count ON food_database_cache(access_count DESC);
```

---

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - Login (returns JWT)
POST   /api/v1/auth/refresh           - Refresh token
POST   /api/v1/auth/logout            - Logout (invalidate token)
POST   /api/v1/auth/forgot-password   - Request password reset
POST   /api/v1/auth/reset-password    - Reset password with token
GET    /api/v1/auth/verify-email      - Verify email address
```

### Users & Profiles
```
GET    /api/v1/users/me               - Get current user profile
PUT    /api/v1/users/me               - Update user profile
DELETE /api/v1/users/me               - Delete account
POST   /api/v1/users/onboarding       - Complete onboarding flow
GET    /api/v1/users/goals            - Get calorie/macro goals
PUT    /api/v1/users/goals            - Update goals
```

### Food Logging
```
POST   /api/v1/food/analyze-photo     - Upload photo for AI analysis
POST   /api/v1/food/log               - Log food entry
GET    /api/v1/food/logs              - Get food logs (paginated)
GET    /api/v1/food/logs/:id          - Get single log
PUT    /api/v1/food/logs/:id          - Update food log
DELETE /api/v1/food/logs/:id          - Delete food log
GET    /api/v1/food/daily-summary     - Get today's calorie summary
```

### Food Database
```
GET    /api/v1/food/search            - Search food database
GET    /api/v1/food/recent            - Get recently logged foods
GET    /api/v1/food/frequent          - Get frequently logged foods
POST   /api/v1/food/scan-barcode      - Scan barcode for nutrition
POST   /api/v1/food/custom            - Add custom food
```

### Progress Tracking
```
GET    /api/v1/progress/weekly        - Get 7-day summary
GET    /api/v1/progress/monthly       - Get 30-day summary
POST   /api/v1/progress/weight        - Log weight entry
GET    /api/v1/progress/weight        - Get weight history
GET    /api/v1/progress/streaks       - Get logging streaks
```

### Subscriptions
```
GET    /api/v1/subscription           - Get subscription status
POST   /api/v1/subscription/checkout  - Create checkout session
POST   /api/v1/subscription/cancel    - Cancel subscription
GET    /api/v1/subscription/usage     - Get daily scan usage
POST   /api/v1/webhooks/stripe        - Stripe webhook handler
```

---

## Security Implementation

### Authentication Flow
1. User registers → Email verification sent
2. User logs in → JWT access token (15 min) + refresh token (7 days)
3. Access token stored in memory (web) or secure storage (mobile)
4. Refresh token in httpOnly cookie (web) or encrypted storage (mobile)
5. Token refresh happens automatically before expiration

### Authorization
- Role-based access control (RBAC)
- Resource ownership validation (users can only access their own data)
- Rate limiting per endpoint (e.g., 100 requests/min for photo analysis)

### Data Protection
- Passwords hashed with bcrypt (12 rounds)
- Sensitive data encrypted at rest (AES-256)
- TLS 1.3 for all API communication
- CORS configured for specific origins only
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization

---

## Performance Optimization

### API Response Times
- Target: p95 < 200ms for non-AI endpoints
- Target: p95 < 3s for AI photo analysis
- Strategies:
  - Database connection pooling
  - Redis caching for frequent queries
  - CDN for static assets
  - Image compression before upload

### Caching Strategy
```
Level 1: Browser/App cache (static assets, 7 days)
Level 2: CDN cache (images, 30 days)
Level 3: Redis cache (API responses, 5-60 min)
Level 4: Database query cache (pg_stat_statements)
```

### Scalability Approach
- Horizontal scaling via load balancer
- Stateless API servers (scale to N instances)
- Database read replicas for analytics queries
- Async job processing for non-critical operations
- Auto-scaling based on CPU/memory thresholds

---

## Testing Strategy

### Backend Testing
```python
# Unit Tests (pytest)
- Test individual functions
- Mock external API calls
- 90%+ code coverage target

# Integration Tests
- Test API endpoints end-to-end
- Use test database
- Test authentication flows

# Load Tests (Locust)
- Simulate 1000 concurrent users
- Test AI photo endpoint under load
- Identify bottlenecks
```

### Frontend Testing
```typescript
// Unit Tests (Jest + React Testing Library)
- Test components in isolation
- Test custom hooks
- Test utility functions

// Integration Tests
- Test user flows (login → dashboard → log food)
- Mock API responses
- Test error handling

// E2E Tests (Playwright)
- Critical user journeys
- Cross-browser testing
- Mobile responsive testing
```

---

## Deployment Architecture

### Development
```
docker-compose.yml:
  - api (FastAPI)
  - postgres
  - redis
  - minio (S3)
  - web (Vite dev server)
```

### Production (AWS Example)
```
- Load Balancer (ALB)
- ECS Fargate (API containers)
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis
- S3 + CloudFront
- Route53 (DNS)
- ACM (SSL certificates)
```

---

## Cost Estimates (Monthly)

### MVP Phase (< 1000 users)
- AWS Infrastructure: $100-200
- OpenAI API: $50-100 (assuming 1000 photos/day)
- FatSecret API: $0 (free tier)
- Stripe fees: Variable (3% + $0.30 per transaction)
- **Total**: ~$200-400/month

### Growth Phase (10,000 users)
- AWS Infrastructure: $500-1000
- OpenAI API: $500-800
- Database: $200-300
- CDN: $50-100
- **Total**: ~$1,500-2,500/month

### Scale Phase (100,000 users)
- Infrastructure: $3,000-5,000
- AI API: $3,000-5,000
- Database: $800-1,200
- **Total**: ~$8,000-12,000/month

**Revenue at 100k users (3% conversion)**: 3,000 * $14.99 = $44,970/month
**Net margin**: ~$32,000/month (70%+)

---

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up monorepo structure
- [ ] Configure Docker development environment
- [ ] Create database schema and migrations
- [ ] Set up FastAPI project with auth
- [ ] Create React web boilerplate
- [ ] Create React Native boilerplate

### Phase 2: Core Features (Weeks 3-6)
- [ ] User registration and authentication
- [ ] Onboarding flow (goal setting)
- [ ] Photo upload and AI analysis
- [ ] Daily calorie dashboard
- [ ] Manual food entry fallback
- [ ] Basic progress tracking

### Phase 3: Advanced Features (Weeks 7-9)
- [ ] Weekly progress charts
- [ ] Weight tracking
- [ ] Subscription/paywall logic
- [ ] Stripe integration
- [ ] Premium features

### Phase 4: Polish & Testing (Weeks 10-12)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Mobile app refinements
- [ ] Documentation
- [ ] Beta deployment

---

## Monitoring & Observability

### Key Metrics to Track
```
User Metrics:
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Average session duration
- Photos logged per user per day

Technical Metrics:
- API response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query performance
- AI API success rate
- Cache hit rate

Business Metrics:
- Sign-ups per day
- Trial conversion rate
- Monthly churn rate
- Revenue per user
```

### Alerting Rules
- API error rate > 1% → PagerDuty
- Response time p95 > 5s → Slack
- Database CPU > 80% → Email
- Disk space < 20% → Email

---

## Next Steps

1. Initialize project structure with monorepo
2. Set up Docker development environment
3. Create database migrations
4. Build authentication system
5. Implement photo upload and AI integration
6. Build React web client
7. Build React Native mobile client
8. Add comprehensive testing
9. Deploy to staging environment
10. Conduct beta testing

This architecture provides a solid foundation for building a scalable, maintainable, and production-ready AI-powered calorie tracking application.
