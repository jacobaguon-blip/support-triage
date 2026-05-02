#!/bin/bash
# Run TUI in browser using ttyd (install first: brew install ttyd)

echo "Starting TUI in web browser..."
echo "Once running, open: http://localhost:7681"
echo ""
echo "To take a screenshot for Claude:"
echo "1. Open http://localhost:7681 in Chrome"
echo "2. Take a screenshot (Cmd+Shift+4 on macOS)"
echo "3. Share the screenshot"
echo ""

# Run ttyd on port 7681
ttyd -p 7681 /Users/jacobaguon/support-triage/tui/triage-tui
