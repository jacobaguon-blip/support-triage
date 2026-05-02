# Support Triage TUI - Design Specification

## Visual Design System

### Layout Architecture

```
┌─ Title Bar (100% width) ──────────────────────────────────────┐
├─ Investigation List (30%) ─┬─ Tab Bar (70%) ───────────────────┤
│                            │                                   │
│  Scrollable list           │  Tab 1: Slack Agent               │
│  - Investigation cards     │  Tab 2: Linear Agent              │
│  - Status indicators       │  Tab 3: Pylon Agent               │
│  - Quick metadata          │  Tab 4: Codebase Agent            │
│                            │  Tab 5: Summary (split vertical)  │
│                            │  Tab 6: KB Article (V2)           │
│                            │                                   │
│                            ├─ Tab Content Area ────────────────┤
│                            │                                   │
│                            │  Dynamic content based on         │
│                            │  selected tab:                    │
│                            │  - Agent logs + findings          │
│                            │  - Summary + customer response    │
│                            │  - KB article creation            │
│                            │                                   │
├────────────────────────────┴───────────────────────────────────┤
│ Action Bar (keybindings + status)                             │
└────────────────────────────────────────────────────────────────┘
```

### Tab Content Layouts

#### Tabs 1-4: Agent Tabs (Slack, Linear, Pylon, Codebase)

```
┌─ Agent Tab Content ────────────────────────────────────────┐
│                                                            │
│  AGENT STATUS (Fixed header)                               │
│  ────────────────────────────────────────────────────────  │
│  Agent: [name]    Status: [🟡]    PID: [89234]            │
│  Started: [timestamp]    Runtime: [2m 45s]                 │
│                                                            │
├─ FINDINGS (40% height, scrollable) ────────────────────────┤
│                                                            │
│  📌 Finding #1: [Title]                                    │
│     • Detail line 1                                        │
│     • Detail line 2                                        │
│                                                            │
│  📌 Finding #2: [Title]                                    │
│     • Detail line 1                                        │
│                                                            │
├─ TERMINAL OUTPUT (60% height, scrollable) ─────────────────┤
│                                                            │
│  12:36:23 [INFO] Starting search...                        │
│  12:36:25 [TOOL] linear_search_issues(...)                 │
│  12:36:28 [INFO] Found 5 results                           │
│  ... (auto-scroll, last 50 lines)                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### Tab 5: Summary Tab (Split Vertically)

```
┌─ Summary Tab ──────────────────────────────────────────────┐
│                                                            │
│  INVESTIGATION SUMMARY (Top 60%)                           │
│  ────────────────────────────────────────────────────────  │
│  Ticket: #8484 - acme.com                                  │
│  Status: ✅ Complete (4/4 agents)                          │
│  Duration: 8m 32s                                          │
│                                                            │
│  🔍 ROOT CAUSE                                             │
│  [Aggregated root cause from all agents]                   │
│                                                            │
│  📋 KEY FINDINGS                                           │
│  💬 Slack: ...                                             │
│  📋 Linear: ...                                            │
│  🎫 Pylon: ...                                             │
│  💻 Codebase: ...                                          │
│                                                            │
├─ CUSTOMER RESPONSE (Bottom 40%) ───────────────────────────┤
│                                                            │
│  Hi [customer],                                            │
│                                                            │
│  We've identified the issue...                             │
│  [Non-technical customer-facing response]                  │
│                                                            │
│  [E] Edit • [C] Copy • [P] Post to Pylon                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### Tab 6: KB Article (V2 Feature)

```
┌─ KB Article Tab ───────────────────────────────────────────┐
│                                                            │
│  CREATE KNOWLEDGE BASE ARTICLE                             │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Suggested Title: [editable]                               │
│  Tags: [editable list]                                     │
│  Audience: ⦿ Internal ○ Customer ○ Both                    │
│                                                            │
│  [Generate Draft] button                                   │
│                                                            │
├─ ARTICLE PREVIEW (if generated) ───────────────────────────┤
│                                                            │
│  # [Title]                                                 │
│                                                            │
│  ## Problem                                                │
│  [Symptoms and description]                                │
│                                                            │
│  ## Root Cause                                             │
│  [Technical explanation]                                   │
│                                                            │
│  ## Resolution                                             │
│  [Step-by-step fix]                                        │
│                                                            │
│  ## Related Resources                                      │
│  - Linear issues                                           │
│  - Slack threads                                           │
│                                                            │
│  [E] Edit • [C] Copy • [X] Export as Markdown              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Component Structure (Go/Bubbletea)

### File Organization

```
tui/
├── main.go                 # Entry point, program initialization
├── model.go                # Main model struct, Update(), Init()
├── view.go                 # Main View() function, layout composition
├── styles.go               # Lipgloss style definitions
├── commands.go             # Tea commands (async operations)
├── messages.go             # Custom message types
└── components/
    ├── sidebar.go          # Investigation list sidebar
    ├── tabbar.go           # Tab switching component
    ├── agent_view.go       # Agent tab content (logs + findings)
    ├── summary_view.go     # Summary + customer response
    ├── kb_view.go          # KB article creation (V2)
    └── action_bar.go       # Bottom action bar
```

### Main Model Structure

```go
package main

type TabType int

const (
    TabSlack TabType = iota
    TabLinear
    TabPylon
    TabCodebase
    TabSummary
    TabKB
)

type model struct {
    // Layout state
    width  int
    height int

    // Data
    investigations []Investigation
    selectedIndex  int  // Which investigation in sidebar
    activeTab      TabType

    // Agent data
    agents map[int]map[string]*AgentState  // investigation_id -> agent_name -> state

    // UI components
    sidebar       sidebar
    tabBar        tabBar
    agentViews    map[string]*agentView
    summaryView   summaryView
    kbView        kbView
    actionBar     actionBar

    // State
    err error
}

type Investigation struct {
    ID             int
    CustomerName   string
    Classification string
    Status         string
    AgentStatuses  map[string]string  // agent_name -> status
    // ... other fields
}

type AgentState struct {
    Name      string
    Status    string  // pending, running, completed, error, checkpoint
    PID       int
    StartedAt time.Time
    Runtime   time.Duration
    Logs      []LogEntry
    Findings  []Finding
}

type LogEntry struct {
    Timestamp time.Time
    Level     string
    Message   string
}

type Finding struct {
    Title   string
    Details []string
}
```

### Tab Bar Component

```go
// components/tabbar.go
package components

type TabBar struct {
    tabs         []Tab
    activeIndex  int
    width        int
}

type Tab struct {
    Name   string
    Status string  // 🟢🟡🔵🔴○
    Icon   string  // 💬📋🎫💻
}

func (t TabBar) View() string {
    var tabs []string

    for i, tab := range t.tabs {
        var style lipgloss.Style
        if i == t.activeIndex {
            style = activeTabStyle
        } else {
            style = inactiveTabStyle
        }

        tabContent := fmt.Sprintf("%s %s %s", tab.Icon, tab.Name, tab.Status)
        tabs = append(tabs, style.Render(tabContent))
    }

    return lipgloss.JoinHorizontal(lipgloss.Top, tabs...)
}
```

### Agent View Component

```go
// components/agent_view.go
package components

type AgentView struct {
    agentName string
    state     *AgentState
    width     int
    height    int
    logScroll int
}

func (a AgentView) View() string {
    // Agent status header
    statusHeader := a.renderStatusHeader()

    // Findings (40% height)
    findingsHeight := int(float64(a.height) * 0.4)
    findings := a.renderFindings(findingsHeight)

    // Terminal output (60% height)
    terminalHeight := a.height - findingsHeight - 10
    terminal := a.renderTerminalOutput(terminalHeight)

    return lipgloss.JoinVertical(
        lipgloss.Left,
        statusHeader,
        findings,
        terminal,
    )
}

func (a AgentView) renderStatusHeader() string {
    status := fmt.Sprintf(
        "Agent: %s    Status: %s    PID: %d\nStarted: %s    Runtime: %s",
        a.agentName,
        getStatusIcon(a.state.Status),
        a.state.PID,
        a.state.StartedAt.Format("15:04:05"),
        a.state.Runtime.String(),
    )

    return sectionHeaderStyle.
        Width(a.width - 4).
        Render(status)
}

func (a AgentView) renderTerminalOutput(height int) string {
    header := sectionHeaderStyle.Render("TERMINAL OUTPUT")

    // Show last N logs that fit in height
    var logLines []string
    startIdx := max(0, len(a.state.Logs) - height + 5)

    for i := startIdx; i < len(a.state.Logs); i++ {
        log := a.state.Logs[i]
        logLine := fmt.Sprintf(
            "%s [%s] %s",
            log.Timestamp.Format("15:04:05"),
            log.Level,
            log.Message,
        )
        logLines = append(logLines, logLine)
    }

    content := strings.Join(logLines, "\n")

    return lipgloss.JoinVertical(
        lipgloss.Left,
        header,
        terminalBoxStyle.
            Width(a.width - 4).
            Height(height - 3).
            Render(content),
    )
}

func (a AgentView) renderFindings(height int) string {
    header := sectionHeaderStyle.Render("FINDINGS")

    var findingLines []string
    for _, finding := range a.state.Findings {
        findingLines = append(findingLines, fmt.Sprintf("📌 %s", finding.Title))
        for _, detail := range finding.Details {
            findingLines = append(findingLines, fmt.Sprintf("   • %s", detail))
        }
        findingLines = append(findingLines, "")
    }

    content := strings.Join(findingLines, "\n")

    return lipgloss.JoinVertical(
        lipgloss.Left,
        header,
        findingsBoxStyle.
            Width(a.width - 4).
            Height(height - 3).
            Render(content),
    )
}
```

### Summary View Component

```go
// components/summary_view.go
package components

type SummaryView struct {
    investigation *Investigation
    summary       *InvestigationSummary
    response      *CustomerResponse
    width         int
    height        int
    editingResponse bool
}

type InvestigationSummary struct {
    RootCause    string
    KeyFindings  map[string][]string  // agent_name -> findings
    Duration     time.Duration
    Status       string
}

type CustomerResponse struct {
    Content    string
    Edited     bool
    CopiedToPylon bool
}

func (s SummaryView) View() string {
    // Split vertically: 60% summary, 40% response
    summaryHeight := int(float64(s.height) * 0.6)
    responseHeight := s.height - summaryHeight - 5

    summarySection := s.renderSummary(summaryHeight)
    responseSection := s.renderResponse(responseHeight)

    return lipgloss.JoinVertical(
        lipgloss.Left,
        summarySection,
        lipgloss.NewStyle().
            BorderTop(true).
            BorderStyle(lipgloss.NormalBorder()).
            BorderForeground(borderColor).
            Width(s.width).
            Render(""),
        responseSection,
    )
}

func (s SummaryView) renderSummary(height int) string {
    header := sectionHeaderStyle.Render("INVESTIGATION SUMMARY")

    // Ticket info
    info := fmt.Sprintf(
        "Ticket: #%d - %s\nClassification: %s\nStatus: %s\nDuration: %s",
        s.investigation.ID,
        s.investigation.CustomerName,
        s.investigation.Classification,
        s.summary.Status,
        s.summary.Duration.String(),
    )

    // Root cause
    rootCause := lipgloss.JoinVertical(
        lipgloss.Left,
        "",
        sectionHeaderStyle.Render("🔍 ROOT CAUSE"),
        s.summary.RootCause,
    )

    // Key findings from each agent
    var findings []string
    findings = append(findings, "", sectionHeaderStyle.Render("📋 KEY FINDINGS"), "")

    for agentName, agentFindings := range s.summary.KeyFindings {
        icon := getAgentIcon(agentName)
        findings = append(findings, fmt.Sprintf("%s %s", icon, agentName))
        for _, finding := range agentFindings {
            findings = append(findings, fmt.Sprintf("   • %s", finding))
        }
        findings = append(findings, "")
    }

    content := strings.Join([]string{
        info,
        rootCause,
        strings.Join(findings, "\n"),
    }, "\n")

    return lipgloss.JoinVertical(
        lipgloss.Left,
        header,
        summaryBoxStyle.
            Width(s.width - 4).
            Height(height - 3).
            Render(content),
    )
}

func (s SummaryView) renderResponse(height int) string {
    header := sectionHeaderStyle.Render("CUSTOMER RESPONSE (Non-Technical)")

    var footer string
    if s.editingResponse {
        footer = "[Esc] Cancel editing • [Ctrl+S] Save"
    } else {
        footer = "[E] Edit • [C] Copy to clipboard • [P] Post to Pylon"
    }

    contentStyle := responseBoxStyle
    if s.editingResponse {
        contentStyle = contentStyle.BorderForeground(c1Primary).BorderStyle(lipgloss.ThickBorder())
    }

    return lipgloss.JoinVertical(
        lipgloss.Left,
        header,
        contentStyle.
            Width(s.width - 4).
            Height(height - 5).
            Render(s.response.Content),
        dimmedTextStyle.Render(footer),
    )
}

func getAgentIcon(agentName string) string {
    icons := map[string]string{
        "Slack":    "💬",
        "Linear":   "📋",
        "Pylon":    "🎫",
        "Codebase": "💻",
    }
    return icons[agentName]
}
```

## Data Loading Strategy

### CLI Integration Points

```go
// commands.go

// Load all investigations
func loadInvestigationsCmd() tea.Msg {
    cmd := exec.Command("/path/to/triage", "list", "--json")
    output, err := cmd.Output()
    if err != nil {
        return errMsg{err}
    }

    var investigations []Investigation
    json.Unmarshal(output, &investigations)

    return investigationsLoadedMsg{investigations}
}

// Load agent statuses for specific investigation
func loadAgentStatusesCmd(investigationID int) tea.Cmd {
    return func() tea.Msg {
        cmd := exec.Command("/path/to/triage", "status", strconv.Itoa(investigationID), "--json")
        output, err := cmd.Output()
        if err != nil {
            return errMsg{err}
        }

        var status struct {
            Investigation Investigation  `json:"investigation"`
            Agents        []AgentState  `json:"agents"`
        }
        json.Unmarshal(output, &status)

        return agentStatusesLoadedMsg{
            investigationID: investigationID,
            agents:          status.Agents,
        }
    }
}

// Stream agent logs (tail -f equivalent)
func streamAgentLogsCmd(investigationID int, agentName string) tea.Cmd {
    return func() tea.Msg {
        // Read last N lines from log file
        logPath := fmt.Sprintf(
            "investigations/%d/investigation-1/%s-agent.log",
            investigationID,
            strings.ToLower(agentName),
        )

        // Use tail -n 50 to get recent logs
        cmd := exec.Command("tail", "-n", "50", logPath)
        output, err := cmd.Output()
        if err != nil {
            return errMsg{err}
        }

        // Parse JSONL logs
        var logs []LogEntry
        scanner := bufio.NewScanner(bytes.NewReader(output))
        for scanner.Scan() {
            var entry LogEntry
            json.Unmarshal(scanner.Bytes(), &entry)
            logs = append(logs, entry)
        }

        return agentLogsLoadedMsg{
            investigationID: investigationID,
            agentName:       agentName,
            logs:            logs,
        }
    }
}

// Load findings from markdown file
func loadAgentFindingsCmd(investigationID int, agentName string) tea.Cmd {
    return func() tea.Msg {
        findingsPath := fmt.Sprintf(
            "investigations/%d/investigation-1/%s-findings.md",
            investigationID,
            strings.ToLower(agentName),
        )

        content, err := os.ReadFile(findingsPath)
        if err != nil {
            return errMsg{err}
        }

        // Parse markdown to extract findings
        findings := parseMarkdownFindings(string(content))

        return agentFindingsLoadedMsg{
            investigationID: investigationID,
            agentName:       agentName,
            findings:        findings,
        }
    }
}

// Approve checkpoint
func approveCheckpointCmd(investigationID int) tea.Cmd {
    return func() tea.Msg {
        cmd := exec.Command("/path/to/triage", "approve", strconv.Itoa(investigationID))
        err := cmd.Run()
        if err != nil {
            return errMsg{err}
        }

        return checkpointApprovedMsg{investigationID}
    }
}
```

### Auto-Refresh Strategy

```go
// Periodic refresh of running investigations
func (m model) Init() tea.Cmd {
    return tea.Batch(
        loadInvestigationsCmd,
        tickCmd(),  // Start periodic refresh
    )
}

func tickCmd() tea.Cmd {
    return tea.Tick(time.Second * 2, func(t time.Time) tea.Msg {
        return tickMsg(t)
    })
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tickMsg:
        // Refresh data for running investigations
        cmds := []tea.Cmd{tickCmd()}  // Queue next tick

        for _, inv := range m.investigations {
            if inv.Status == "running" {
                cmds = append(cmds,
                    loadAgentStatusesCmd(inv.ID),
                    // Stream logs for active tab
                    streamAgentLogsCmd(inv.ID, m.getActiveAgentName()),
                )
            }
        }

        return m, tea.Batch(cmds...)
    }
}
```

## Keybinding Implementation

```go
// Key handling in Update()
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        // Navigation
        case "j", "down":
            if m.selectedIndex < len(m.investigations) - 1 {
                m.selectedIndex++
                return m, m.loadInvestigationData()
            }

        case "k", "up":
            if m.selectedIndex > 0 {
                m.selectedIndex--
                return m, m.loadInvestigationData()
            }

        // Tab switching
        case "1":
            m.activeTab = TabSlack
            return m, nil
        case "2":
            m.activeTab = TabLinear
            return m, nil
        case "3":
            m.activeTab = TabPylon
            return m, nil
        case "4":
            m.activeTab = TabCodebase
            return m, nil
        case "5":
            m.activeTab = TabSummary
            return m, nil
        case "6":
            m.activeTab = TabKB
            return m, nil

        case "tab":
            m.activeTab = (m.activeTab + 1) % 6
            return m, nil

        // Actions
        case "a":
            // Approve checkpoint
            if m.hasCheckpoint() {
                return m, approveCheckpointCmd(m.getSelectedInvestigationID())
            }

        case "l":
            // Open full logs view (modal or split)
            m.showingLogs = true
            return m, nil

        case "r":
            // Refresh
            return m, loadInvestigationsCmd()

        case "n":
            // New investigation (open modal)
            m.showingNewModal = true
            return m, nil

        case "s":
            // Search
            m.showingSearch = true
            return m, nil

        // Summary tab actions
        case "c":
            if m.activeTab == TabSummary {
                // Copy to clipboard
                return m, copyToClipboardCmd(m.getCurrentContent())
            }

        case "e":
            if m.activeTab == TabSummary {
                // Edit response
                m.summaryView.editingResponse = true
                return m, nil
            }

        case "p":
            if m.activeTab == TabSummary {
                // Post to Pylon
                return m, postToPylonCmd(m.getSelectedInvestigationID())
            }

        case "q", "ctrl+c":
            return m, tea.Quit
        }
    }

    return m, nil
}
```

## Implementation Phases

### Phase 3A: Multi-Tab Foundation (2-3 days)
- [ ] Create tab bar component with 6 tabs
- [ ] Implement tab switching (1-6 keys, Tab key)
- [ ] Create agent view component structure
- [ ] Wire up agent status loading from CLI
- [ ] Test with static data

### Phase 3B: Agent Views (2-3 days)
- [ ] Implement log streaming for each agent
- [ ] Parse and display findings from markdown files
- [ ] Add agent status header (PID, runtime, status)
- [ ] Implement auto-scroll for logs
- [ ] Add checkpoint detection and highlighting

### Phase 3C: Summary Tab (2 days)
- [ ] Create vertical split layout (summary + response)
- [ ] Aggregate findings from all agents
- [ ] Generate customer response text
- [ ] Implement edit mode for response
- [ ] Add copy/post actions

### Phase 3D: Polish & Actions (1-2 days)
- [ ] Implement approve action (press 'a')
- [ ] Add full logs modal (press 'l')
- [ ] Create new investigation modal
- [ ] Add search functionality
- [ ] Error handling and loading states

### Phase 3E: V2 - KB Article (Future)
- [ ] Create KB article tab
- [ ] Implement article generation
- [ ] Add edit/export functionality
- [ ] Integration with Notion/Confluence

## Success Criteria

**Phase 3 Complete When:**
- ✅ 6 tabs working (4 agents + summary + KB placeholder)
- ✅ Agent logs streaming in real-time
- ✅ Findings displayed per agent
- ✅ Summary aggregates all agent findings
- ✅ Customer response editable and copyable
- ✅ All keyboard shortcuts functional
- ✅ Checkpoint approval working
- ✅ Multi-investigation support (switch between tickets)
- ✅ C1 design system applied throughout
- ✅ No performance issues with 10+ investigations

## Technical Notes

### Performance Considerations

1. **Log Streaming**: Only stream logs for visible investigation and active tab
2. **Findings Loading**: Lazy load findings when tab is selected
3. **Refresh Rate**: 2-second refresh for running investigations only
4. **Virtual Scrolling**: Implement if log history exceeds 10,000 lines

### Error Handling

```go
// Graceful degradation for missing data
if agentState == nil {
    return emptyAgentView.Render("Agent not yet started")
}

if len(logs) == 0 {
    return placeholderStyle.Render("No logs available yet")
}

if findingsFile missing {
    return placeholderStyle.Render("Findings will appear here when agent completes")
}
```

### Testing Strategy

1. **Unit tests**: Individual component rendering
2. **Integration tests**: CLI command execution
3. **Manual tests**:
   - Create investigation
   - Watch agents run
   - Approve checkpoints
   - Switch between tabs
   - Edit and copy response
   - Multiple concurrent investigations
