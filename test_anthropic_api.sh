#!/bin/bash

# Test script for Employee MCP Server via Anthropic API

# 設定
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-your-anthropic-api-key-here}"
AUTH_TOKEN="your-secret-token"
MCP_URL="http://localhost:3000/sse"

echo "=== Employee MCP Server Test via Anthropic API ==="
echo

# Check if API key is set
if [ "$ANTHROPIC_API_KEY" = "your-anthropic-api-key-here" ]; then
    echo "⚠️  Warning: Please set your ANTHROPIC_API_KEY environment variable"
    echo "   export ANTHROPIC_API_KEY=your-actual-api-key"
    echo
fi

# Check if MCP server is running
echo "🔍 Checking if MCP server is running..."
if curl -s -f -H "authorization-token: $AUTH_TOKEN" "http://localhost:3000/api/employees" > /dev/null; then
    echo "✅ MCP server is running"
else
    echo "❌ MCP server is not running. Please start it with: npm run dev"
    exit 1
fi
echo

# Test 1: Get all employees via MCP
echo "1. Testing get_all_employees via Anthropic API"
echo "================================================"
curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d "{
    \"model\": \"claude-3-5-sonnet-20241022\",
    \"max_tokens\": 1000,
    \"messages\": [{\"role\": \"user\", \"content\": \"全従業員のリストを取得してください\"}],
    \"mcp_servers\": [
      {
        \"type\": \"url\",
        \"url\": \"$MCP_URL\",
        \"name\": \"employee-mcp\",
        \"authorization_token\": \"$AUTH_TOKEN\"
      }
    ]
  }" | python3 -m json.tool
echo
echo

# Test 2: Get employee by ID via MCP
echo "2. Testing get_employee_by_id via Anthropic API"
echo "================================================"
curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d "{
    \"model\": \"claude-3-5-sonnet-20241022\",
    \"max_tokens\": 1000,
    \"messages\": [{\"role\": \"user\", \"content\": \"ID 1の従業員情報を教えてください\"}],
    \"mcp_servers\": [
      {
        \"type\": \"url\",
        \"url\": \"$MCP_URL\",
        \"name\": \"employee-mcp\",
        \"authorization_token\": \"$AUTH_TOKEN\"
      }
    ]
  }" | python3 -m json.tool
echo
echo

# Test 3: Get employees by department via MCP
echo "3. Testing get_employees_by_department via Anthropic API"
echo "========================================================"
curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d "{
    \"model\": \"claude-3-5-sonnet-20241022\",
    \"max_tokens\": 1000,
    \"messages\": [{\"role\": \"user\", \"content\": \"開発部の従業員一覧を表示してください\"}],
    \"mcp_servers\": [
      {
        \"type\": \"url\",
        \"url\": \"$MCP_URL\",
        \"name\": \"employee-mcp\",
        \"authorization_token\": \"$AUTH_TOKEN\"
      }
    ]
  }" | python3 -m json.tool
echo
echo

# Test 4: Test MCP tools listing
echo "4. Testing MCP tools listing via Anthropic API"
echo "==============================================="
curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d "{
    \"model\": \"claude-3-5-sonnet-20241022\",
    \"max_tokens\": 1000,
    \"messages\": [{\"role\": \"user\", \"content\": \"利用可能なツールを教えてください\"}],
    \"mcp_servers\": [
      {
        \"type\": \"url\",
        \"url\": \"$MCP_URL\",
        \"name\": \"employee-mcp\",
        \"authorization_token\": \"$AUTH_TOKEN\"
      }
    ]
  }" | python3 -m json.tool
echo

echo "=== Anthropic API MCP Test Complete ==="
