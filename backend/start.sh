#!/bin/bash

# Calorie Tracker Backend Start Script
# Run this after setup.sh to start the backend server

set -e  # Exit on any error

echo "=================================="
echo "Starting Calorie Tracker Backend"
echo "=================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "   Please run ./setup.sh first"
    exit 1
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Using default configuration"
fi
echo ""

# Add current directory to PYTHONPATH so alembic can find 'app' module
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Run migrations
echo "Running database migrations..."
alembic upgrade head
echo "✅ Database up to date"
echo ""

# Start server
echo "=================================="
echo "Starting Uvicorn server..."
echo "=================================="
echo ""
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press CTRL+C to stop the server"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
