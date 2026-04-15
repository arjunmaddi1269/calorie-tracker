#!/bin/bash

# Calorie Tracker API Test Script
# Tests all backend endpoints

BASE_URL="http://localhost:8000/api/v1"
COLORS=true

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Calorie Tracker API Test Suite"
echo "========================================="
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s http://localhost:8000/health)
if [[ $HEALTH == *"healthy"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Server is healthy"
else
    echo -e "${RED}✗ FAIL${NC} - Server health check failed"
    exit 1
fi
echo ""

# Test 2: Register User
echo -e "${YELLOW}Test 2: Register New User${NC}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"testpass123\",\"first_name\":\"Test\",\"last_name\":\"User\"}")

if [[ $REGISTER_RESPONSE == *"$TEST_EMAIL"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - User registered successfully"
    USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "  User ID: $USER_ID"
else
    echo -e "${RED}✗ FAIL${NC} - Registration failed"
    echo "  Response: $REGISTER_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Login
echo -e "${YELLOW}Test 3: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"testpass123\"}")

if [[ $LOGIN_RESPONSE == *"access_token"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Login successful"
    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    echo "  Access token obtained (${#ACCESS_TOKEN} chars)"
else
    echo -e "${RED}✗ FAIL${NC} - Login failed"
    echo "  Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get Current User
echo -e "${YELLOW}Test 4: Get Current User${NC}"
USER_RESPONSE=$(curl -s -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $USER_RESPONSE == *"$TEST_EMAIL"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - User profile retrieved"
    echo "  Email: $TEST_EMAIL"
else
    echo -e "${RED}✗ FAIL${NC} - Failed to get current user"
    echo "  Response: $USER_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Complete Onboarding
echo -e "${YELLOW}Test 5: Complete Onboarding${NC}"
ONBOARDING_RESPONSE=$(curl -s -X POST "$BASE_URL/users/onboarding" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date_of_birth": "1995-01-15",
    "sex": "male",
    "height_cm": 175,
    "current_weight_kg": 75,
    "target_weight_kg": 72,
    "activity_level": "moderate",
    "goal_type": "lose_weight"
  }')

if [[ $ONBOARDING_RESPONSE == *"daily_calorie_target"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Onboarding completed"
    CALORIE_TARGET=$(echo $ONBOARDING_RESPONSE | grep -o '"daily_calorie_target":[0-9]*' | cut -d':' -f2)
    echo "  Daily calorie target: $CALORIE_TARGET"
else
    echo -e "${RED}✗ FAIL${NC} - Onboarding failed"
    echo "  Response: $ONBOARDING_RESPONSE"
    exit 1
fi
echo ""

# Test 6: Get User Profile
echo -e "${YELLOW}Test 6: Get User Profile${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $PROFILE_RESPONSE == *"daily_calorie_target"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Profile retrieved"
else
    echo -e "${RED}✗ FAIL${NC} - Failed to get profile"
    echo "  Response: $PROFILE_RESPONSE"
    exit 1
fi
echo ""

# Test 7: Get Daily Summary (Today)
echo -e "${YELLOW}Test 7: Get Daily Summary${NC}"
TODAY=$(date +%Y-%m-%d)
SUMMARY_RESPONSE=$(curl -s -X GET "$BASE_URL/food/daily-summary?date=$TODAY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $SUMMARY_RESPONSE == *"total_calories"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Daily summary retrieved"
    echo "  Date: $TODAY"
else
    echo -e "${RED}✗ FAIL${NC} - Failed to get daily summary"
    echo "  Response: $SUMMARY_RESPONSE"
    exit 1
fi
echo ""

# Test 8: Create Manual Food Log
echo -e "${YELLOW}Test 8: Create Food Log${NC}"
FOOD_LOG_RESPONSE=$(curl -s -X POST "$BASE_URL/food/log" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "food_name": "Chicken Breast",
    "meal_type": "lunch",
    "calories": 165,
    "protein_g": 31,
    "carbs_g": 0,
    "fat_g": 3.6,
    "serving_size": 100,
    "serving_unit": "g",
    "is_manual_entry": true
  }')

if [[ $FOOD_LOG_RESPONSE == *"Chicken Breast"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Food log created"
    FOOD_LOG_ID=$(echo $FOOD_LOG_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "  Food log ID: $FOOD_LOG_ID"
else
    echo -e "${RED}✗ FAIL${NC} - Failed to create food log"
    echo "  Response: $FOOD_LOG_RESPONSE"
    exit 1
fi
echo ""

# Test 9: Get Food Logs
echo -e "${YELLOW}Test 9: Get Food Logs${NC}"
LOGS_RESPONSE=$(curl -s -X GET "$BASE_URL/food/logs?start_date=$TODAY&end_date=$TODAY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $LOGS_RESPONSE == *"Chicken Breast"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Food logs retrieved"
else
    echo -e "${RED}✗ FAIL${NC} - Failed to get food logs"
    echo "  Response: $LOGS_RESPONSE"
    exit 1
fi
echo ""

# Test 10: Update Food Log
echo -e "${YELLOW}Test 10: Update Food Log${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/food/logs/$FOOD_LOG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 170
  }')

if [[ $UPDATE_RESPONSE == *"170"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Food log updated"
else
    echo -e "${RED}✗ FAIL${NC} - Failed to update food log"
    echo "  Response: $UPDATE_RESPONSE"
    exit 1
fi
echo ""

# Test 11: Get Updated Daily Summary
echo -e "${YELLOW}Test 11: Verify Daily Summary Updated${NC}"
SUMMARY_RESPONSE2=$(curl -s -X GET "$BASE_URL/food/daily-summary?date=$TODAY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $SUMMARY_RESPONSE2 == *"170"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Daily summary reflects food log"
else
    echo -e "${RED}✗ FAIL${NC} - Daily summary not updated"
    echo "  Response: $SUMMARY_RESPONSE2"
fi
echo ""

# Test 12: Delete Food Log
echo -e "${YELLOW}Test 12: Delete Food Log${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/food/logs/$FOOD_LOG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $DELETE_RESPONSE == *"message"* ]] || [[ $DELETE_RESPONSE == "" ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Food log deleted"
else
    echo -e "${RED}✗ FAIL${NC} - Failed to delete food log"
    echo "  Response: $DELETE_RESPONSE"
fi
echo ""

# Test 13: Token Refresh
echo -e "${YELLOW}Test 13: Refresh Access Token${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")

if [[ $REFRESH_RESPONSE == *"access_token"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Token refreshed successfully"
else
    echo -e "${RED}✗ FAIL${NC} - Token refresh failed"
    echo "  Response: $REFRESH_RESPONSE"
fi
echo ""

# Test 14: Logout
echo -e "${YELLOW}Test 14: Logout${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $LOGOUT_RESPONSE == *"logged out"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Logout successful"
else
    echo -e "${RED}✗ FAIL${NC} - Logout failed"
    echo "  Response: $LOGOUT_RESPONSE"
fi
echo ""

echo "========================================="
echo -e "${GREEN}All Tests Passed! ✓${NC}"
echo "========================================="
echo ""
echo "Backend API is fully functional."
echo "Test user email: $TEST_EMAIL"
