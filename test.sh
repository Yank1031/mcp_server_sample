#!/bin/bash

# Employee MCP Server Test Scripts

BASE_URL="http://localhost:3000"

echo "=== Employee MCP Server Test ==="
echo

# ヘルスチェック
echo "1. Health Check:"
curl -s "${BASE_URL}/health" | jq .
echo
echo

# ツール一覧の取得
echo "2. List Tools:"
curl -s -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }' | jq .
echo
echo

# 全従業員の取得
echo "3. List All Employees:"
curl -s -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_employees",
      "arguments": {}
    }
  }' | jq .
echo
echo

# 従業員検索
echo "4. Search Employees:"
curl -s -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "search_employees",
      "arguments": {
        "query": "田中"
      }
    }
  }' | jq .
echo
echo

# 部署別従業員取得
echo "5. Get Employees by Department:"
curl -s -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "get_employees_by_department",
      "arguments": {
        "department": "開発"
      }
    }
  }' | jq .
echo
echo

# 新しい従業員の作成
echo "6. Create New Employee:"
curl -s -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "create_employee",
      "arguments": {
        "name": "山田太郎",
        "email": "yamada@example.com",
        "department": "開発部",
        "position": "エンジニア",
        "salary": 7000000
      }
    }
  }' | jq .
echo
echo

# 特定従業員の取得
echo "7. Get Employee by ID:"
curl -s -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "get_employee",
      "arguments": {
        "id": "1"
      }
    }
  }' | jq .
echo
echo

echo "=== Tests Completed ==="
