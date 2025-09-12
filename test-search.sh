#!/bin/bash

echo "🔍 Testing Claude Viewer FTS5 Search System"
echo "=========================================="

SERVER_URL="http://localhost:3001/api"

echo ""
echo "1️⃣  Checking server health and search index status..."
curl -s "$SERVER_URL/health" | jq '.'

echo ""
echo "2️⃣  Getting current search index status..."
curl -s "$SERVER_URL/search/index/status" | jq '.'

echo ""
echo "3️⃣  Building search index (this may take a moment)..."
curl -s -X POST "$SERVER_URL/search/index/build" | jq '.'

echo ""
echo "4️⃣  Checking updated index status..."
curl -s "$SERVER_URL/search/index/status" | jq '.'

echo ""
echo "5️⃣  Testing search for 'themes' keyword..."
curl -s -X POST "$SERVER_URL/search" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "themes",
    "limit": 3
  }' | jq '.'

echo ""
echo "6️⃣  Testing search in specific project (simple-migration)..."
curl -s -X POST "$SERVER_URL/search" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "themes",
    "projectId": "-mnt-c-laragon-www-simple-migration",
    "limit": 3
  }' | jq '.'

echo ""
echo "7️⃣  Testing search with role filter (user messages only)..."
curl -s -X POST "$SERVER_URL/search" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "themes",
    "role": "user",
    "limit": 3
  }' | jq '.'

echo ""
echo "✅ Search testing completed!"
echo ""
echo "Next steps:"
echo "- Open http://localhost:3000 in your browser"
echo "- Navigate to Search page"
echo "- Try searching for 'themes', 'OpenCart', 'migration', etc."
echo "- Click on search results to navigate to full conversation"