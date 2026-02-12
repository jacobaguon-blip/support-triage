package main

import (
	"time"

	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textarea"
	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
)

var skillOptions = []string{"troubleshoot", "feature-request", "kb-article", "research"}

// Checkpoint 1 editable field options
var classificationOptions = []string{"product_bug", "connector_bug", "feature_request"}
var productAreaOptions = []string{"Platform / UI", "Connectors", "Access Profiles", "Access Requests", "Access Reviews", "API / Terraform", "Automations", "Notifications", "Policies", "RBAC", "Thomas - AI Agent", "External Ticketing", "Other"}
var priorityOptions = []string{"P1", "P2", "P3", "P4"}

// TabType represents which tab is active
type TabType int

const (
	TabSlack TabType = iota
	TabLinear
	TabPylon
	TabCodebase
	TabSummary
	TabKB
)

// Investigation represents a support ticket investigation
type Investigation struct {
	ID                int               `json:"id"`
	CustomerName      string            `json:"customer_name"`
	Classification    string            `json:"classification"`
	ConnectorName     string            `json:"connector_name"`
	ProductArea       string            `json:"product_area"`
	Priority          string            `json:"priority"`
	Status            string            `json:"status"`
	CurrentCheckpoint string            `json:"current_checkpoint"`
	CreatedAt         string            `json:"created_at"`
	UpdatedAt         string            `json:"updated_at"`
	AgentStatuses     map[string]string // agent_name -> status
}

// AgentState represents the state of a single agent
type AgentState struct {
	Name       string
	Status     string // pending, running, completed, error, checkpoint
	PID        int
	StartedAt  time.Time
	Runtime    time.Duration
	Logs       []LogEntry
	Findings   []Finding
	LogFile    string
	FindingsFile string
}

// LogEntry represents a single log line
type LogEntry struct {
	Timestamp time.Time
	Level     string
	Message   string
}

// Finding represents a structured finding from an agent
type Finding struct {
	Title   string
	Details []string
}

// InvestigationSummary represents the aggregated summary
type InvestigationSummary struct {
	RootCause     string
	KeyFindings   map[string][]string // agent_name -> findings
	OpenQuestions []string
	NextSteps     []string
	Duration      string
	LoadedAt      time.Time
}

// CustomerResponse represents the customer-facing response
type CustomerResponse struct {
	Content       string
	LastEdited    time.Time
	EditedBy      string
	CopiedToClip  bool
	PostedToPylon bool
}

// TicketData from ticket-data.json
type TicketData struct {
	TicketID       int    `json:"ticket_id"`
	Title          string `json:"title"`
	Body           string `json:"body"`
	CustomerName   string `json:"customer_name"`
	Classification string `json:"classification"`
	ProductArea    string `json:"product_area"`
	Priority       string `json:"priority"`
	ConnectorName  *string `json:"connector_name"`
	PylonLink      string `json:"pylon_link"`
}

// model is the main application state
type model struct {
	// Layout dimensions
	width  int
	height int

	// Data
	investigations []Investigation
	selectedIndex  int // Which investigation in sidebar is selected
	activeTab      TabType

	// Agent data (investigation_id -> agent_name -> state)
	agents map[int]map[string]*AgentState

	// Summary data (investigation_id -> summary/response)
	summaries        map[int]*InvestigationSummary
	customerResponses map[int]*CustomerResponse

	// UI components
	findingsViewport  viewport.Model
	terminalViewport  viewport.Model
	summaryViewport   viewport.Model
	responseViewport  viewport.Model
	responseTextarea  textarea.Model
	spinner           spinner.Model

	// State
	err               error
	loading           bool
	ready             bool // Viewports ready
	editingResponse   bool
	showConfirmDialog bool
	confirmAction     string // "post" or "save"
	confirmMessage    string

	// Phase 1 combined findings (investigation_id -> content)
	phase1Findings map[int]string

	// Checkpoint 1 review state
	ticketData        map[int]*TicketData
	cp1FocusField     int    // 0=classification, 1=productArea, 2=priority
	cp1DropdownOpen   bool
	cp1DropdownIndex  int
	cp1Classification string // Editable copy
	cp1ProductArea    string // Editable copy
	cp1Priority       string // Editable copy
	cp1Loaded         int    // Investigation ID that cp1 fields are loaded for

	// Debug overlay
	showDebugOverlay bool
	buildVersion     string
	buildTime        string

	// Create form
	showCreateForm     bool
	createTicketInput  textinput.Model
	createContextArea  textarea.Model
	createSkill        int // index into skillOptions
	createFocusField   int // 0=ticket, 1=skill, 2=context
	createError        string
	creatingInProgress bool
}

// Helper methods
func (m model) getSelectedInvestigation() *Investigation {
	if len(m.investigations) == 0 || m.selectedIndex >= len(m.investigations) {
		return nil
	}
	return &m.investigations[m.selectedIndex]
}

func (m model) getSelectedInvestigationID() int {
	inv := m.getSelectedInvestigation()
	if inv == nil {
		return 0
	}
	return inv.ID
}

func (m model) getActiveAgentName() string {
	switch m.activeTab {
	case TabSlack:
		return "Slack"
	case TabLinear:
		return "Linear"
	case TabPylon:
		return "Pylon"
	case TabCodebase:
		return "Codebase"
	default:
		return ""
	}
}

func (m model) getAgentState(investigationID int, agentName string) *AgentState {
	if m.agents == nil {
		return nil
	}
	if m.agents[investigationID] == nil {
		return nil
	}
	return m.agents[investigationID][agentName]
}

func (m model) hasCheckpoint() bool {
	inv := m.getSelectedInvestigation()
	if inv == nil {
		return false
	}
	return inv.Status == "waiting" && inv.CurrentCheckpoint != ""
}

func (m model) getSummary(investigationID int) *InvestigationSummary {
	if m.summaries == nil {
		return nil
	}
	return m.summaries[investigationID]
}

func (m model) getCustomerResponse(investigationID int) *CustomerResponse {
	if m.customerResponses == nil {
		return nil
	}
	return m.customerResponses[investigationID]
}
