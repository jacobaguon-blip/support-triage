# Feature Roadmap — Support Triage System

> **Prepared by:** Product (AI-assisted)
> **Date:** 2026-02-07
> **Scope:** Next 10 high-impact features, prioritized by effort/impact ratio

---

## Feature Candidates

### 1. SLA Countdown Timer
**Impact:** High | **Effort:** Low | **Category:** Visibility

Add a live countdown to SLA breach on every investigation card and detail view. Color-coded: green (>4h), yellow (1–4h), red (<1h), flashing red (breached). Pulls SLA targets from Pylon ticket priority.

**Why:** SLA breaches are the #1 metric leadership tracks. Agents currently have to mentally calculate time remaining. A persistent visual timer changes behavior — agents naturally prioritize the reddest tickets.

---

### 2. Customer Sentiment Indicator
**Impact:** High | **Effort:** Medium | **Category:** Intelligence

Auto-analyze customer messages for frustration, urgency, and satisfaction signals. Display as a small badge (😊 😐 😤 🔥) on each investigation card, updated after every new message. Use keyword/pattern matching to keep it lightweight — no LLM call needed.

**Why:** A customer who's sent 4 frustrated messages in 2 hours needs different handling than someone who casually mentioned an issue. This surfaces emotional context that raw priority labels miss.

---

### 3. Similar Ticket Finder
**Impact:** High | **Effort:** Medium | **Category:** Knowledge

When an investigation starts, auto-surface 3–5 past investigations with similar classification + connector + product area. Show resolution summary and time-to-resolve. Clickable to view the archived investigation.

**Why:** 40–60% of support issues are repeats. If a similar ticket was resolved last week, the agent can skip half the investigation phases and go straight to the known fix. This is the single highest-leverage knowledge feature.

---

### 4. Bulk Actions Bar
**Impact:** Medium | **Effort:** Low | **Category:** Efficiency

Add checkbox selection on the investigation list. Selected investigations can be bulk-reassigned, bulk-prioritized, or bulk-tagged. Useful during morning triage when 10+ tickets arrived overnight.

**Why:** One-at-a-time triage doesn't scale. When the queue backs up, agents need to quickly sort and assign without opening each ticket individually.

---

### 5. Investigation Search & Filters
**Impact:** Medium | **Effort:** Low | **Category:** Navigation

Add a search bar + filter chips to the sidebar: search by ticket ID, customer name, or keyword. Filter by status (running/waiting/complete), priority, classification, product area, connector. Persist last-used filter per session.

**Why:** Once you have 50+ investigations, scrolling through a flat list is painful. This is table-stakes for any list-based tool.

---

### 6. Internal Notes / Annotations
**Impact:** Medium | **Effort:** Low | **Category:** Collaboration

Allow agents to attach internal-only notes to any investigation or specific phase output. Visible to the team but never surfaced to the customer. Supports @mentions to notify teammates.

**Why:** Support is a team sport. Agents need to leave breadcrumbs for handoffs, shift changes, or escalation context. Currently there's no way to add human context without editing the AI-generated outputs.

---

### 7. Escalation Workflow
**Impact:** High | **Effort:** Medium | **Category:** Process

One-click escalation button that auto-packages: ticket summary, investigation findings, reproduction steps, customer sentiment, and conversation history into a structured escalation brief. Routes to engineering via Linear issue creation or Slack notification.

**Why:** Escalations are currently manual and inconsistent. Some include full context, others just say "customer is angry, please help." A structured workflow ensures engineering gets what they need the first time.

---

### 8. Analytics Dashboard
**Impact:** Medium | **Effort:** Medium | **Category:** Insights

A dedicated dashboard view showing: avg time per phase, avg total resolution time, tickets by classification breakdown, agent accuracy (how often the AI classification matches human override), SLA compliance rate, and trending product areas.

**Why:** Without data, you can't improve. This gives leadership visibility into bottlenecks (e.g., "Phase 2 takes 3x longer for connector issues") and helps justify staffing decisions.

---

### 9. Response Templates with Smart Variables
**Impact:** Medium | **Effort:** Low | **Category:** Efficiency

Pre-built response templates for common scenarios (feature request acknowledgment, bug reproduction request, resolution confirmation). Templates support variables like `{{customer_name}}`, `{{ticket_id}}`, `{{connector_name}}` that auto-fill from investigation data.

**Why:** The AI already drafts customer responses, but agents often want to use their own voice for certain interactions. Templates give them that control without starting from scratch every time.

---

### 10. Webhook / Event System
**Impact:** Medium | **Effort:** High | **Category:** Platform

Expose investigation lifecycle events (created, phase_completed, checkpoint_waiting, escalated, resolved) as outbound webhooks. Configurable per-event with URL targets. Enables custom integrations: Slack alerts, PagerDuty on P1s, CRM updates, etc.

**Why:** This transforms the tool from a standalone app into a platform. The team can wire up whatever workflows they need without waiting for built-in integrations.

---

## Priority Matrix

| # | Feature | Impact | Effort | Ship Order |
|---|---------|--------|--------|------------|
| 1 | SLA Countdown Timer | High | Low | **Sprint 1** |
| 5 | Search & Filters | Medium | Low | **Sprint 1** |
| 6 | Internal Notes | Medium | Low | **Sprint 1** |
| 9 | Response Templates | Medium | Low | **Sprint 2** |
| 4 | Bulk Actions | Medium | Low | **Sprint 2** |
| 2 | Customer Sentiment | High | Medium | **Sprint 2** |
| 3 | Similar Ticket Finder | High | Medium | **Sprint 3** |
| 7 | Escalation Workflow | High | Medium | **Sprint 3** |
| 8 | Analytics Dashboard | Medium | Medium | **Sprint 4** |
| 10 | Webhook System | Medium | High | **Sprint 5** |
