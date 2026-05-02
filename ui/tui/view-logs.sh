#!/bin/bash
# View TUI logs in real-time

LOG_DIR="$HOME/support-triage/logs"

# Get the most recent log file
LATEST_LOG=$(ls -t "$LOG_DIR"/tui-*.log 2>/dev/null | head -1)

if [ -z "$LATEST_LOG" ]; then
  echo "No log files found in $LOG_DIR"
  exit 1
fi

echo "Viewing: $LATEST_LOG"
echo "---"

# Follow the log file and pretty-print JSON
tail -f "$LATEST_LOG" | while read line; do
  echo "$line" | jq -C '.' 2>/dev/null || echo "$line"
done
