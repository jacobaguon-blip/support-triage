#!/bin/bash
# Capture TUI output with ANSI codes

# Use script command to capture terminal session
script -q /tmp/tui-output.txt ./triage-tui

# Alternative: Use ttyrec to record the session
# ttyrec -e ./triage-tui /tmp/tui-recording.ttyrec
