package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textarea"
	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
)

// Build-time variables injected via ldflags
var (
	buildVersion = "dev"
	buildTime    = "unknown"
)

// Keymap
var keys = struct {
	Quit     key.Binding
	Up       key.Binding
	Down     key.Binding
	Refresh  key.Binding
	Approve  key.Binding
	Logs     key.Binding
	Tab1     key.Binding
	Tab2     key.Binding
	Tab3     key.Binding
	Tab4     key.Binding
	Tab5     key.Binding
	Tab6     key.Binding
	TabNext  key.Binding
	PageUp   key.Binding
	PageDown key.Binding
	Edit     key.Binding
	Copy     key.Binding
	Post     key.Binding
	Save     key.Binding
	Escape   key.Binding
	Enter    key.Binding
	Yes      key.Binding
	No       key.Binding
	Debug    key.Binding
	New      key.Binding
}{
	Quit:     key.NewBinding(key.WithKeys("q", "ctrl+c")),
	Up:       key.NewBinding(key.WithKeys("up", "k")),
	Down:     key.NewBinding(key.WithKeys("down", "j")),
	Refresh:  key.NewBinding(key.WithKeys("r")),
	Approve:  key.NewBinding(key.WithKeys("a")),
	Logs:     key.NewBinding(key.WithKeys("l")),
	Tab1:     key.NewBinding(key.WithKeys("1")),
	Tab2:     key.NewBinding(key.WithKeys("2")),
	Tab3:     key.NewBinding(key.WithKeys("3")),
	Tab4:     key.NewBinding(key.WithKeys("4")),
	Tab5:     key.NewBinding(key.WithKeys("5")),
	Tab6:     key.NewBinding(key.WithKeys("6")),
	TabNext:  key.NewBinding(key.WithKeys("tab")),
	PageUp:   key.NewBinding(key.WithKeys("pgup")),
	PageDown: key.NewBinding(key.WithKeys("pgdown")),
	Edit:     key.NewBinding(key.WithKeys("e")),
	Copy:     key.NewBinding(key.WithKeys("c")),
	Post:     key.NewBinding(key.WithKeys("p")),
	Save:     key.NewBinding(key.WithKeys("ctrl+s")),
	Escape:   key.NewBinding(key.WithKeys("esc")),
	Enter:    key.NewBinding(key.WithKeys("enter", "kpenter")),
	Yes:      key.NewBinding(key.WithKeys("y")),
	No:       key.NewBinding(key.WithKeys("n")),
	Debug:    key.NewBinding(key.WithKeys("?")),
	New:      key.NewBinding(key.WithKeys("n")),
}

func initialModel() model {
	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = spinnerStyle

	ta := textarea.New()
	ta.Placeholder = "Customer response..."
	ta.Focus()

	ti := textinput.New()
	ti.Placeholder = "Pylon ticket ID (e.g., 8314)"
	ti.CharLimit = 10

	ca := textarea.New()
	ca.Placeholder = "Optional context or file paths..."
	ca.SetHeight(4)

	return model{
		agents:            make(map[int]map[string]*AgentState),
		summaries:         make(map[int]*InvestigationSummary),
		customerResponses: make(map[int]*CustomerResponse),
		spinner:           s,
		responseTextarea:  ta,
		loading:           true,
		showDebugOverlay:  os.Getenv("TUI_DEBUG") == "1",
		buildVersion:      buildVersion,
		buildTime:         buildTime,
		createTicketInput: ti,
		createContextArea: ca,
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		loadInvestigationsCmd(),
		tickCmd(),     // Start periodic refresh
		m.spinner.Tick, // Start spinner animation
	)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

		// Initialize viewports if not ready
		if !m.ready {
			// Calculate viewport dimensions
			sidebarWidth := m.width / 3
			if sidebarWidth < 40 {
				sidebarWidth = 40
			}
			contentWidth := m.width - sidebarWidth - 6
			contentHeight := m.height - 10

			findingsHeight := int(float64(contentHeight) * 0.4)
			terminalHeight := contentHeight - findingsHeight - 8

			m.findingsViewport = viewport.New(contentWidth-8, findingsHeight-4)
			m.terminalViewport = viewport.New(contentWidth-8, terminalHeight-4)
			m.ready = true
		}
		return m, nil

	case investigationsLoadedMsg:
		m.investigations = msg.investigations
		m.loading = false

		// Load agent data for selected investigation if available
		if len(m.investigations) > 0 && m.selectedIndex < len(m.investigations) {
			inv := m.investigations[m.selectedIndex]
			return m, tea.Batch(
				loadAgentStatusesCmd(inv.ID),
				streamAgentLogsCmd(inv.ID, m.getActiveAgentName()),
				loadAgentFindingsCmd(inv.ID, m.getActiveAgentName()),
			)
		}
		return m, nil

	case spinner.TickMsg:
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd

	case summaryLoadedMsg:
		if msg.summary != nil {
			m.summaries[msg.investigationID] = msg.summary
		}
		return m, nil

	case customerResponseLoadedMsg:
		if msg.response != nil {
			m.customerResponses[msg.investigationID] = msg.response
		}
		return m, nil

	case responseCopiedMsg:
		inv := m.getSelectedInvestigation()
		if inv != nil && m.customerResponses[inv.ID] != nil {
			m.customerResponses[inv.ID].CopiedToClip = true
		}
		return m, nil

	case responseSavedMsg:
		inv := m.getSelectedInvestigation()
		if inv != nil && m.customerResponses[inv.ID] != nil {
			// Update the response with saved content
			m.customerResponses[inv.ID].Content = m.responseTextarea.Value()
			m.customerResponses[inv.ID].LastEdited = time.Now()
		}
		m.editingResponse = false
		return m, nil

	case responsePostedMsg:
		inv := m.getSelectedInvestigation()
		if inv != nil && m.customerResponses[inv.ID] != nil {
			m.customerResponses[inv.ID].PostedToPylon = true
		}
		m.showConfirmDialog = false
		return m, nil

	case agentStatusesLoadedMsg:
		if m.agents[msg.investigationID] == nil {
			m.agents[msg.investigationID] = make(map[string]*AgentState)
		}
		for name, state := range msg.agents {
			m.agents[msg.investigationID][name] = state
		}

		// Update investigation agent statuses for tab bar
		for i := range m.investigations {
			if m.investigations[i].ID == msg.investigationID {
				for name, state := range msg.agents {
					m.investigations[i].AgentStatuses[name] = state.Status
				}
				break
			}
		}
		return m, nil

	case agentLogsLoadedMsg:
		if m.agents[msg.investigationID] != nil && m.agents[msg.investigationID][msg.agentName] != nil {
			m.agents[msg.investigationID][msg.agentName].Logs = msg.logs
		}
		return m, nil

	case agentFindingsLoadedMsg:
		if m.agents[msg.investigationID] != nil && m.agents[msg.investigationID][msg.agentName] != nil {
			m.agents[msg.investigationID][msg.agentName].Findings = msg.findings
		}
		return m, nil

	case checkpointApprovedMsg:
		// Reload investigation data after approval
		return m, tea.Batch(
			loadInvestigationsCmd(),
			loadAgentStatusesCmd(msg.investigationID),
		)

	case investigationCreatedMsg:
		m.creatingInProgress = false
		if msg.err != nil {
			m.createError = msg.err.Error()
			return m, nil
		}
		// Success: close form, reload investigations
		m.showCreateForm = false
		m.createError = ""
		return m, loadInvestigationsCmd()

	case tickMsg:
		// Periodic refresh for running investigations
		var cmds []tea.Cmd
		cmds = append(cmds, tickCmd()) // Queue next tick

		for _, inv := range m.investigations {
			if inv.Status == "running" {
				cmds = append(cmds,
					loadAgentStatusesCmd(inv.ID),
				)

				// If this is the selected investigation, refresh logs for active tab
				if inv.ID == m.getSelectedInvestigationID() {
					agentName := m.getActiveAgentName()
					if agentName != "" {
						cmds = append(cmds,
							streamAgentLogsCmd(inv.ID, agentName),
							loadAgentFindingsCmd(inv.ID, agentName),
						)
					}
				}
			}
		}

		return m, tea.Batch(cmds...)

	case errMsg:
		m.err = msg.err
		return m, nil

	case tea.KeyMsg:
		// Handle confirmation dialog
		if m.showConfirmDialog {
			switch {
			case key.Matches(msg, keys.Yes), key.Matches(msg, keys.Enter):
				inv := m.getSelectedInvestigation()
				if inv != nil && m.confirmAction == "post" {
					response := m.getCustomerResponse(inv.ID)
					if response != nil {
						return m, postToPylonCmd(inv.ID, response.Content)
					}
				} else if inv != nil && m.confirmAction == "save" {
					return m, saveCustomerResponseCmd(inv.ID, m.responseTextarea.Value())
				}
				m.showConfirmDialog = false
				return m, nil

			case key.Matches(msg, keys.No), key.Matches(msg, keys.Escape):
				m.showConfirmDialog = false
				return m, nil
			}
			return m, nil
		}

		// Handle create form input
		if m.showCreateForm && !m.creatingInProgress {
			switch {
			case key.Matches(msg, keys.Escape):
				m.showCreateForm = false
				m.createError = ""
				return m, nil

			case key.Matches(msg, keys.Save):
				// Ctrl+S submits
				return m.submitCreateForm()

			case key.Matches(msg, keys.Enter):
				if m.createFocusField == 1 {
					// Cycle skill option when on skill field
					m.createSkill = (m.createSkill + 1) % len(skillOptions)
					return m, nil
				}
				// Submit from ticket or context field
				return m.submitCreateForm()

			default:
				keyStr := msg.String()
				if keyStr == "tab" || keyStr == "shift+tab" {
					// Cycle focus between fields
					if keyStr == "tab" {
						m.createFocusField = (m.createFocusField + 1) % 3
					} else {
						m.createFocusField = (m.createFocusField + 2) % 3
					}
					// Update focus state
					if m.createFocusField == 0 {
						m.createTicketInput.Focus()
						m.createContextArea.Blur()
					} else if m.createFocusField == 1 {
						m.createTicketInput.Blur()
						m.createContextArea.Blur()
					} else {
						m.createTicketInput.Blur()
						m.createContextArea.Focus()
					}
					return m, nil
				}

				// Route input to focused field
				if m.createFocusField == 0 {
					m.createTicketInput, cmd = m.createTicketInput.Update(msg)
					return m, cmd
				} else if m.createFocusField == 1 {
					// Skill field: space or arrows cycle options
					if keyStr == " " || keyStr == "left" || keyStr == "right" {
						m.createSkill = (m.createSkill + 1) % len(skillOptions)
					}
					return m, nil
				} else {
					m.createContextArea, cmd = m.createContextArea.Update(msg)
					return m, cmd
				}
			}
		}

		// Handle textarea input when editing
		if m.editingResponse {
			switch {
			case key.Matches(msg, keys.Save):
				// Show save confirmation
				m.showConfirmDialog = true
				m.confirmAction = "save"
				m.confirmMessage = "Save changes to customer response?"
				return m, nil

			case key.Matches(msg, keys.Escape):
				// Cancel editing
				m.editingResponse = false
				return m, nil

			default:
				// Pass all other keys to textarea
				var cmd tea.Cmd
				m.responseTextarea, cmd = m.responseTextarea.Update(msg)
				return m, cmd
			}
		}

		// Normal keyboard handling
		switch {
		case key.Matches(msg, keys.Quit):
			return m, tea.Quit

		case key.Matches(msg, keys.Up):
			if m.selectedIndex > 0 {
				m.selectedIndex--
				// Load data for newly selected investigation
				inv := m.getSelectedInvestigation()
				if inv != nil {
					return m, tea.Batch(
						loadAgentStatusesCmd(inv.ID),
						streamAgentLogsCmd(inv.ID, m.getActiveAgentName()),
						loadAgentFindingsCmd(inv.ID, m.getActiveAgentName()),
					)
				}
			}
			return m, nil

		case key.Matches(msg, keys.Down):
			if m.selectedIndex < len(m.investigations)-1 {
				m.selectedIndex++
				// Load data for newly selected investigation
				inv := m.getSelectedInvestigation()
				if inv != nil {
					return m, tea.Batch(
						loadAgentStatusesCmd(inv.ID),
						streamAgentLogsCmd(inv.ID, m.getActiveAgentName()),
						loadAgentFindingsCmd(inv.ID, m.getActiveAgentName()),
					)
				}
			}
			return m, nil

		case key.Matches(msg, keys.Refresh):
			return m, loadInvestigationsCmd()

		case key.Matches(msg, keys.Approve):
			if m.hasCheckpoint() {
				inv := m.getSelectedInvestigation()
				return m, approveCheckpointCmd(inv.ID, inv.CurrentCheckpoint)
			}
			return m, nil

		case key.Matches(msg, keys.Tab1):
			m.activeTab = TabSlack
			// Load logs and findings for this agent
			inv := m.getSelectedInvestigation()
			if inv != nil {
				return m, tea.Batch(
					streamAgentLogsCmd(inv.ID, "Slack"),
					loadAgentFindingsCmd(inv.ID, "Slack"),
				)
			}
			return m, nil

		case key.Matches(msg, keys.Tab2):
			m.activeTab = TabLinear
			inv := m.getSelectedInvestigation()
			if inv != nil {
				return m, tea.Batch(
					streamAgentLogsCmd(inv.ID, "Linear"),
					loadAgentFindingsCmd(inv.ID, "Linear"),
				)
			}
			return m, nil

		case key.Matches(msg, keys.Tab3):
			m.activeTab = TabPylon
			inv := m.getSelectedInvestigation()
			if inv != nil {
				return m, tea.Batch(
					streamAgentLogsCmd(inv.ID, "Pylon"),
					loadAgentFindingsCmd(inv.ID, "Pylon"),
				)
			}
			return m, nil

		case key.Matches(msg, keys.Tab4):
			m.activeTab = TabCodebase
			inv := m.getSelectedInvestigation()
			if inv != nil {
				return m, tea.Batch(
					streamAgentLogsCmd(inv.ID, "Codebase"),
					loadAgentFindingsCmd(inv.ID, "Codebase"),
				)
			}
			return m, nil

		case key.Matches(msg, keys.Tab5):
			m.activeTab = TabSummary
			// Load summary and customer response
			inv := m.getSelectedInvestigation()
			if inv != nil {
				return m, tea.Batch(
					loadSummaryCmd(inv.ID),
					loadCustomerResponseCmd(inv.ID),
				)
			}
			return m, nil

		// case key.Matches(msg, keys.Tab6):
		// 	m.activeTab = TabKB
		// 	return m, nil
		// NOTE: Tab 6 (KB Article) disabled - V2 feature

		case key.Matches(msg, keys.TabNext):
			// Cycle through tabs (only 5 tabs: 0-4)
			m.activeTab = (m.activeTab + 1) % 5

			// Load data based on which tab we switched to
			inv := m.getSelectedInvestigation()
			if inv != nil {
				if m.activeTab >= TabSlack && m.activeTab <= TabCodebase {
					// Agent tabs: load logs and findings
					agentName := m.getActiveAgentName()
					return m, tea.Batch(
						streamAgentLogsCmd(inv.ID, agentName),
						loadAgentFindingsCmd(inv.ID, agentName),
					)
				} else if m.activeTab == TabSummary {
					// Summary tab: load summary and response
					return m, tea.Batch(
						loadSummaryCmd(inv.ID),
						loadCustomerResponseCmd(inv.ID),
					)
				}
			}
			return m, nil

		case key.Matches(msg, keys.PageUp):
			// Scroll terminal viewport up
			if m.ready {
				m.terminalViewport.LineUp(5)
			}
			return m, nil

		case key.Matches(msg, keys.PageDown):
			// Scroll terminal viewport down
			if m.ready {
				m.terminalViewport.LineDown(5)
			}
			return m, nil

		case key.Matches(msg, keys.Edit):
			// Edit customer response (only on Summary tab)
			if m.activeTab == TabSummary && !m.editingResponse {
				inv := m.getSelectedInvestigation()
				if inv != nil {
					response := m.getCustomerResponse(inv.ID)
					if response != nil {
						m.editingResponse = true
						m.responseTextarea.SetValue(response.Content)
						m.responseTextarea.Focus()
					}
				}
			}
			return m, nil

		case key.Matches(msg, keys.Copy):
			// Copy customer response to clipboard (only on Summary tab)
			if m.activeTab == TabSummary {
				inv := m.getSelectedInvestigation()
				if inv != nil {
					response := m.getCustomerResponse(inv.ID)
					if response != nil {
						return m, copyToClipboardCmd(response.Content)
					}
				}
			}
			return m, nil

		case key.Matches(msg, keys.Post):
			// Show confirmation before posting to Pylon
			if m.activeTab == TabSummary {
				inv := m.getSelectedInvestigation()
				if inv != nil && m.customerResponses[inv.ID] != nil {
					if !m.customerResponses[inv.ID].PostedToPylon {
						m.showConfirmDialog = true
						m.confirmAction = "post"
						m.confirmMessage = fmt.Sprintf("Post response to Pylon ticket #%d?", inv.ID)
					}
				}
			}
			return m, nil

		case key.Matches(msg, keys.New):
			m.showCreateForm = true
			m.createFocusField = 0
			m.createTicketInput.SetValue("")
			m.createContextArea.SetValue("")
			m.createSkill = 0
			m.createError = ""
			m.creatingInProgress = false
			cmd = m.createTicketInput.Focus()
			return m, cmd

		case key.Matches(msg, keys.Debug):
			m.showDebugOverlay = !m.showDebugOverlay
			return m, nil
		}
	}

	return m, nil
}

func (m model) submitCreateForm() (tea.Model, tea.Cmd) {
	ticketID := strings.TrimSpace(m.createTicketInput.Value())

	if ticketID == "" {
		m.createError = "Ticket ID is required"
		return m, nil
	}

	if _, err := strconv.Atoi(ticketID); err != nil {
		m.createError = "Ticket ID must be a number"
		return m, nil
	}

	m.createError = ""
	m.creatingInProgress = true

	skill := skillOptions[m.createSkill]
	context := strings.TrimSpace(m.createContextArea.Value())

	return m, createInvestigationCmd(ticketID, skill, context)
}

func main() {
	p := tea.NewProgram(
		initialModel(),
		tea.WithAltScreen(),
	)

	if _, err := p.Run(); err != nil {
		fmt.Printf("Error: %v", err)
		os.Exit(1)
	}
}
