#!/bin/bash
# Launch Support Triage TUI in web browser via ttyd

echo "┌─────────────────────────────────────────────────┐"
echo "│  Support Triage TUI - Web Terminal             │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "🌐 Starting web terminal on port 7681..."
echo ""
echo "📱 Open in your browser:"
echo "   http://localhost:7681"
echo ""
echo "💡 Tips:"
echo "   • Use keyboard shortcuts (1-5 for tabs, etc.)"
echo "   • Press Ctrl+C here to stop the server"
echo "   • Take screenshots easily from the browser"
echo ""
echo "Press Ctrl+C to stop..."
echo ""

cd /Users/jacobaguon/support-triage/tui

# Build with version injection
echo "Building triage-tui..."
go build -ldflags "-X main.buildVersion=$(git rev-parse --short HEAD 2>/dev/null || echo 'dev') -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o triage-tui .
echo "Build complete."
echo ""

ttyd -W -p 7681 ./triage-tui
