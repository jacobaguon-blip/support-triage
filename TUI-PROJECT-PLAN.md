# Support Triage TUI - Project Plan & Design Presentation

## Executive Summary

**Project:** Terminal UI for Support Ticket Triage System
**Timeline:** 2 weeks (completed Phases 1-3, Phase 4 remaining)
**Status:** MVP Complete - Production-ready with polish needed
**Audience:** Technical Support Engineers at ConductorOne

---

## Vision & Goals

### Problem Statement
TSEs need to manage multiple support investigations simultaneously. The current system lacks a unified, efficient interface for:
- Viewing all active investigations at a glance
- Monitoring agent progress in real-time
- Approving checkpoints without context switching
- Accessing logs and investigation details quickly

### Solution
A modern terminal UI inspired by successful tools like Sidecar that provides:
- **Split-pane layout** for efficient information density
- **Real-time updates** of investigation status
- **Keyboard-driven workflow** for power users
- **Professional C1 design** matching company brand

### Success Metrics
- **Adoption:** 80% of TSEs use TUI daily within 2 weeks
- **Efficiency:** 30% reduction in time to approve checkpoints
- **Satisfaction:** NPS score >8 from TSE team
- **Observability:** 100% of investigation state visible without switching tools

---

## Design System

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ Title Bar (Brand Identity)                                  │
├──────────────────┬──────────────────────────────────────────┤
│ Sidebar (35%)    │ Detail Panel (65%)                       │
│                  │                                          │
│ List View        │ Selected Item Details                    │
│ - Status icons   │ - Full metadata                          │
│ - Quick scan     │ - Agent status                           │
│ - Navigation     │ - Available actions                      │
│                  │                                          │
├──────────────────┴──────────────────────────────────────────┤
│ Action Bar (Commands & Status)                              │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Information Density** - Show maximum relevant info without clutter
2. **Scannability** - Status icons and colors for at-a-glance understanding
3. **Progressive Disclosure** - Summary in list, details on selection
4. **Consistency** - C1 design system throughout
5. **Efficiency** - Keyboard-first for power users

### Color Strategy (C1 Brand)

| Element | Color | Purpose |
|---------|-------|---------|
| Primary | #6366F1 (Indigo) | Brand identity, selected items |
| Running | #F59E0B (Amber) | Active processes |
| Waiting | #3B82F6 (Blue) | Needs attention |
| Complete | #10B981 (Green) | Success states |
| Error | #EF4444 (Red) | Problems |
| Text | #111827 (Dark Gray) | Primary content |
| Borders | #E5E7EB (Light Gray) | Subtle separation |

**Rationale:** Professional, accessible, matches ConductorOne web app

---

## Feature Roadmap

### Phase 1: Foundation ✅ (Complete)
**Deliverable:** Working CLI that agents can call

- CLI commands (create, approve, status, logs, list)
- Agent spawning as background processes
- Structured JSON logging
- Database integration

**Value:** Automation-ready backend, observable system

### Phase 2: Agent Orchestration ✅ (Complete)
**Deliverable:** Background agent processes tracked in DB

- Spawn agents without tmux
- Track PIDs and status in database
- Per-agent log files
- Agent lifecycle management

**Value:** Reliable agent execution, fully traceable

### Phase 3: TUI Foundation ✅ (Complete - Current)
**Deliverable:** Sidecar-style split-pane TUI

**Features:**
- Split-pane layout (sidebar + detail panel)
- Investigation list with status indicators
- Detail view showing full investigation info
- Real-time refresh (press 'r')
- Keyboard navigation (↑↓, j/k)
- Action bar with commands

**Value:** Professional interface, efficient workflow

### Phase 4: Interactive Actions 🚧 (Next 2-3 days)
**Deliverable:** Full investigation workflow in TUI

**Features:**
- **Approve checkpoint** (press 'a') → spawns agents, updates status
- **View logs** (press 'l') → stream logs in split view
- **Agent status panel** → show 4 agents with PIDs, progress
- **Confirmation modals** → prevent accidental actions
- **Error handling** → graceful failures with user feedback

**Value:** Complete workflow without leaving TUI

### Phase 5: Polish & Power Features 🔮 (Future)
**Deliverable:** Production-hardened, delightful experience

**Features:**
- **Tabs** for different views (All, Running, Waiting, Completed)
- **Search/filter** investigations by customer, status, classification
- **Keyboard shortcuts** for common actions (numbers for quick select)
- **Live log streaming** in split view
- **Notification badges** for new checkpoints
- **Theme toggle** (light/dark)
- **Help screen** (press '?')

**Value:** Power user efficiency, reduced cognitive load

---

## Development Timeline

### Week 1 (Completed)
- ✅ CLI foundation with all commands
- ✅ Agent orchestration without tmux
- ✅ Database schema updates
- ✅ Comprehensive logging system

### Week 2 (Completed)
- ✅ Bubbletea TUI foundation
- ✅ Split-pane sidecar layout
- ✅ Investigation list and detail views
- ✅ C1 design system implementation

### Week 3 (Current - Days 1-3)
- 🚧 Interactive approve action
- 🚧 Log streaming view
- 🚧 Agent status display
- 🚧 Error handling and confirmations

### Week 4 (Polish)
- 🔮 Tabs and advanced navigation
- 🔮 Search and filtering
- 🔮 Help documentation
- 🔮 User testing and feedback

---

## User Stories

### Primary Personas

**Sara (Senior TSE) - The Power User**
- Manages 5-10 tickets daily
- Keyboard shortcuts are second nature
- Wants maximum efficiency
- Needs to see everything at a glance

**Alex (Junior TSE) - The Learner**
- Handles 2-3 tickets daily
- Still learning the workflow
- Needs clear guidance on next steps
- Appreciates visible action options

### User Journeys

#### Journey 1: Approve Waiting Investigation
```
1. Sara opens TUI → sees 3 waiting investigations
2. ↓ to navigate to #5555
3. Detail panel shows "Press 'a' to approve checkpoint"
4. Presses 'a' → confirmation modal
5. Confirms → 4 agents spawn, status → running
6. Status bar updates: "3 waiting → 2 waiting, 1 running"
```

**Current:** ✅ Steps 1-3 complete, 🚧 Steps 4-6 in progress

#### Journey 2: Check Agent Progress
```
1. Alex sees #8484 running
2. ↓ to navigate to #8484
3. Detail panel shows agent statuses:
   🟡 Slack (PID 12345) - Searching channels
   🟡 Linear (PID 12346) - Finding issues
   🟢 Pylon (PID 12347) - Complete
   🟡 Codebase (PID 12348) - Reading files
4. Presses 'l' → log view opens
5. Watches real-time progress
```

**Current:** ✅ Steps 1-2 complete, 🚧 Steps 3-5 in progress

#### Journey 3: Quick Status Check
```
1. TSE opens TUI
2. Scans status bar: "13 investigations • 3 running • 9 waiting"
3. Scans sidebar for amber icons (🟡 = needs attention)
4. Sees at a glance what needs work
5. Presses 'r' to refresh, sees updates
```

**Current:** ✅ Fully implemented

---

## Technical Architecture

### Stack Justification

**Why Go + Bubbletea?**
- ✅ **Reliable:** Battle-tested framework (used by GitHub CLI, Charm tools)
- ✅ **Fast:** Compiled binary, instant startup
- ✅ **Maintainable:** Clean architecture (Elm Architecture pattern)
- ✅ **Cross-platform:** Runs anywhere Go runs
- ✅ **Modern:** Active community, great documentation

**Why CLI-first architecture?**
- ✅ **Testable:** CLI can be tested independently
- ✅ **Scriptable:** Automation-friendly
- ✅ **Observable:** Everything logs to files
- ✅ **Flexible:** TUI is just one interface (could add web UI later)

### Integration Points

```
┌──────────────────────────────────────────┐
│ Bubbletea TUI (Go)                       │
│ - User interface layer                   │
│ - Keyboard handling                      │
│ - Display logic                          │
└───────────────┬──────────────────────────┘
                │ exec.Command()
                ▼
┌──────────────────────────────────────────┐
│ CLI (Node.js)                            │
│ - Business logic                         │
│ - Agent orchestration                    │
│ - Database queries                       │
└───────────────┬──────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│ Backend Services                         │
│ - Express API (Phase 0)                  │
│ - SQLite database                        │
│ - Agent processes (Claude Code)          │
│ - Log files (JSON Lines)                 │
└──────────────────────────────────────────┘
```

---

## Presentation Flow

### For Stakeholders (10 min)

1. **Problem** (2 min)
   - Current pain points for TSEs
   - Time wasted context switching
   - Hard to see investigation status

2. **Solution** (3 min)
   - Live demo of TUI
   - Show split-pane layout
   - Navigate investigations
   - Real-time status updates

3. **Value** (2 min)
   - Efficiency gains
   - Better visibility
   - Professional look matching C1 brand

4. **Timeline** (2 min)
   - Current: MVP complete
   - Next week: Interactive actions
   - Week 4: Polish and user testing

5. **Q&A** (1 min)

### For TSEs (User Testing - 30 min)

1. **Introduction** (5 min)
   - Show current vs. new workflow
   - Explain keyboard shortcuts
   - Walk through features

2. **Guided Tasks** (15 min)
   - Task 1: Find investigation #5555
   - Task 2: Check agent status
   - Task 3: Refresh to see updates
   - Task 4: Try keyboard navigation

3. **Open Exploration** (5 min)
   - Let them try freely
   - Observe pain points
   - Note feature requests

4. **Feedback Collection** (5 min)
   - What do you love?
   - What's confusing?
   - What's missing?
   - Would you use this daily?

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| TSEs prefer web UI | High | Make TUI optional, not replacement |
| Keyboard shortcuts too complex | Medium | Provide help screen, start simple |
| Performance issues with many investigations | Low | Pagination, virtual scrolling |
| Terminal compatibility issues | Low | Test on all common terminals |
| Resistance to CLI tools | Medium | Demo efficiency gains, training session |

---

## Success Criteria

### MVP Launch (End of Week 3)
- [ ] All TSEs can install and run TUI
- [ ] Can view all investigations
- [ ] Can approve checkpoints from TUI
- [ ] Can view logs without leaving TUI
- [ ] Zero critical bugs

### 2 Weeks Post-Launch
- [ ] 80% daily active usage among TSEs
- [ ] Average time-to-approve checkpoint reduced by 30%
- [ ] NPS score >8
- [ ] <5 bug reports per week

### Long-term (1 Month)
- [ ] TUI becomes primary workflow for investigations
- [ ] Feature requests tracked and prioritized
- [ ] Performance metrics stable
- [ ] New TSEs onboarded successfully

---

## Next Steps

### Immediate (This Week)
1. Finish interactive approve action
2. Add log streaming view
3. Display agent statuses with progress
4. Add confirmation modals

### This Month
1. User testing with 3 TSEs
2. Incorporate feedback
3. Polish and bug fixes
4. Documentation

### Future
1. Advanced features (tabs, search, themes)
2. Integration with other tools
3. Mobile/remote access considerations

---

## Appendix

### Screenshots
- Current TUI (sidecar layout)
- Comparison with old system
- Desktop context (typical TSE workflow)

### Technical Docs
- CLI command reference
- Architecture diagrams
- Database schema
- Logging format

### User Feedback
- Initial reactions (from demos)
- Feature requests
- Pain points identified
