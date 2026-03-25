# UI Architecture

> Detailed component tree, layout diagrams, view modes, and state management for the Support Triage UI.
> For build commands and design tokens, see `CLAUDE.md`.

---

## Component Architecture

```
ui/src/
├── App.jsx                          # Root: header + sidebar + main content
├── main.jsx                         # Vite entry point
├── components/
│   ├── TicketSidebar.jsx            # Left sidebar: investigation list, new ticket button
│   ├── InvestigationDetail.jsx      # Main view: ticket bar + detail body (content + drawer)
│   ├── PhaseTabBar.jsx              # 4-phase dot stepper (Classification → Solution Review)
│   ├── PhaseContent.jsx             # Classic mode: renders phase-specific views
│   ├── ClassificationView.jsx       # Phase 0: ticket metadata grid, body preview
│   ├── ContextGatheringView.jsx     # Phase 1: markdown findings display
│   ├── ConversationStream.jsx       # Conversation mode: real-time bubble stream
│   ├── ConversationBubble.jsx       # 7 bubble types (customer, agent, system, decision, etc.)
│   ├── CheckpointPanel.jsx          # Drawer: checkpoint approval buttons + feedback
│   ├── CheckpointPrompt.jsx         # Inline: checkpoint approval at bottom of conversation
│   ├── RunTabs.jsx                  # Run selector dropdown + Hard Reset button
│   ├── VersionTimeline.jsx          # Backtracking version history
│   ├── BacktrackBar.jsx             # Anchor version indicator bar
│   ├── DecisionLog.jsx              # History of checkpoint decisions
│   ├── ActivityFeed.jsx             # Execution activity log
│   ├── SourcesList.jsx              # Source citation chips
│   ├── DocumentPreview.jsx          # File preview pane
│   └── SettingsPane.jsx             # Settings UI
├── styles/
│   ├── index.css                    # Global CSS variables + base styles
│   ├── App.css                      # App layout + resize handle
│   ├── TicketSidebar.css            # Sidebar: dark navy, compact cards
│   ├── InvestigationDetail.css      # Detail layout: ticket bar + body
│   ├── PhaseTabBar.css              # Phase stepper dots + connectors
│   ├── PhaseViews.css               # Phase content cards, grids, badges
│   ├── CheckpointPanel.css          # Checkpoint buttons, feedback
│   ├── ConversationStream.css       # Conversation spine + items
│   ├── ConversationBubble.css       # 7 bubble types + markdown rendering
│   ├── ActivityFeed.css             # Activity log entries
│   ├── DecisionLog.css              # Decision history entries
│   ├── SettingsPane.css             # Settings grid
│   ├── DocumentPreview.css          # Document viewer
│   ├── RunTabs.css                  # Run dropdown + hard reset
│   ├── VersionTimeline.css          # Version nodes + connectors
│   ├── BacktrackBar.css             # Anchor bar
│   ├── SourcesList.css              # Citation chips
│   └── CheckpointPrompt.css        # Inline checkpoint card
└── services/
    └── sqlite.js                    # All API calls to Express backend
```

## Current App Layout

```
┌─────────────────────────────────────────────────────┐
│ Header: "Support Triage System" + Settings button   │
├──────────┬──┬───────────────────────────────────────┤
│ Sidebar  │↔ │ Main Content Area                     │
│ (dark    │  │ ┌─────────────────────────────────┐   │
│ navy,    │  │ │ Ticket Bar (ID, title, priority) │   │
│ draggable│  │ ├─────────────────────────────────┤   │
│ width    │  │ │ Controls (RunTabs + View Toggle) │   │
│ 180-450) │  │ ├─────────────────────────────────┤   │
│          │  │ │ Phase Stepper (4 dots)           │   │
│ Compact  │  │ ├─────────────────────────────────┤   │
│ ticket   │  │ │ Content:                         │   │
│ cards    │  │ │  - Conversation view (bubbles)   │   │
│          │  │ │  - OR Classic view (phase cards)  │   │
│          │  │ │                                   │   │
│          │  │ │ + Optional right drawer (280px)   │   │
│          │  │ │   (Version Timeline / Checkpoints)│   │
│          │  │ └─────────────────────────────────┘   │
└──────────┴──┴───────────────────────────────────────┘
```

The resize handle (↔) between sidebar and main content is draggable. Double-click resets to 280px default.

## Investigation Phases (4-phase workflow)

1. **Classification** (`phase0`, `checkpoint_1_post_classification`) — Ticket metadata, classification type, product area
2. **Context Gathering** (`phase1`, `checkpoint_2_post_context_gathering`) — Markdown findings from Linear/Slack/code search
3. **Investigation** (`phase2`, `checkpoint_3_investigation_validation`) — Summary, customer response draft, Linear draft
4. **Solution Review** (`phase3`, `checkpoint_4_solution_check`) — Final customer response, action buttons (Copy, Create Linear, Push Notion)

Each phase has a checkpoint where the investigation pauses for human approval.

## View Modes

- **Conversation view** (default): Real-time bubble stream (ConversationStream + ConversationBubble). Checkpoint approval appears inline at bottom (CheckpointPrompt).
- **Classic view**: Phase-specific structured cards (PhaseContent → ClassificationView/ContextGatheringView/etc). Checkpoint approval appears in the right drawer (CheckpointPanel).

## Key State in InvestigationDetail

```javascript
viewMode: 'conversation' | 'classic'
activePhase: 'phase0' | 'phase1' | 'phase2' | 'phase3'
selectedRunNumber: number
drawerOpen: boolean
files: { ticketData, phase1Findings, summary, customerResponse, linearDraft, checkpointActions }
activity: ActivityItem[]
versions: VersionItem[]
```

Polling: Every 2 seconds while investigation is `running` or `waiting`.

## Responsive Breakpoints

All components use consistent breakpoints: `900px` and `768px`. At 900px, layouts compress. At 768px, mobile-friendly stacking. The drawer becomes an absolute overlay below 900px.

## PENDING: Three-Column Layout Redesign

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

Key changes needed:
- Create `DetailPanel.jsx` — always-visible right panel with classification data, ticket metadata, checkpoint actions, version timeline
- Modify `InvestigationDetail.jsx` — replace toggle drawer with persistent right panel
- Phase stepper shows phases 1-3 in center (phase 0 data always visible on right)
- Responsive: right panel collapses to drawer on mobile
