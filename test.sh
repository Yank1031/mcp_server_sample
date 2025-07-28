#!/bin/bash

# Test script for Employee MCP Server

BASE_URL="http://localhost:3000"
TOKEN="your-secret-token"

echo "=== Employee MCP Server Test ==="
echo

# Test 1: Get all employees
echo "1. Testing GET /api/employees"
curl -s -H "authorization-token: $TOKEN" "$BASE_URL/api/employees" | python3 -m json.tool
echo
echo

# Test 2: Get employee by ID
echo "2. Testing GET /api/employees/1"
curl -s -H "authorization-token: $TOKEN" "$BASE_URL/api/employees/1" | python3 -m json.tool
echo
echo

# Test 3: Get employees by department
echo "3. Testing GET /api/employees/department/開発部"
curl -s -H "authorization-token: $TOKEN" "$BASE_URL/api/employees/department/開発部" | python3 -m json.tool
echo
echo

# Test 4: Test without token (should fail if token is required)
echo "4. Testing without authorization token"
curl -s "$BASE_URL/api/employees" | python3 -m json.tool
echo

echo "=== Test Complete ==="
