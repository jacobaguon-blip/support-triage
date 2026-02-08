# UX & Workflow Assessment — Support Triage System

**Author:** Technical Support Operations / Product Management
**Date:** 2026-02-07
**Audience:** TSE team, Engineering
**Purpose:** Evaluate current UI/UX, identify workflow friction, recommend improvements aligned with ConductorOne design language

---

## Executive Summary

The Support Triage tool is functionally solid — the investigation workflow, phase system, and conversation view all serve real needs. But the UI has diverged significantly from the ConductorOne platform identity, and the workflow has friction points that slow TSEs during time-sensitive triage.

**Bottom line:** The tool feels like a completely separate product. TSEs context-switch between the C1 dashboard and this tool dozens of times per day. The visual mismatch — dark theme vs. C1's clean white/light aesthetic — creates unnecessary cognitive load. Aligning the design language and tightening the workflow would meaningfully improve daily throughput.

---

## Part 1: Visual Design — Current vs. ConductorOne

### 1.1 What C1 Actually Looks Like (from screenshots)

From the Task Log, Applications, and Entitlement Detail pages:

**Sidebar:** Dark navy/charcoal (~`#1A1D2E`) with white text, ~130px wide. C1 purple logo at top. `⌘K` search shortcut. Navigation items with left-aligned icons (Home, Requests, Reviews, Apps, Explore, Governance, Directory, Workflows, Integrations, Agentic AI, Settings). Selected item gets a blue/purple background fill with rounded corners. Green notification dots on Requests/Reviews. "+ New request" button at top. User avatars stacked at bottom.

**Content area:** Pure white (`#FFFFFF`) background. No dark tones anywhere in the main content. Clean, spacious feel.

**Page headers:** Icon + title text (~20px, semi-bold). Right-aligned action buttons ("New application" = purple filled button with white text).

**Filter bars:** Search input (rounded, light border, magnifying glass icon) + filter dropdowns ("Filters", "App", "Status") as outlined pills/chips.

**Tables:** Extremely clean — no heavy borders, barely-visible row separators, generous row height (~52px). Column headers in small gray text (~13px, regular weight). Content in darker text (~14px). Status badges are pill-shaped with semantic colored backgrounds.

**Status badges:** Rounded pill shape, background + text color:
- **Granted/Provisioned:** Green background, green text
- **Confirmed:** Blue background, blue text
- **Submitted:** Gray background, gray text
- **Requires approval:** Amber/orange background, amber text

**Detail pages:** Breadcrumb navigation (clickable links with ">" separators). Sub-tabs below page title with blue underline on active tab. Two-column card layout: white cards with subtle gray borders (~`#E5E7EB`), rounded corners (~8px), generous padding (~24px). "Edit" links in blue, right-aligned in card headers. Key-value pairs with gray labels and darker values.

**Typography:** Clean geometric sans-serif (Inter or similar), excellent readability at all sizes.

### 1.2 Current Support Triage vs. C1

| Element | Current Triage Tool | ConductorOne Platform |
|---------|--------------------|-----------------------|
| **Background** | `#1a1a1a` (full dark) | `#FFFFFF` (white) |
| **Cards** | `#2d2d2d` + hard borders | White + subtle shadow/border |
| **Sidebar** | `#2d2d2d` dark gray | `#1A1D2E` dark navy |
| **Text** | `#e0e0e0` light gray | `#1A1D26` near-black |
| **Primary accent** | `#3b82f6` (blue) | `#6366F1` (purple/indigo) |
| **Buttons** | Blue fills, bounce on hover | Purple fills, clean hover |
| **Tables** | N/A (card-based) | Clean minimal-border tables |
| **Status badges** | Colored text only | Pill badges with bg+text |
| **Search** | None | Prominent, with `⌘K` |
| **Breadcrumbs** | None | Clickable navigation trail |
| **Tabs** | Toggle buttons | Underline-style tabs |
| **Font** | System stack | Inter / geometric sans-serif |

**The gap is significant.** The triage tool looks like a developer's dark-mode prototype, not a C1 internal tool.

### 1.3 Proposed Design Tokens (C1-Aligned)

```css
:root {
  /* ===== Backgrounds (match C1 content area) ===== */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;      /* very light gray for cards, sidebar content */
  --bg-tertiary: #F3F4F6;       /* input backgrounds, alt rows */
  --bg-hover: #F3F4F6;

  /* ===== Sidebar (match C1 dark navy sidebar) ===== */
  --sidebar-bg: #1A1D2E;
  --sidebar-text: #E5E7EB;
  --sidebar-text-muted: #9CA3AF;
  --sidebar-active-bg: rgba(99, 102, 241, 0.15);
  --sidebar-active-text: #FFFFFF;

  /* ===== Text (match C1 dark-on-white) ===== */
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;

  /* ===== Borders (match C1 subtle separators) ===== */
  --border-color: #E5E7EB;
  --border-strong: #D1D5DB;

  /* ===== Brand Accent (C1 purple/indigo) ===== */
  --c1-primary: #6366F1;         /* primary actions, links, active tabs */
  --c1-primary-hover: #4F46E5;
  --c1-primary-light: #EEF2FF;   /* light purple tint for backgrounds */

  /* ===== Semantic Status (keep universal) ===== */
  --status-green: #10B981;
  --status-green-bg: #ECFDF5;
  --status-yellow: #F59E0B;
  --status-yellow-bg: #FFFBEB;
  --status-red: #EF4444;
  --status-red-bg: #FEF2F2;
  --status-blue: #3B82F6;
  --status-blue-bg: #EFF6FF;
  --status-gray: #6B7280;
  --status-gray-bg: #F3F4F6;

  /* ===== Shadows (C1 uses subtle depth) ===== */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08);

  /* ===== Spacing (4px base grid) ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* ===== Radius (match C1's rounded elements) ===== */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-pill: 9999px;

  /* ===== Typography ===== */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Monaco', monospace;
}
```

---

## Part 2: Layout & Information Architecture

### 2.1 Sidebar Redesign

**Current:** 320px, dark gray (`#2d2d2d`), flat ticket list with 3 filter buttons (All/Active/Done), no search, "New Investigation" at the bottom.

**C1 pattern:** ~130px nav sidebar (dark navy) with icon + label items, `⌘K` search, notification dots, user stack at bottom.

**Problem:** Our sidebar serves a different purpose than C1's nav sidebar — ours is a ticket list, not navigation. But we can borrow C1's patterns:

**Recommended changes:**

1. **Match the C1 sidebar color** — change from `#2d2d2d` to `#1A1D2E` (dark navy). This single change visually connects the tools.

2. **Add search at top** — match C1's search bar placement and `⌘K` shortcut.

3. **Replace 3 filter buttons with C1-style filter dropdowns** — "Status ▾" "Priority ▾" "Sort ▾" as small outlined pills, just like C1's "Filters", "App", "Status" on the Task Log page.

4. **Add notification dots** — mimic C1's green dots on Requests/Reviews. Show a dot on any ticket that needs attention (waiting state, new customer reply).

5. **Ticket cards should use C1's status badge style** — pill-shaped badges instead of just colored text. "Running" = blue pill, "Waiting" = amber pill, "Complete" = green pill.

### 2.2 Main Content Layout

**Current:** Three-column layout (sidebar 320px + detail-left 350px + detail-right flex). The middle column (detail-left) has ticket info card, view toggle, and version timeline.

**C1 pattern:** Two-column (sidebar + full-width content area). Detail pages use breadcrumbs + sub-tabs + card layouts within the content area.

**Problems:**
- Three columns leaves only ~770px for investigation content on a 1440px display
- Ticket info card takes 350px permanently for data that rarely changes
- View toggle is visually disconnected from the content it controls

**Recommended layout (C1-aligned):**

```
Sidebar (320px, navy)         Main Content (flex: 1, white)
├── ⌘K Search                 ├── Breadcrumb: Investigations > #8847 — Acme Corp
├── Status ▾  Priority ▾      ├── Page Header: #8847 — Acme Corp
├── Ticket list                │   Priority: P1  |  Status: Running  |  Classification: connector_issue
│   ├── #8847 (P1) 🔵         │   Connector: Salesforce  |  Created: 2h ago
│   ├── #8851 (P2) 🟡         │
│   └── #8855 (P3) 🔵         ├── [Investigation ▾ dropdown]  [Conversation | Classic]
│                              ├── Phase Stepper: ●──●──○──○  (compact, ~40px tall)
│                              │
└── + New Investigation        └── Content Area (full width)
                                   ├── Sticky Checkpoint Banner (if waiting)
                                   └── Conversation Stream / Phase Content
```

**Key changes:**
- Ticket info collapses into a **compact header bar** (one line of key facts, expandable on click)
- View toggle moves to the **same row as run selector** (C1 puts tabs at content top)
- Version Timeline becomes a **slide-out drawer** (triggered by a "History" icon button)
- Full content width available for investigation work

### 2.3 Phase Progress Bar

**Current:** 4 large circles (76px each) with connector lines, ~150px tall.

**C1 pattern:** C1 doesn't have phase steppers, but their design language favors compact, information-dense layouts. Their tables, cards, and filter bars all prioritize density over decoration.

**Recommendation:** Replace with a **compact horizontal stepper** inspired by C1's clean aesthetic:

```
 ● Classification ─── ● Context ─── ○ Investigation ─── ○ Solution
 ✓ complete            ✓ complete      ⟳ running            pending
```

- Dots: 16px (completed = green fill, active = blue fill with pulse, pending = gray outline)
- Connector lines: 2px, gray (completed sections = green)
- Phase names: 12px below dots
- Total height: ~40px (vs current ~150px)
- In classic view, dots/names are clickable

---

## Part 3: Component-by-Component Alignment

### 3.1 Status Badges → C1 Pill Badges

**Current:** Status shown as colored text (`color: var(--accent-blue)` for running).

**C1 pattern:** Pill-shaped badges with semantic background + text:

```css
/* Match C1's badge pattern */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}
.badge--running  { background: var(--status-blue-bg);   color: var(--status-blue); }
.badge--waiting  { background: var(--status-yellow-bg); color: var(--status-yellow); }
.badge--complete { background: var(--status-green-bg);  color: var(--status-green); }
.badge--error    { background: var(--status-red-bg);    color: var(--status-red); }
.badge--paused   { background: var(--status-gray-bg);   color: var(--status-gray); }
```

### 3.2 Buttons → C1 Button Styles

**Current:** Blue fills with `translateY(-1px)` hover bounce.

**C1 pattern:** Purple filled primary button ("New application"), clean hover (darken, no vertical movement).

```css
.btn-primary {
  background: var(--c1-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-weight: 500;
  font-size: 14px;
  transition: background-color 150ms ease;
}
.btn-primary:hover {
  background: var(--c1-primary-hover);
  /* NO translateY, no box-shadow lift */
}
```

### 3.3 Tabs → C1 Underline Tabs

**Current:** Toggle buttons in a pill container (Conversation / Classic).

**C1 pattern:** Tab text with blue/purple underline on active tab (seen on Applications page: "Managed apps | Unmanaged apps | Shadow apps" and on Detail page: "Details | Bindings | Grants | Past grants").

```css
.tab-bar {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--border-color);
  padding: 0;
}
.tab {
  padding: 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  transition: color 150ms, border-color 150ms;
  cursor: pointer;
  background: none;
}
.tab:hover { color: var(--text-primary); }
.tab--active {
  color: var(--c1-primary);
  border-bottom-color: var(--c1-primary);
}
```

### 3.4 Cards → C1 Card Style

**Current:** Dark cards (`#2d2d2d`) with hard borders.

**C1 pattern:** White cards with subtle border, optional "Edit" link in header.

```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.card-action {
  font-size: 14px;
  color: var(--c1-primary);
  cursor: pointer;
}
```

### 3.5 Tables → C1 Clean Table

The C1 Task Log table is a reference for how we should display investigation lists:

```css
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}
.table td {
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}
.table tr:hover {
  background: var(--bg-secondary);
}
```

### 3.6 Search → C1 Search Pattern

C1 has a search input with magnifying glass icon, rounded corners, appearing at the top of both sidebar and content areas.

```css
.search-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 100%;
}
.search-input:focus-within {
  border-color: var(--c1-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}
.search-input input {
  border: none;
  background: none;
  outline: none;
  flex: 1;
  font-size: 14px;
}
.search-input .shortcut {
  font-size: 12px;
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}
```

---

## Part 4: Workflow Improvements

### 4.1 The TSE's Daily Loop — Friction Points

**Problem A: No priority signal in the list.**
TSEs have to open each ticket to understand urgency. C1 shows status badges prominently in table rows. We should do the same — priority and status as colored pills, visible at a glance.

**Problem B: Checkpoint approval requires too many clicks.**
Current: see "waiting" → click ticket → scroll to bottom of conversation → find checkpoint prompt → approve. Should be: see "waiting" in sidebar → click approve directly, or open ticket and see checkpoint pinned at top.

**Problem C: No queue grouping.**
The flat list doesn't match how TSEs think. They think: "What needs my attention right now?" C1 organizes by task type and status. We should group by action state.

**Problem D: No team awareness.**
Two TSEs could be looking at the same ticket. No assignment, no presence indicators. C1 shows "Assigned to" as a column in their Task Log.

### 4.2 Recommended Workflow Changes

**W1: Smart Queue Groups (C1-inspired)**

Borrow from C1's filter/sort pattern but add grouping:

```
▼ NEEDS YOUR ACTION (3)     ← checkpoint waiting, new replies
▼ AI IN PROGRESS (2)        ← running investigations
▼ READY TO REVIEW (1)       ← complete, needs TSE review
▼ RESOLVED (4)              ← recently closed
```

Each group is collapsible. Within each group, sort by priority (P1 first) then SLA urgency.

**W2: Sidebar Quick-Actions**

When a ticket is at a checkpoint, show inline action buttons on the sidebar card:

```
┌──────────────────────────────────┐
│ 🟡 #8847 — Acme Corp      [P1] │
│ Classification checkpoint         │
│ [✓ Approve]  [Details →]         │
└──────────────────────────────────┘
```

Simple checkpoints (where the AI classification is obviously correct) get resolved without opening the detail view.

**W3: Sticky Checkpoint Banner**

When viewing a ticket in "waiting" state, pin the checkpoint prompt to the top of the content area as a banner — not buried at the conversation bottom:

```
┌─────────────────────────────────────────────────┐
│ ⏳ CHECKPOINT: Classification Review             │
│ AI classified as: connector_issue (Salesforce)   │
│ Confidence: High                                 │
│                                                  │
│ [Approve & Continue]  [Reclassify ▾]  [Abort]    │
└─────────────────────────────────────────────────┘
```

**W4: Keyboard Shortcuts**

| Key | Action |
|-----|--------|
| `J` / `K` | Navigate ticket list |
| `Enter` | Open selected ticket |
| `A` | Approve checkpoint |
| `R` | Open reclassify menu |
| `N` | Jump to next "needs action" ticket |
| `Esc` | Back to list |
| `⌘K` | Search (match C1) |

**W5: Assignment & Presence**

Add an "Assigned to" field (matching C1's Task Log "Assigned to" column). Show avatar + name. When another TSE has a ticket open, show their avatar on the sidebar card.

---

## Part 5: Priority Action Items

### Sprint 1 — Visual Alignment (Highest Impact)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Switch to C1-aligned light theme (CSS variable swap) | Low | **Critical** |
| 2 | Match sidebar color to C1 navy (`#1A1D2E`) | Low | High |
| 3 | Replace status text with C1-style pill badges | Low | High |
| 4 | Switch buttons to C1 purple, remove bounce hover | Low | Medium |
| 5 | Replace toggle buttons with C1 underline tabs | Low | Medium |
| 6 | Add Inter font | Low | Medium |

### Sprint 2 — Layout Restructure

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 7 | Collapse detail-left into compact header bar | Medium | **Critical** |
| 8 | Compact phase stepper (76px circles → 16px dots) | Medium | High |
| 9 | Add search to sidebar with `⌘K` | Medium | High |
| 10 | Sticky checkpoint banner at top of content | Medium | High |
| 11 | Move view toggle to right panel as underline tabs | Low | Medium |

### Sprint 3 — Workflow Upgrades

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 12 | Smart queue grouping in sidebar | Medium | High |
| 13 | Sidebar quick-action buttons for checkpoints | Medium | High |
| 14 | Keyboard shortcuts (J/K, A, R, N, ⌘K) | Medium | Medium |
| 15 | Assignment field + presence indicators | Medium | Medium |
| 16 | Version timeline → slide-out drawer | Low | Medium |

---

## Appendix: Side-by-Side Mockup Reference

**Current triage tool structure:**
```
┌──────────────────────────────────────────────────────────────┐
│  [Header - dark gray]                                         │
├─────────────┬──────────────┬─────────────────────────────────┤
│  Sidebar    │  Detail-Left │  Detail-Right                    │
│  320px      │  350px       │  flex: 1 (~770px on 1440)        │
│  dark gray  │  dark gray   │  dark gray                       │
│             │              │                                   │
│  Flat list  │  Ticket info │  Run selector                    │
│  3 filters  │  View toggle │  Phase circles (150px tall)      │
│             │  Versions    │  Conversation or Classic          │
│             │              │  ...                              │
│             │              │  Checkpoint prompt (bottom)       │
│  [+ New]    │              │                                   │
└─────────────┴──────────────┴─────────────────────────────────┘
```

**Proposed C1-aligned structure:**
```
┌──────────────────────────────────────────────────────────────┐
│  [C1 Logo]                                    [Settings ⚙]   │
├─────────────┬────────────────────────────────────────────────┤
│  Sidebar    │  Breadcrumb: Investigations > #8847             │
│  320px      │  ┌─ Header: #8847 Acme Corp  P1  Running  ──┐ │
│  navy       │  └─ Salesforce | connector_issue | 2h ago  ──┘ │
│  #1A1D2E    │                                                 │
│             │  [Investigation ▾]  Conversation | Classic       │
│  [⌘K]      │  ●───●───○───○  Classification→Context→...      │
│  Status ▾   │                                                 │
│  Priority ▾ │  ┌── CHECKPOINT: Review Classification ───────┐│
│             │  │ [Approve]  [Reclassify ▾]  [Abort]         ││
│  ▼ NEEDS    │  └────────────────────────────────────────────┘│
│  ACTION (3) │                                                 │
│   #8847 🔴  │  ┌── Conversation Stream ─────────────────────┐│
│   #8851 🟡  │  │                                             ││
│   #8855 🔵  │  │  (full width ~1100px on 1440 display)      ││
│             │  │                                             ││
│  ▼ AI       │  └─────────────────────────────────────────────┘│
│  WORKING(2) │                                                 │
│   #8849     │                                                 │
│   #8853     │                                                 │
│             │                                                 │
│  [+ New]    │                                                 │
└─────────────┴────────────────────────────────────────────────┘
```

**Result:** Content area goes from ~770px to ~1100px (+43%). Checkpoint prompt is visible without scrolling. Ticket info is always available in the compact header but doesn't steal space. Everything aligns with C1's clean, white, minimal-border aesthetic.

---

*Assessment based on: ConductorOne Task Log, Applications, and Entitlement Detail screenshots; full audit of 15+ CSS files and 13+ JSX components; TSE workflow analysis.*
