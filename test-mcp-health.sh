#!/bin/bash
cd /Users/jacobaguon/support-triage/ui

echo "Starting server..."
node server.js > /tmp/server-mcp-test.log 2>&1 &
SERVER_PID=$!
sleep 3

echo ""
echo "Testing /api/health/mcp endpoint..."
echo "This will take ~15-30 seconds as it checks all MCP servers..."
echo ""

curl -s http://localhost:3001/api/health/mcp | python3 -m json.tool || echo "Request failed"

echo ""
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "Done!"
