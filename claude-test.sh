# Claude API Integration Test

curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "利用可能なツールを教えてください"}],
    "mcp_servers": [
      {
        "type": "url",
        "url": "https://employee-mcp-server.onrender.com/sse",
        "name": "employee-server"
      }
    ]
  }'
