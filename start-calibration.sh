#!/bin/bash
# Quick calibration starter script

echo "╔═══════════════════════════════════════════════════╗"
echo "║   Support Triage System - Phase 4 Calibration    ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "This script will help you start your first investigation."
echo ""

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check if ~/C1/ exists
if [ -d "$HOME/C1" ]; then
    echo "✓ ~/C1/ repository directory exists"
else
    echo "✗ ~/C1/ repository directory not found"
    echo "  Please ensure ConductorOne repos are cloned to ~/C1/"
    exit 1
fi

# Check database
if [ -f ~/support-triage/triage.db ]; then
    echo "✓ Database initialized"
else
    echo "✗ Database not found"
    exit 1
fi

# Check MCP servers
echo ""
echo "MCP Servers (check manually):"
echo "  - Pylon MCP: For ticket fetching"
echo "  - Linear MCP: For issue history"
echo "  - Slack MCP: For context research"
echo ""
read -p "Are all MCP servers configured and working? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please configure MCP servers first"
    exit 1
fi

echo ""
echo "✓ Prerequisites check passed"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""

# Get ticket ID
read -p "Enter Pylon ticket ID to investigate: " TICKET_ID

if [ -z "$TICKET_ID" ]; then
    echo "No ticket ID provided"
    exit 1
fi

echo ""
echo "Starting investigation for ticket #$TICKET_ID..."
echo ""

# Run launcher
./triage-launcher.sh "$TICKET_ID"

echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Open the prompt file shown above"
echo "2. Copy its contents"
echo "3. Open Claude Code in the investigation directory"
echo "4. Paste the prompt to start investigation"
echo ""
echo "Good luck! 🚀"
echo ""
