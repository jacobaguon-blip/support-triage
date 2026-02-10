# Feature Backlog

> **How to use:** Add feature requests below or create individual files in `features/`.
> Claude Code reads this file to know what to build next.
> Move completed features to `features/completed/`.

---

## How to Submit a Feature Request

**Option 1 — Quick (just tell Claude):**
```
Hey Claude, I need a tool that [description]. Add it to the backlog.
```
Claude will create a structured feature request and add it here.

**Option 2 — Detailed (copy the template):**
Copy `features/TEMPLATE.md` → `features/your-feature-name.md`, fill it out.

**Option 3 — Add it inline below:**
Add a new entry under the appropriate priority section below.

---

## In Progress

| Feature | File | Assigned | Started |
|---------|------|----------|---------|
| Three-Column Layout Redesign | `PROJECT-PLAN.md` | Claude | 2026-02-08 |

## P2 — High Priority

### SLA Countdown Timer
**Requested by:** Jacob | **Date:** 2026-02-07
Live countdown to SLA breach on investigation cards and detail view. Color-coded: green (>4h), yellow (1-4h), red (<1h), flashing red (breached). Pulls SLA targets from Pylon ticket priority.
**Why:** SLA breaches are the #1 metric leadership tracks.

### Search & Filters
**Requested by:** Jacob | **Date:** 2026-02-07
Search bar + filter chips in sidebar: search by ticket ID, customer name, keyword. Filter by status, priority, classification, product area, connector.
**Why:** Once you have 50+ investigations, scrolling a flat list is painful.

## P3 — Medium Priority

### Internal Notes / Annotations
Attach internal-only notes to any investigation or phase output. Visible to team, never surfaced to customer. Supports @mentions.

### Response Templates with Smart Variables
Pre-built templates for common scenarios. Variables like `{{customer_name}}`, `{{ticket_id}}` auto-fill from investigation data.

### Customer Sentiment Indicator
Auto-analyze customer messages for frustration/urgency signals. Badge on investigation cards.

### Similar Ticket Finder
Auto-surface 3-5 past investigations with similar classification + connector + product area when an investigation starts.

### Escalation Workflow
One-click escalation that auto-packages ticket summary, findings, repro steps, sentiment, conversation history into a structured brief.

## P4 — Nice to Have

### Bulk Actions Bar
Checkbox selection on investigation list for bulk reassign, prioritize, tag.

### Analytics Dashboard
Avg time per phase, tickets by classification, agent accuracy, SLA compliance rate, trending product areas.

### Webhook / Event System
Outbound webhooks for investigation lifecycle events (created, phase_completed, checkpoint_waiting, escalated, resolved).

---

## Completed

| Feature | Completed | Notes |
|---------|-----------|-------|
| C1 Light Theme | 2026-02-08 | Sprint 1 baseline |
| Two-Column Layout | 2026-02-08 | Layout overhaul |
| Sidebar Redesign | 2026-02-08 | Compact cards |
| Responsive QA | 2026-02-08 | All CSS breakpoints |
| Draggable Resize Handle | 2026-02-08 | Sidebar ↔ main |
| MCP Health Check System | 2026-02-09 | Validate MCP services on startup |
| MCP Credential Manager | 2026-02-09 | Encrypted local storage + auto-config |
| OAuth Authentication | 2026-02-09 | OAuth 2.0 support for Linear (+ others) |
