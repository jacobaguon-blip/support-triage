# Support Triage — Project Plan

> **Owner:** Jacob Aguon | **Last updated:** 2026-02-08
> **Repo:** https://github.com/jacobaguon-blip/support-triage.git
> **Stack:** React 18 + Vite 5 | Express 5 | SQLite (sql.js)

---

## What's Been Done

### Sprint 0: Foundation
- [x] Project scaffold (React + Vite + Express + SQLite)
- [x] Core components: TicketSidebar, InvestigationDetail, PhaseTabBar, PhaseContent
- [x] Conversation mode with 7 bubble types (customer, agent, system_phase, system_result, decision, reset)
- [x] Classic mode with phase-specific structured cards
- [x] 4-phase checkpoint system with approval UI (CheckpointPanel + CheckpointPrompt)
- [x] Run management (RunTabs) with Hard Reset capability
- [x] Version timeline with backtracking (roll back / re-focus)
- [x] Activity feed, decision log, sources list
- [x] Auto-restart on new customer messages (smart debounce)
- [x] Settings pane with agent mode, auto-proceed, response style config
- [x] Git repo initialized, `.gitignore` in place

### Sprint 1: C1 Theme + Layout Overhaul (`f5cc930` → `2ec9276`)
- [x] **C1 light theme baseline** — Migrated from dark theme to ConductorOne's white/light aesthetic
  - CSS variables in `index.css`: brand indigo (#6366F1), white backgrounds, dark text
  - Inter font, pill badges, underline tabs, subtle shadows
  - Dark navy sidebar (#1A1D2E) matching C1 platform
- [x] **Layout overhaul** — Two-column layout with compact stepper
  - Compact 40px ticket info bar (ID, title, customer, priority, status, Pylon link)
  - Phase dot stepper replacing bulky tab bar
  - Responsive design foundations
- [x] **Sidebar redesign** — Compact cards, slim header, tighter spacing
- [x] **Responsive QA** — Added breakpoints (900px / 768px) to all 10+ CSS files
  - ConversationBubble, CheckpointPanel, SettingsPane, DocumentPreview, PhaseViews
  - VersionTimeline, BacktrackBar, RunTabs, SourcesList, CheckpointPrompt
- [x] **Draggable resize handle** — Between sidebar and main content
  - Min 180px, max 450px, default 280px, double-click to reset
  - Mouse event handlers in App.jsx, resize handle styles in App.css

### Git History (rollback points)
```
2ec9276 Add draggable resize handle between sidebar and main content  ← CURRENT HEAD
565bc13 QA: add responsive breakpoints to all remaining CSS components
f3ace21 Redesign sidebar: compact cards, slim header, tighter spacing
0dca332 Layout overhaul: two-column layout, compact stepper, responsive design
c785c10 Add .gitignore
f5cc930 Sprint 1: C1 light theme, Inter font, pill badges — baseline
b368f28 Initial commit
```

---

## What's Next — Immediate Priority

### Three-Column Layout Redesign

**Goal:** Make the investigation view feel like a real support tool (Linear, Intercom, Zendesk). Classification data should be always-visible without navigating phases.

**User request:** "Can we have classification be in a sub-pane on the right side so it's kind of like a 'details' pane? Then context gathering with approval in the middle, and investigation, solution review also in the middle?"

**Target layout:**
```
┌──────────┬──┬──────────────────────────┬──────────────┐
│ Sidebar  │↔ │ Center Workflow           │ Details Pane │
│ (tickets)│  │ ┌──────────────────────┐ │ ┌──────────┐ │
│          │  │ │ Controls + Stepper   │ │ │ Classif. │ │
│          │  │ ├──────────────────────┤ │ │ metadata │ │
│          │  │ │ Phase 1-3 content:   │ │ ├──────────┤ │
│          │  │ │  Context Gathering   │ │ │ Ticket   │ │
│          │  │ │  Investigation       │ │ │ details  │ │
│          │  │ │  Solution Review     │ │ ├──────────┤ │
│          │  │ │                      │ │ │ Approval │ │
│          │  │ │ + Checkpoint prompts │ │ │ actions  │ │
│          │  │ └──────────────────────┘ │ ├──────────┤ │
│          │  │                          │ │ Timeline │ │
└──────────┴──┴──────────────────────────┴──────────────┘
```

**Implementation steps:**

1. **Create `DetailPanel.jsx`** — New right-side panel component
   - Classification section: badge, priority, product area, connector, customer name
   - Ticket metadata: ID, Pylon link, agent mode, created date, status
   - Checkpoint actions section (visible when `investigation.status === 'waiting'`)
   - Version timeline (collapsible)
   - Decision log summary (collapsible)

2. **Create `DetailPanel.css`** — Styles for right panel
   - Fixed width ~300px, scrollable, `--bg-secondary` background
   - Section dividers, compact key-value rows
   - Responsive: collapses to toggle-drawer below 1100px

3. **Modify `InvestigationDetail.jsx`** — Replace toggle drawer with persistent panel
   - Remove `drawerOpen` state and drawer toggle button
   - Add `<DetailPanel />` as always-visible third column in `.detail-body`
   - Pass `files.ticketData`, `investigation`, checkpoint handlers to panel
   - Center content shows phases 1-3 only (classification lives on right)

4. **Modify `InvestigationDetail.css`** — Three-column flex layout
   - `.detail-body`: `display: flex` with center (flex: 1) + right panel (~300px)
   - Remove old `.detail-drawer` styles, replace with `.detail-panel`
   - Responsive: panel becomes overlay/drawer below 1100px, hidden below 768px

5. **Modify `PhaseTabBar.jsx`** (optional) — Phase 0 indicator
   - Could show phase 0 as a checkmark (always visible on right) or skip it
   - Stepper focuses on phases 1-3 as the active workflow

6. **QA pass** — Responsive testing, build verification

---

## Feature Roadmap (from FEATURE-ROADMAP.md)

### Sprint 2: Quick Wins
| Feature | Impact | Effort |
|---------|--------|--------|
| SLA Countdown Timer | High | Low |
| Search & Filters (sidebar) | Medium | Low |
| Internal Notes / Annotations | Medium | Low |

### Sprint 3: Efficiency
| Feature | Impact | Effort |
|---------|--------|--------|
| Response Templates with Smart Variables | Medium | Low |
| Bulk Actions Bar | Medium | Low |
| Customer Sentiment Indicator | High | Medium |

### Sprint 4: Intelligence
| Feature | Impact | Effort |
|---------|--------|--------|
| Similar Ticket Finder | High | Medium |
| Escalation Workflow (one-click) | High | Medium |

### Sprint 5: Platform
| Feature | Impact | Effort |
|---------|--------|--------|
| Analytics Dashboard | Medium | Medium |
| Webhook / Event System | Medium | High |

---

## Feature Request System

The team uses a lightweight feature request flow so anyone can describe what they need and Claude builds it.

### How to Request a Feature

**Quick way — just tell Claude:**
```
I need a tool that [does X]. The problem is [Y]. Add it to the backlog.
```

**Detailed way — use the template:**
Copy `features/TEMPLATE.md` to `features/your-feature-name.md` and fill it out.

### Where Things Live

| Path | Purpose |
|------|---------|
| `features/BACKLOG.md` | Living backlog — priorities, status, what's next |
| `features/TEMPLATE.md` | Template for new feature requests |
| `features/*.md` | Individual detailed feature specs |
| `features/in-progress/` | Features currently being built |
| `features/completed/` | Archive of shipped features |
| `tools/` | Standalone scripts and utilities (not UI features) |

### Workflow

1. TSE describes a need (plain English, screenshot, frustration — whatever)
2. Claude creates a structured spec in `features/`
3. Claude adds it to `features/BACKLOG.md` with priority
4. Claude implements it, following project conventions
5. Claude sends Moshi notification when done
6. TSE reviews, provides feedback
7. Claude iterates if needed, then moves to `features/completed/`

### Example Prompts for Claude Code

**Request a new feature:**
```
I need a way to quickly test if a connector API is responding. Right now I have to
manually curl endpoints and check status codes. Can you build a connector health
check tool?
```

**Check the backlog:**
```
Read features/BACKLOG.md. What's the highest priority item that hasn't been started?
Start working on it.
```

**Build from a frustration:**
```
I just spent 20 minutes searching Slack for context on a ticket. Build me something
that automatically pulls relevant Slack threads when I give it a ticket ID.
```

**Request a replication helper:**
```
I keep needing to test access review workflows. Build me a script that sets up a
test access review with dummy data so I can replicate customer issues faster.
```

---

## Key Files to Know

| File | What it does |
|------|-------------|
| **Project docs** | |
| `CLAUDE.md` | Full project context — Claude reads this automatically |
| `PROJECT-PLAN.md` | This file — completed work, roadmap, workflow |
| `features/BACKLOG.md` | Feature request backlog with priorities |
| `FEATURE-ROADMAP.md` | 10 feature candidates with priority matrix |
| `QA-CHECKLIST.md` | ISO 25010-based QA template |
| `UX-WORKFLOW-ASSESSMENT.md` | C1 design language audit + UX friction analysis |
| `support-triage-spec.md` | Full V1 system spec (architecture, classification, agents) |
| **UI source** | |
| `ui/src/App.jsx` | Root layout: header, sidebar, resize handle, main content |
| `ui/src/components/InvestigationDetail.jsx` | Main investigation view — ticket bar, phase stepper, content area, drawer |
| `ui/src/components/PhaseContent.jsx` | Classic mode renderer — routes to phase views |
| `ui/src/components/ConversationStream.jsx` | Real-time conversation bubble feed with polling |
| `ui/src/components/ConversationBubble.jsx` | 7 bubble types with markdown rendering |
| `ui/src/components/CheckpointPanel.jsx` | Checkpoint approval buttons + feedback (drawer) |
| `ui/src/components/CheckpointPrompt.jsx` | Checkpoint approval (inline, conversation view) |
| `ui/src/components/ClassificationView.jsx` | Phase 0 content — metadata grid, ticket body |
| `ui/src/styles/index.css` | All CSS variables (C1 design tokens) |
| `ui/src/services/sqlite.js` | All API calls to Express backend |

---

## How to Work on This

### From Claude Code
```bash
cd ~/support-triage   # or wherever you cloned it
claude                 # reads CLAUDE.md automatically
```

Claude Code picks up the full project context from CLAUDE.md — design system, component architecture, developer workflow, conventions. To start building:

```
Read PROJECT-PLAN.md and features/BACKLOG.md. What should I work on next?
```

### From Cowork
Open the `support-triage` folder. All context is in the files above.

### Running the Dev Server
```bash
cd ui && npm run dev      # Vite dev server on port 3000
cd ui && node server.js   # Express API on port 3001
```

### Before Starting New Work
1. Read this file for current state + what's next
2. `git log --oneline` to confirm you're on the right commit
3. `cd ui && npm run build` to verify the build is clean
4. Branch off for new features if desired

### After Completing Work
1. Run `cd ui && npm run build` — must pass with 0 errors
2. Commit with descriptive message
3. Update `features/BACKLOG.md` — move to completed
4. Send push notification (Moshi webhook in CLAUDE.md)
