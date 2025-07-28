#!/bin/bash

# Test script for Employee MCP Server via Anthropic API (Cloud Version)

# 設定 - デプロイ後のURLに変更してください
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-your-anthropic-api-key-here}"
AUTH_TOKEN="your-secret-token"

# デプロイ先のURLを設定（以下のいずれかを使用）
# MCP_URL="https://your-app-name.onrender.com/sse"        # Render
# MCP_URL="https://your-app-name.vercel.app/sse"          # Vercel  
# MCP_URL="https://your-app-name.up.railway.app/sse"     # Railway

# デフォルト値（変更してください）
MCP_URL="${MCP_URL:-https://your-deployed-app-url.com/sse}"

echo "=== Employee MCP Server Test via Anthropic API (Cloud) ==="
echo "Testing URL: $MCP_URL"
echo

# Check if API key is set
if [ "$ANTHROPIC_API_KEY" = "your-anthropic-api-key-here" ]; then
    echo "⚠️  Warning: Please set your ANTHROPIC_API_KEY environment variable"
    echo "   export ANTHROPIC_API_KEY=your-actual-api-key"
    echo
fi

# Check if MCP URL is set
if [ "$MCP_URL" = "https://your-deployed-app-url.com/sse" ]; then
    echo "⚠️  Warning: Please set your deployed MCP server URL"
    echo "   export MCP_URL=https://your-actual-deployed-url.com/sse"
    echo "   Or edit this script directly"
    echo
fi

# Extract base URL for health check
BASE_URL=$(echo "$MCP_URL" | sed 's|/sse$||')

# Check if MCP server is running
echo "🔍 Checking if MCP server is running..."
if curl -s -f -H "authorization-token: $AUTH_TOKEN" "$BASE_URL/api/employees" > /dev/null; then
    echo "✅ MCP server is running at $BASE_URL"
else
    echo "❌ MCP server is not accessible at $BASE_URL"
    echo "   Please check the URL and ensure the server is deployed"
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

echo "=== Anthropic API MCP Test Complete ==="
