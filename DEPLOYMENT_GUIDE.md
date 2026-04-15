# Deployment Guide
## AI-Powered Calorie Tracker

**Last Updated**: March 11, 2026
**Target**: Production Deployment

---

## 🎯 Overview

This guide covers deploying the complete stack to production:
- **Backend**: FastAPI Python application
- **Web Frontend**: React application
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: S3-compatible object storage

---

## 📋 Prerequisites

### Required Accounts
- [ ] AWS Account (or alternative cloud provider)
- [ ] OpenAI API Account (for food recognition)
- [ ] Stripe Account (for payments - optional initially)
- [ ] Domain name (recommended)
- [ ] GitHub Account (for CI/CD)

### Required Tools
- [ ] Docker & Docker Compose
- [ ] AWS CLI (if using AWS)
- [ ] Terraform (optional, for infrastructure as code)

---

## 🚀 Option 1: Quick Deploy (Heroku/Render)

### Backend on Render

1. **Create `render.yaml`**:
```yaml
services:
  - type: web
    name: calorie-tracker-api
    env: python
    buildCommand: "cd backend && pip install poetry && poetry install"
    startCommand: "cd backend && poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: calorie-tracker-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: calorie-tracker-redis
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: OPENAI_API_KEY
        sync: false
      - key: AWS_S3_BUCKET
        value: your-bucket-name
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false

databases:
  - name: calorie-tracker-db
    databaseName: calorie_tracker
    plan: starter

services:
  - type: redis
    name: calorie-tracker-redis
    plan: starter
```

2. **Deploy**:
```bash
# Connect GitHub repo to Render
# Or deploy via CLI
render deploy
```

### Frontend on Vercel

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
cd frontend-web
vercel --prod
```

3. **Set Environment Variables in Vercel Dashboard**:
```
VITE_API_URL=https://your-api-domain.onrender.com/api/v1
```

---

## 🏗️ Option 2: AWS Deployment (Production-Ready)

### Architecture
```
                    ┌─────────────────┐
                    │   CloudFront    │ (CDN for web app)
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌────▼────┐        ┌────▼────┐
    │   S3    │         │   ALB   │        │  API GW │
    │  (Web)  │         └────┬────┘        └─────────┘
    └─────────┘              │
                        ┌────▼────┐
                        │   ECS   │ (Backend containers)
                        │ Fargate │
                        └────┬────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌────▼────┐        ┌────▼────┐
    │   RDS   │         │ ElastiCache│     │   S3    │
    │ (Postgres)│       │   (Redis)  │     │ (Photos)│
    └─────────┘         └────────────┘     └─────────┘
```

### Step 1: Infrastructure Setup

**1.1 Create VPC and Subnets**
```bash
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

**1.2 Create RDS PostgreSQL**
```bash
aws rds create-db-instance \
  --db-instance-identifier calorie-tracker-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <your-password> \
  --allocated-storage 20
```

**1.3 Create ElastiCache Redis**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id calorie-tracker-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

**1.4 Create S3 Bucket for Photos**
```bash
aws s3 mb s3://calorie-tracker-photos
aws s3api put-bucket-cors --bucket calorie-tracker-photos --cors-configuration file://cors.json
```

`cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-domain.com"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Step 2: Backend Deployment

**2.1 Build Docker Image**
```bash
cd backend
docker build -t calorie-tracker-api .
docker tag calorie-tracker-api:latest <your-ecr-repo>:latest
docker push <your-ecr-repo>:latest
```

**2.2 Create ECS Task Definition**
```json
{
  "family": "calorie-tracker-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<your-ecr-repo>:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DATABASE_URL", "value": "postgresql+asyncpg://..."},
        {"name": "REDIS_URL", "value": "redis://..."},
        {"name": "SECRET_KEY", "value": "..."},
        {"name": "OPENAI_API_KEY", "value": "..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/calorie-tracker",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

**2.3 Create ECS Service**
```bash
aws ecs create-service \
  --cluster default \
  --service-name calorie-tracker-api \
  --task-definition calorie-tracker-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Step 3: Frontend Deployment

**3.1 Build React App**
```bash
cd frontend-web
npm install
npm run build
# Output in dist/
```

**3.2 Upload to S3**
```bash
aws s3 sync dist/ s3://your-web-bucket --delete
aws s3 website s3://your-web-bucket --index-document index.html --error-document index.html
```

**3.3 Create CloudFront Distribution**
```bash
aws cloudfront create-distribution \
  --origin-domain-name your-web-bucket.s3.amazonaws.com \
  --default-root-object index.html
```

### Step 4: Domain & SSL

**4.1 Get SSL Certificate (ACM)**
```bash
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names www.your-domain.com \
  --validation-method DNS
```

**4.2 Update DNS**
```
Type: CNAME
Name: www
Value: d111111abcdef8.cloudfront.net
```

---

## 🐳 Option 3: Docker Compose (Simple VPS)

### DigitalOcean/Linode/Hetzner Deployment

**1. Provision Server**
- 2 CPU, 4GB RAM minimum
- Ubuntu 22.04 LTS
- 50GB SSD

**2. Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo apt-get install docker-compose
```

**3. Create Production `docker-compose.prod.yml`**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: calorie_tracker
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    networks:
      - backend

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - backend

  api:
    build: ./backend
    restart: always
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@postgres:5432/calorie_tracker
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      AWS_S3_BUCKET: ${S3_BUCKET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - backend

  web:
    build: ./frontend-web
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - api
    networks:
      - backend

volumes:
  postgres_data:
  redis_data:

networks:
  backend:
```

**4. Set Up Environment**
```bash
# Create .env file
cat > .env << EOF
DB_USER=admin
DB_PASSWORD=$(openssl rand -hex 32)
SECRET_KEY=$(openssl rand -hex 32)
OPENAI_API_KEY=sk-your-key
S3_BUCKET=your-bucket
AWS_ACCESS_KEY=your-key
AWS_SECRET_ACCESS_KEY=your-secret
EOF
```

**5. Deploy**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**6. Set Up SSL (Let's Encrypt)**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🔒 Security Checklist

### Before Going Live

- [ ] Change all default passwords
- [ ] Generate secure `SECRET_KEY` (32+ characters)
- [ ] Enable HTTPS/SSL (mandatory)
- [ ] Configure CORS correctly (no wildcards)
- [ ] Set up firewall (allow only 80, 443, 22)
- [ ] Enable database encryption at rest
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Hide API version info
- [ ] Set up monitoring/alerting
- [ ] Enable database connection pooling
- [ ] Configure security headers:
  ```nginx
  add_header X-Frame-Options "SAMEORIGIN";
  add_header X-Content-Type-Options "nosniff";
  add_header X-XSS-Protection "1; mode=block";
  add_header Strict-Transport-Security "max-age=31536000";
  ```

---

## 📊 Monitoring Setup

### Application Monitoring (Sentry)

**Backend**:
```python
# app/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
    traces_sample_rate=0.1,
)
```

**Frontend**:
```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### Infrastructure Monitoring (DataDog/New Relic)

```bash
# Install DataDog agent
DD_API_KEY=<your-key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

### Health Check Endpoint

Backend already has `/health`:
```bash
curl https://api.your-domain.com/health
```

### Set Up Uptime Monitoring
- Use: UptimeRobot, Pingdom, or StatusCake
- Monitor: `/health` endpoint
- Alert: Email/SMS on downtime

---

## 🔄 CI/CD Setup

### GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: calorie-tracker-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Update ECS service
        run: |
          aws ecs update-service --cluster default --service calorie-tracker-api --force-new-deployment

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install and build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
        run: |
          cd frontend-web
          npm install
          npm run build

      - name: Deploy to S3
        run: |
          aws s3 sync frontend-web/dist/ s3://your-web-bucket --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

---

## 💾 Database Migrations

### Production Migration Process

```bash
# 1. Backup database
pg_dump -h your-db-host -U admin calorie_tracker > backup-$(date +%Y%m%d).sql

# 2. Run migrations
cd backend
poetry run alembic upgrade head

# 3. Verify
poetry run alembic current

# 4. If issues, rollback
poetry run alembic downgrade -1
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * pg_dump -h localhost -U admin calorie_tracker | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

---

## 📈 Scaling Strategies

### Vertical Scaling (Easy)
1. Increase server resources (CPU, RAM)
2. Upgrade database instance type
3. Add more Redis memory

### Horizontal Scaling (Better)
1. **Backend**:
   - Add more ECS tasks/containers
   - Set up load balancer
   - Use auto-scaling groups

2. **Database**:
   - Set up read replicas
   - Implement connection pooling (PgBouncer)
   - Cache frequent queries in Redis

3. **Storage**:
   - Use CDN for images (CloudFront)
   - Implement image optimization
   - Use lazy loading

### Cost Optimization
- Use spot instances for non-critical workloads
- Implement CloudWatch alarms for resource usage
- Use S3 lifecycle policies (move old photos to Glacier)
- Enable database auto-pause (Aurora Serverless)

---

## 🧪 Pre-Launch Testing

### Performance Testing
```bash
# Install k6
brew install k6

# Load test
k6 run loadtest.js
```

`loadtest.js`:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  let res = http.get('https://api.your-domain.com/health');
  check(res, { 'status was 200': (r) => r.status == 200 });
}
```

### Security Audit
```bash
# Run OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://your-domain.com
```

---

## 📱 Mobile App Deployment

### iOS (App Store)

1. **Build**:
```bash
cd frontend-mobile
expo build:ios
```

2. **Submit**:
- Use Expo or Xcode
- Follow Apple guidelines
- Provide privacy policy
- Screenshots and description

### Android (Google Play)

1. **Build**:
```bash
expo build:android
```

2. **Submit**:
- Upload to Google Play Console
- Fill store listing
- Set pricing (free with IAP)

---

## 🎯 Post-Launch Checklist

### Day 1
- [ ] Monitor error rates
- [ ] Check server resources
- [ ] Verify API endpoints
- [ ] Test payment flow
- [ ] Monitor user registrations

### Week 1
- [ ] Analyze user behavior
- [ ] Check for bugs reported
- [ ] Review performance metrics
- [ ] Optimize slow queries
- [ ] Update documentation

### Month 1
- [ ] Review costs
- [ ] Plan new features
- [ ] Collect user feedback
- [ ] Improve onboarding
- [ ] Marketing campaign

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**:
```bash
# Check database status
psql -h your-db-host -U admin -d calorie_tracker

# Check connections
SELECT count(*) FROM pg_stat_activity;
```

**High API Latency**:
```bash
# Check logs
docker logs calorie-tracker-api

# Monitor database queries
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

**Out of Memory**:
```bash
# Check memory usage
free -h
docker stats

# Increase resources or add swap
```

---

## 📞 Support

For deployment issues:
- Check logs: `docker logs <container>`
- Database logs: `tail -f /var/log/postgresql/`
- Nginx logs: `tail -f /var/log/nginx/error.log`

---

## 🎉 You're Ready to Launch!

Follow this guide step-by-step, and you'll have a production-ready calorie tracking SaaS running in no time!

**Estimated deployment time**: 4-8 hours (depending on experience)

Good luck! 🚀
