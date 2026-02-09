# Backup & Disaster Recovery Plan

## Overview

The Support Triage System stores all persistent data in a single SQLite database file (`triage.db`) at the project root. This file contains investigations, feature requests, settings, and all operational data. Loss or corruption of this file means loss of all investigation history, configuration, and feature request state.

## What's At Risk

| Data | Location | Impact if Lost |
|------|----------|----------------|
| Investigations | `triage.db` → `investigations` table | All triage history, conversation logs, classification data |
| Feature Requests | `triage.db` → `feature_requests` table | Backlog, priorities, status tracking |
| Settings | `triage.db` → `settings` table | Agent mode, polling config, response style prefs |
| Team Docs | `teams/` directory (markdown) | Recoverable from git |
| QA Docs | `qa/` directory (markdown) | Recoverable from git |

## Backup Strategy

### Automated Daily Backup (Recommended)

Add a cron job or scheduled task to copy the database daily:

```bash
# Example: daily backup at 2 AM, keep last 30 days
0 2 * * * cp /path/to/support-triage/triage.db /path/to/backups/triage-$(date +\%Y\%m\%d).db && find /path/to/backups -name "triage-*.db" -mtime +30 -delete
```

### Manual Backup

```bash
# Quick backup with timestamp
cp triage.db triage-backup-$(date +%Y%m%d-%H%M%S).db
```

### Git-Tracked Configuration

All markdown files (team charters, QA docs, project plans) are tracked in git. The database file should be in `.gitignore` — it contains runtime data, not configuration.

## Recovery Procedures

### Scenario 1: Database Corruption

**Symptoms:** Server returns 500 errors, frontend shows "Backend Disconnected", SQLite errors in server logs.

**Steps:**
1. Stop the server: `Ctrl+C` in the terminal running `node server.js`
2. Move the corrupted file: `mv triage.db triage-corrupted-$(date +%Y%m%d).db`
3. Restore from backup: `cp /path/to/backups/triage-YYYYMMDD.db triage.db`
4. Restart the server: `node server.js`
5. Verify: Open the app, check investigations load, check Admin Portal stats

### Scenario 2: Database Deleted

**Steps:**
1. If a backup exists, restore it (see Scenario 1 step 3)
2. If no backup exists, start the server — it will create a fresh empty database
3. Re-seed feature requests if needed (see Seeding section below)

### Scenario 3: Full System Recovery

**Steps:**
1. Clone the repository
2. `cd ui && npm install`
3. Restore `triage.db` from backup to project root
4. Start backend: `node server.js`
5. Start frontend: `npm run dev`

## Seeding Feature Requests

If restoring to a fresh database, you can re-seed the feature board:

```bash
node -e "
const initSqlJs = require('sql.js');
const fs = require('fs');
const db = new (await initSqlJs()).Database();
db.run('CREATE TABLE IF NOT EXISTS feature_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, status TEXT DEFAULT \"backlog\", priority TEXT DEFAULT \"P3\", category TEXT DEFAULT \"enhancement\", created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
// Add your feature requests here
fs.writeFileSync('triage.db', Buffer.from(db.export()));
"
```

## Monitoring

Keep an eye on:

- **Database file size:** If `triage.db` grows beyond 100MB, investigate — long-running investigations with large conversation logs can bloat the file
- **Server logs:** Watch for `SQLITE_CORRUPT` or `SQLITE_BUSY` errors
- **Disk space:** SQLite will silently fail if disk is full

## Notion Mirror

This document is also maintained in Notion for team-wide visibility. When updating recovery procedures, update both this file and the Notion page.

---

*Last updated: February 2026*
*Owner: Ops Dev Team (Alex Chen)*
