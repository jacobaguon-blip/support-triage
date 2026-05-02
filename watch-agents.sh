#!/bin/bash
# Watch all agent logs for an investigation
# Usage: ./watch-agents.sh 5555

if [ -z "$1" ]; then
  echo "Usage: ./watch-agents.sh <investigation_id>"
  exit 1
fi

INVESTIGATION_ID=$1
LOGS_DIR=~/support-triage/logs

echo "Watching agents for investigation #$INVESTIGATION_ID"
echo "Press Ctrl+C to stop"
echo ""

# Check if logs exist
if [ ! -f "$LOGS_DIR/$INVESTIGATION_ID-agent-slack.jsonl" ]; then
  echo "No agent logs found for investigation #$INVESTIGATION_ID"
  echo ""
  echo "Available investigations:"
  ls -1 $LOGS_DIR/*-agent-slack.jsonl 2>/dev/null | sed 's/.*\/\([0-9]*\)-agent.*/  \1/' | sort -u
  exit 1
fi

# Use multitail if available, otherwise use tail -f
if command -v multitail &> /dev/null; then
  multitail \
    -l "tail -f $LOGS_DIR/$INVESTIGATION_ID-agent-slack.jsonl | jq -r '[.ts, .level, .msg] | @tsv'" \
    -l "tail -f $LOGS_DIR/$INVESTIGATION_ID-agent-linear.jsonl | jq -r '[.ts, .level, .msg] | @tsv'" \
    -l "tail -f $LOGS_DIR/$INVESTIGATION_ID-agent-pylon.jsonl | jq -r '[.ts, .level, .msg] | @tsv'" \
    -l "tail -f $LOGS_DIR/$INVESTIGATION_ID-agent-codebase.jsonl | jq -r '[.ts, .level, .msg] | @tsv'"
else
  # Fallback: tail all files together with labels
  tail -f \
    $LOGS_DIR/$INVESTIGATION_ID-agent-slack.jsonl \
    $LOGS_DIR/$INVESTIGATION_ID-agent-linear.jsonl \
    $LOGS_DIR/$INVESTIGATION_ID-agent-pylon.jsonl \
    $LOGS_DIR/$INVESTIGATION_ID-agent-codebase.jsonl
fi
