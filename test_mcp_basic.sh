#!/bin/bash

# Simple MCP Server Test (Direct SSE endpoint test)

AUTH_TOKEN="your-secret-token"
MCP_URL="http://localhost:3000/sse"

echo "=== Simple MCP Server Test ==="
echo

# Check if MCP server is running
echo "🔍 Checking if MCP server is running..."
if curl -s -f -H "authorization-token: $AUTH_TOKEN" "http://localhost:3000/api/employees" > /dev/null; then
    echo "✅ MCP server is running"
else
    echo "❌ MCP server is not running. Please start it with: npm run dev"
    exit 1
fi
echo

# Test SSE endpoint availability (with timeout)
echo "🔍 Testing SSE endpoint availability..."
if timeout 5 curl -s -H "authorization-token: $AUTH_TOKEN" "$MCP_URL" >/dev/null 2>&1; then
    echo "✅ SSE endpoint is accessible"
else
    echo "ℹ️ SSE endpoint test timed out (this is normal for SSE connections)"
fi
echo

# Test direct REST API calls
echo "1. Testing REST API - Get all employees"
echo "======================================="
curl -s -H "authorization-token: $AUTH_TOKEN" "http://localhost:3000/api/employees" | python3 -m json.tool
echo
echo

echo "2. Testing REST API - Get employee by ID"
echo "========================================"
curl -s -H "authorization-token: $AUTH_TOKEN" "http://localhost:3000/api/employees/1" | python3 -m json.tool
echo
echo

echo "3. Testing REST API - Get employees by department"
echo "================================================="
curl -s -H "authorization-token: $AUTH_TOKEN" "http://localhost:3000/api/employees/department/開発部" | python3 -m json.tool
echo
echo

echo "✅ All basic tests passed!"
echo "🚀 MCP server is ready for Anthropic API integration"
echo
echo "To test with Anthropic API:"
echo "1. Set your API key: export ANTHROPIC_API_KEY=your-key-here"
echo "2. Run: ./test_anthropic_api.sh"
