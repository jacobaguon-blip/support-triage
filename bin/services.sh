#!/bin/bash

VITE_PLIST=~/Library/LaunchAgents/com.support-triage.vite.plist
API_PLIST=~/Library/LaunchAgents/com.support-triage.api.plist

case "$1" in
  start)
    launchctl load "$VITE_PLIST"
    launchctl load "$API_PLIST"
    echo "Services started (Vite :3000, API :3001)"
    ;;
  stop)
    launchctl unload "$VITE_PLIST"
    launchctl unload "$API_PLIST"
    echo "Services stopped"
    ;;
  restart)
    launchctl unload "$VITE_PLIST" 2>/dev/null
    launchctl unload "$API_PLIST" 2>/dev/null
    launchctl load "$VITE_PLIST"
    launchctl load "$API_PLIST"
    echo "Services restarted"
    ;;
  status)
    echo "Vite:  $(launchctl list | grep com.support-triage.vite  || echo 'not loaded')"
    echo "API:   $(launchctl list | grep com.support-triage.api   || echo 'not loaded')"
    ;;
  logs)
    tail -f ~/support-triage/logs/vite.log ~/support-triage/logs/api.log
    ;;
  errors)
    tail -f ~/support-triage/logs/vite.err ~/support-triage/logs/api.err
    ;;
  *)
    echo "Usage: $(basename "$0") {start|stop|restart|status|logs|errors}"
    exit 1
    ;;
esac
