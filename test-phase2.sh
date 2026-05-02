#!/bin/bash
# Test Phase 2 - Agent Orchestration
# Tests the full flow: create → wait → approve → agents spawn → watch logs

set -e

echo "========================================"
echo "Phase 2 Test - Agent Orchestration"
echo "========================================"
echo ""

# Generate unique ticket ID
TICKET_ID=$((7000 + RANDOM % 1000))

echo "Test Ticket: #$TICKET_ID"
echo ""

# Step 1: Create investigation
echo "Step 1: Creating investigation..."
echo "----------------------------------------"
./bin/triage create \
  --ticket $TICKET_ID \
  --skill troubleshoot \
  --customer "Phase2 Test" \
  --context "Testing agent orchestration with background processes"

echo ""
echo "Press Enter to continue to Step 2..."
read

# Step 2: Check status
echo ""
echo "Step 2: Checking status..."
echo "----------------------------------------"
./bin/triage status $TICKET_ID

echo ""
echo "Press Enter to approve checkpoint and spawn agents..."
read

# Step 3: Approve checkpoint (this spawns agents)
echo ""
echo "Step 3: Approving checkpoint (spawning agents)..."
echo "----------------------------------------"
./bin/triage approve $TICKET_ID checkpoint_1_post_classification

echo ""
echo "Agents spawned! They are running in the background."
echo ""
echo "========================================"
echo "Next Steps:"
echo "========================================"
echo ""
echo "1. Watch main log:"
echo "   ./bin/triage logs $TICKET_ID -f"
echo ""
echo "2. Watch Slack agent:"
echo "   ./bin/triage logs $TICKET_ID --agent slack -f"
echo ""
echo "3. Check status:"
echo "   ./bin/triage status $TICKET_ID"
echo ""
echo "4. Watch all agent logs in separate terminals:"
echo "   Terminal 1: tail -f ~/support-triage/logs/$TICKET_ID-agent-slack.jsonl"
echo "   Terminal 2: tail -f ~/support-triage/logs/$TICKET_ID-agent-linear.jsonl"
echo "   Terminal 3: tail -f ~/support-triage/logs/$TICKET_ID-agent-pylon.jsonl"
echo "   Terminal 4: tail -f ~/support-triage/logs/$TICKET_ID-agent-codebase.jsonl"
echo ""
echo "5. Check agent PIDs:"
echo "   ps aux | grep claude"
echo ""
echo "Test ticket ID: $TICKET_ID"
