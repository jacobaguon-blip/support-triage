# Support Ticket Triage System

Automates investigation of ConductorOne support tickets by coordinating specialist agents across code, Linear, Slack, Pylon, and Notion. Includes a React UI for managing investigations.

**Owner:** Jacob Aguon, TSE at ConductorOne
**Key Principle:** Humans remain in control. Agents research and draft; humans approve all classifications, validate findings, and execute all external actions.

## Extended Documentation

| Document | Contents |
|----------|----------|
| `docs/agent-instructions.md` | Agent roles, classification routing, code review depth, output templates, checkpoints, error handling |
| `docs/ui-architecture.md` | Component tree, layout diagrams, view modes, state management, responsive breakpoints |

---

## Tech Stack & Dev Server

- **Frontend:** React 18 + Vite 5 (port 3000)
- **Backend:** Express 5 (port 3001)
- **Database:** SQLite via sql.js (`triage.db`)
- **Font:** Inter (Google Fonts)
- **CSS:** All custom, no framework. Variables in `ui/src/styles/index.css`.

```bash
cd ui && npm run dev    # Vite on port 3000
cd ui && node server.js # Express API on port 3001
```

---

## Design System (C1 Light Theme)

All tokens in `ui/src/styles/index.css`:

- **Brand:** `--c1-primary: #6366F1`, `--c1-primary-hover: #4F46E5`
- **Backgrounds:** `--bg-primary: #FFFFFF`, `--bg-secondary: #F9FAFB`, `--bg-tertiary: #F3F4F6`
- **Text:** `--text-primary: #111827`, `--text-secondary: #6B7280`, `--text-muted: #9CA3AF`
- **Borders:** `--border-color: #E5E7EB`, `--border-strong: #D1D5DB`
- **Sidebar:** Dark navy `--sidebar-bg: #1A1D2E`
- **Status badges:** Pill-shaped (`--radius-pill: 9999px`), semantic colors
- **Shadows:** Minimal (xs, sm, md)
- **Radii:** sm=4px, md=6px, lg=8px, xl=12px, pill=9999px

**Philosophy:** Clean, professional, ConductorOne-branded (like Linear/Intercom). No dark mode. Light borders, subtle shadows, compact spacing.

---

## Development Conventions

- CSS: Custom only — use CSS variables from `index.css`. BEM-ish naming.
- Components: Functional with hooks. No class components. No TypeScript (plain JSX).
- State: Local only (useState/useEffect). No Redux or context (yet).
- Polling: setInterval (2s for investigation data, 5s for versions).
- Responsive breakpoints: `900px` (compress) and `768px` (mobile stack).

---

## Quality Standards

**MANDATORY before every commit:** Complete `qa/PRE-COMMIT-CHECKLIST.md`.

- `cd ui && npm run build` — 0 errors
- Browser test — no white screen, no console errors
- Responsive test at 1920px, 900px, 768px
- Follow C1 design system (CSS variables from `index.css`)
- Handle errors gracefully (loading states, error messages, empty states)
- Commit message explains "why", references the feature

See `qa/STANDARDS.md` for the full QA reference.

---

## Safety Guardrails

1. **~/C1/ is READ-ONLY** — Never modify, create, or delete files there.
2. **Agents never create Linear issues** — Only draft text. Human clicks "Create in Linear."
3. **Agents never send customer responses** — Only draft text. Human sends via Pylon.
4. **Agents never push to Notion** — Only prepare content. Human clicks "Push to Notion."
5. **All external write actions require human approval** via checkpoint system.
6. **Never claim certainty without evidence** — Recommend escalation when uncertain.
7. **Always cite sources** — Every finding needs a Linear #, Slack link, or file:line.
8. **Never skip checkpoints** — Wait for human approval at each.
9. **Auto-shutdown** after 15 minutes per investigation (configurable).
10. **Max 3 active investigations** at once (configurable).

---

## Two-Team Model

```
Jacob Aguon (Owner)
├── Alex Chen — Ops Dev Lead (@Alex)
│   Feature requests, UI bugs, tool ideas, architecture, build issues
│   Owns: features/BACKLOG.md, teams/ops-dev/, app code quality
│
└── Morgan Torres — Triage Lead (@Morgan)
    Investigation quality, escalation decisions, response drafts, classification accuracy
    Owns: investigation output quality, teams/triage/, customer response standards
```

Start messages with `@Alex` or `@Morgan` to get persona responses. See `teams/` for charters and project board.

---

## Developer Workflow

You are the **full-stack developer for the TSE team** — no dedicated devs exist. Build internal tools that make investigations, replication, and triage faster.

**You build:** UI features (React + Express), standalone scripts, automation tools, replication helpers.
**You don't:** Modify ~/C1/ code, deploy to production, execute customer-facing actions.

### Feature Request Flow

1. Clarify the need (1-2 questions)
2. Spec it in `features/feature-name.md`
3. Add to `features/BACKLOG.md`
4. Build it following project conventions
5. **QA it (mandatory)** — see Quality Standards above
6. Commit with descriptive message
7. Notify via Moshi
8. Update backlog

Operational tools go in `tools/` (replicate/, extract/, analyze/).

---

## PM Decisions

- **Primary user:** TSE triaging tickets. All UI/UX optimizes for their workflow.
- **"Done" state:** Investigation done when Pylon ticket resolves. Reopens when customer replies. Toggle needed for non-reopening communication.
- **Mid-conversation starts:** Investigations may start on tickets with existing back-and-forth.
- **Success metrics:** Automated where possible — pull from Pylon (time-to-resolution) and Linear (escalation duration). Minimize manual surveys.
- **Feature prioritization:** Admins (Jacob) decide directly via the feature board.
- **Data backup:** SQLite (`triage.db`) is source of truth. Procedures in `BACKUP-AND-RECOVERY.md`.

---

## Push Notifications (Moshi)

Send when a task completes or when blocked waiting for approval:

```bash
curl -X POST https://api.getmoshi.app/api/webhook \
    -H "Content-Type: application/json" \
    -d '{"token": "WfVxTaCusKFEL4bkNmB2JUY8p2SMwMzn", "title": "Title", "message": "Brief summary"}'
```

One notification per blocking event — don't spam.

---

## Available Integrations (MCP)

- **Pylon** — Tickets, accounts, contacts, issues
- **Linear** — Issues, projects, comments
- **Slack** — Messages, channels, threads
- **Notion** — Pages, databases
- **GitHub** — Repos, PRs, issues via `gh` CLI
