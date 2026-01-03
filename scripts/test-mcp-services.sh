#!/bin/bash

# MCP Services Test Script
# Tests all active MCP endpoints

echo "🧪 Testing Milla-Rayne MCP Services..."
echo "========================================"
echo ""

BASE_URL="http://localhost:5000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -n "Testing $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
    FAILED=$((FAILED + 1))
  fi
}

echo "1. Testing Filesystem MCP"
echo "-------------------------"
test_endpoint "List Directory" "POST" "/api/mcp/filesystem/list" '{"path": "."}'
test_endpoint "Read File" "POST" "/api/mcp/filesystem/read" '{"path": "package.json"}'
echo ""

echo "2. Testing GitHub MCP"
echo "---------------------"
test_endpoint "Search Repos" "POST" "/api/mcp/github/search-repos" '{"query": "react", "limit": 3}'
test_endpoint "Get File" "POST" "/api/mcp/github/get-file" '{"owner": "facebook", "repo": "react", "path": "README.md"}'
echo ""

echo "3. Testing Memory MCP"
echo "---------------------"
test_endpoint "Store Memory" "POST" "/api/mcp/memory/store" '{"userId": 1, "content": "Test memory", "importance": 5}'
test_endpoint "Search Memory" "POST" "/api/mcp/memory/search" '{"userId": 1, "query": "test", "limit": 5}'
echo ""

echo "4. Testing Puppeteer MCP"
echo "------------------------"
test_endpoint "Screenshot" "POST" "/api/mcp/puppeteer/screenshot" '{"url": "https://example.com"}'
echo ""

echo "5. Testing Hugging Face MCP"
echo "----------------------------"
test_endpoint "List Models" "GET" "/api/mcp/models/text-generation" ""
echo ""

echo "========================================"
echo "📊 Test Results"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Check server logs for details.${NC}"
  exit 1
fi
