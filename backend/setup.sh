#!/bin/bash

# Calorie Tracker Backend Setup Script
# This script creates a virtual environment and installs all dependencies

set -e  # Exit on any error

echo "=================================="
echo "Calorie Tracker Backend Setup"
echo "=================================="
echo ""

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
REQUIRED_VERSION="3.11"

if ! python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)" 2>/dev/null; then
    echo "❌ Error: Python 3.11 or higher is required"
    echo "   Current version: $PYTHON_VERSION"
    echo "   Please install Python 3.11+ first"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION found"
echo ""

# Create virtual environment if it doesn't exist
if [ -d "venv" ]; then
    echo "ℹ️  Virtual environment already exists"
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel
echo "✅ pip upgraded"
echo ""

# Install dependencies
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt
echo "✅ All dependencies installed"
echo ""

echo "=================================="
echo "Setup Complete! 🎉"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Run database migrations:"
echo "   alembic upgrade head"
echo ""
echo "3. Start the backend server:"
echo "   uvicorn app.main:app --reload"
echo ""
echo "Backend will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""
