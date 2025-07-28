#!/bin/bash

# Test script for Employee MCP Server on Render via Anthropic API

# 設定 - デプロイ後のRender URLに変更してください
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-your-anthropic-api-key-here}"
AUTH_TOKEN="${AUTH_TOKEN:-your-secret-token}"

# Render URL（デプロイ後に変更してください）
RENDER_APP_NAME="${RENDER_APP_NAME:-employee-mcp-server-xxxx}"
BASE_URL="https://${RENDER_APP_NAME}.onrender.com"
MCP_URL="${BASE_URL}/sse"

echo "=== Employee MCP Server Test on Render via Anthropic API ==="
echo "Testing URL: $MCP_URL"
echo "Base URL: $BASE_URL"
echo

# Check if API key is set
if [ "$ANTHROPIC_API_KEY" = "your-anthropic-api-key-here" ]; then
    echo "⚠️  Warning: Please set your ANTHROPIC_API_KEY environment variable"
    echo "   export ANTHROPIC_API_KEY=your-actual-api-key"
    echo
fi

# Check if Render app name is set
if [ "$RENDER_APP_NAME" = "employee-mcp-server-xxxx" ]; then
    echo "⚠️  Warning: Please set your Render app name"
    echo "   export RENDER_APP_NAME=your-actual-app-name"
    echo "   (e.g., employee-mcp-server-abc123)"
    echo
fi

# Wake up the server (Render free tier sleeps after 15 minutes)
echo "🔄 Waking up the Render service (this may take 30-60 seconds)..."
curl -s "$BASE_URL/health" > /dev/null || echo "   Service is starting up..."

# Health check with retries
echo "🔍 Checking server health..."
for i in {1..5}; do
    if curl -s -f "$BASE_URL/health" > /dev/null; then
        echo "✅ Server is healthy"
        break
    else
        echo "   Attempt $i/5: Server not ready, waiting 10 seconds..."
        sleep 10
    fi
    
    if [ $i -eq 5 ]; then
        echo "❌ Server failed to respond after 5 attempts"
        echo "   Please check the Render deployment logs"
        exit 1
    fi
done

# Test API endpoint
echo "🔍 Testing REST API endpoint..."
if curl -s -f -H "authorization-token: $AUTH_TOKEN" "$BASE_URL/api/employees" > /dev/null; then
    echo "✅ REST API is working"
else
    echo "❌ REST API is not accessible"
    echo "   Please check the authorization token and deployment"
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

echo "=== Render MCP Test Complete ==="
echo
echo "💡 Tips:"
echo "   - Render free tier sleeps after 15 minutes of inactivity"
echo "   - First request after sleep takes 30-60 seconds to wake up"
echo "   - For production use, consider upgrading to paid plan"
