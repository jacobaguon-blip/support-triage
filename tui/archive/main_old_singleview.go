package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// C1 Design System Colors (Light Theme)
var (
	c1Primary      = lipgloss.Color("#6366F1")
	c1PrimaryHover = lipgloss.Color("#4F46E5")

	bgPrimary   = lipgloss.Color("#FFFFFF")
	bgSecondary = lipgloss.Color("#F9FAFB")
	bgTertiary  = lipgloss.Color("#F3F4F6")

	textPrimary   = lipgloss.Color("#111827")
	textSecondary = lipgloss.Color("#6B7280")
	textMuted     = lipgloss.Color("#9CA3AF")

	borderColor  = lipgloss.Color("#E5E7EB")
	borderStrong = lipgloss.Color("#D1D5DB")

	statusRunning   = lipgloss.Color("#F59E0B")
	statusWaiting   = lipgloss.Color("#3B82F6")
	statusCompleted = lipgloss.Color("#10B981")
	statusError     = lipgloss.Color("#EF4444")
)

// Styles
var (
	// Title bar (top)
	titleStyle = lipgloss.NewStyle().
			Foreground(c1Primary).
			Bold(true).
			Padding(0, 2).
			Background(bgSecondary)

	// Tab styles
	activeTabStyle = lipgloss.NewStyle().
			Foreground(bgPrimary).
			Background(c1Primary).
			Padding(0, 2).
			Bold(true)

	inactiveTabStyle = lipgloss.NewStyle().
				Foreground(textSecondary).
				Background(bgTertiary).
				Padding(0, 2)

	// Sidebar (left panel)
	sidebarStyle = lipgloss.NewStyle().
			BorderStyle(lipgloss.RoundedBorder()).
			BorderForeground(borderColor).
			Padding(1, 2).
			Background(bgPrimary)

	// Detail panel (right)
	detailPanelStyle = lipgloss.NewStyle().
				BorderStyle(lipgloss.RoundedBorder()).
				BorderForeground(borderColor).
				Padding(1, 2).
				Background(bgPrimary)

	// List item styles
	selectedItemStyle = lipgloss.NewStyle().
				Foreground(c1Primary).
				Bold(true).
				Background(bgTertiary).
				Padding(0, 1)

	normalItemStyle = lipgloss.NewStyle().
			Foreground(textPrimary).
			Padding(0, 1)

	dimmedTextStyle = lipgloss.NewStyle().
			Foreground(textMuted)

	// Action bar (bottom)
	actionBarStyle = lipgloss.NewStyle().
			Foreground(textSecondary).
			Background(bgSecondary).
			Padding(0, 2)

	// Section headers
	sectionHeaderStyle = lipgloss.NewStyle().
				Foreground(textPrimary).
				Bold(true).
				Padding(0, 0, 1, 0)
)

type Investigation struct {
	ID                int    `json:"id"`
	CustomerName      string `json:"customer_name"`
	Classification    string `json:"classification"`
	ConnectorName     string `json:"connector_name"`
	ProductArea       string `json:"product_area"`
	Priority          string `json:"priority"`
	Status            string `json:"status"`
	CurrentCheckpoint string `json:"current_checkpoint"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
}

type model struct {
	investigations []Investigation
	cursor         int
	width          int
	height         int
	err            error
}

type investigationsLoadedMsg struct {
	investigations []Investigation
}

type errMsg struct{ err error }

func (e errMsg) Error() string { return e.err.Error() }

// Keymap
var keys = struct {
	Quit    key.Binding
	Up      key.Binding
	Down    key.Binding
	Refresh key.Binding
	Approve key.Binding
	Logs    key.Binding
}{
	Quit: key.NewBinding(key.WithKeys("q", "ctrl+c")),
	Up:   key.NewBinding(key.WithKeys("up", "k")),
	Down: key.NewBinding(key.WithKeys("down", "j")),
	Refresh: key.NewBinding(key.WithKeys("r")),
	Approve: key.NewBinding(key.WithKeys("a")),
	Logs:    key.NewBinding(key.WithKeys("l")),
}

func loadInvestigations() tea.Msg {
	cmd := exec.Command("/Users/jacobaguon/support-triage/bin/triage", "list", "--json")
	output, err := cmd.Output()
	if err != nil {
		return errMsg{err}
	}

	var investigations []Investigation
	err = json.Unmarshal(output, &investigations)
	if err != nil {
		return errMsg{err}
	}

	return investigationsLoadedMsg{investigations: investigations}
}

func initialModel() model {
	return model{}
}

func (m model) Init() tea.Cmd {
	return loadInvestigations
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case investigationsLoadedMsg:
		m.investigations = msg.investigations
		return m, nil

	case errMsg:
		m.err = msg.err
		return m, nil

	case tea.KeyMsg:
		switch {
		case key.Matches(msg, keys.Quit):
			return m, tea.Quit

		case key.Matches(msg, keys.Up):
			if m.cursor > 0 {
				m.cursor--
			}
			return m, nil

		case key.Matches(msg, keys.Down):
			if m.cursor < len(m.investigations)-1 {
				m.cursor++
			}
			return m, nil

		case key.Matches(msg, keys.Refresh):
			return m, loadInvestigations
		}
	}

	return m, nil
}

func (m model) View() string {
	if m.err != nil {
		return fmt.Sprintf("Error: %v\n\nPress q to quit.", m.err)
	}

	// Title bar
	title := titleStyle.Width(m.width).Render("Support Triage")

	// Calculate dimensions
	sidebarWidth := m.width / 3
	if sidebarWidth < 40 {
		sidebarWidth = 40
	}
	detailWidth := m.width - sidebarWidth - 6

	contentHeight := m.height - 6 // Account for title and action bar

	// Render sidebar (list)
	sidebar := m.renderSidebar(sidebarWidth, contentHeight)

	// Render detail panel
	detail := m.renderDetailPanel(detailWidth, contentHeight)

	// Combine sidebar and detail horizontally
	content := lipgloss.JoinHorizontal(
		lipgloss.Top,
		sidebar,
		detail,
	)

	// Action bar
	actionBar := m.renderActionBar()

	// Combine everything vertically
	return lipgloss.JoinVertical(
		lipgloss.Left,
		title,
		content,
		actionBar,
	)
}

func (m model) renderSidebar(width, height int) string {
	var items []string

	header := sectionHeaderStyle.Render(
		fmt.Sprintf("Investigations (%d)", len(m.investigations)),
	)
	items = append(items, header)
	items = append(items, "")

	// List items
	for i, inv := range m.investigations {
		statusIcon := getStatusIcon(inv.Status)

		line := fmt.Sprintf("%s #%d - %s", statusIcon, inv.ID, inv.CustomerName)
		meta := fmt.Sprintf("  %s • %s", inv.Classification, inv.Status)

		if i == m.cursor {
			items = append(items, selectedItemStyle.Render(line))
			items = append(items, selectedItemStyle.Render(meta))
		} else {
			items = append(items, normalItemStyle.Render(line))
			items = append(items, dimmedTextStyle.Render(meta))
		}

		if i < len(m.investigations)-1 {
			items = append(items, "")
		}
	}

	content := strings.Join(items, "\n")

	return sidebarStyle.
		Width(width - 4).
		Height(height - 2).
		Render(content)
}

func (m model) renderDetailPanel(width, height int) string {
	if len(m.investigations) == 0 {
		return detailPanelStyle.
			Width(width - 4).
			Height(height - 2).
			Render("No investigations")
	}

	inv := m.investigations[m.cursor]

	var sections []string

	// Header
	statusIcon := getStatusIcon(inv.Status)
	header := sectionHeaderStyle.Render(
		fmt.Sprintf("%s Investigation #%d", statusIcon, inv.ID),
	)
	sections = append(sections, header)
	sections = append(sections, "")

	// Details
	sections = append(sections, fmt.Sprintf("Customer:       %s", inv.CustomerName))
	sections = append(sections, fmt.Sprintf("Classification: %s", inv.Classification))

	if inv.ConnectorName != "" {
		sections = append(sections, fmt.Sprintf("Connector:      %s", inv.ConnectorName))
	}

	sections = append(sections, fmt.Sprintf("Product Area:   %s", inv.ProductArea))
	sections = append(sections, fmt.Sprintf("Priority:       %s", inv.Priority))
	sections = append(sections, fmt.Sprintf("Status:         %s", inv.Status))

	if inv.CurrentCheckpoint != "" {
		sections = append(sections, "")
		sections = append(sections, dimmedTextStyle.Render(fmt.Sprintf("Checkpoint: %s", inv.CurrentCheckpoint)))
	}

	sections = append(sections, "")
	sections = append(sections, dimmedTextStyle.Render(fmt.Sprintf("Created: %s", inv.CreatedAt)))
	sections = append(sections, dimmedTextStyle.Render(fmt.Sprintf("Updated: %s", inv.UpdatedAt)))

	// Next actions
	sections = append(sections, "")
	sections = append(sections, "")
	sections = append(sections, sectionHeaderStyle.Render("Actions"))
	sections = append(sections, "")

	if inv.Status == "waiting" {
		sections = append(sections, "• Press 'a' to approve checkpoint")
	}
	sections = append(sections, "• Press 'l' to view logs")
	sections = append(sections, "• Press 'r' to refresh")

	content := strings.Join(sections, "\n")

	return detailPanelStyle.
		Width(width - 4).
		Height(height - 2).
		Render(content)
}

func (m model) renderActionBar() string {
	runningCount := 0
	waitingCount := 0
	for _, inv := range m.investigations {
		if inv.Status == "running" {
			runningCount++
		} else if inv.Status == "waiting" {
			waitingCount++
		}
	}

	left := fmt.Sprintf("%d investigations • %d running • %d waiting",
		len(m.investigations), runningCount, waitingCount)

	right := "↑/k: up • ↓/j: down • r: refresh • a: approve • l: logs • q: quit"

	leftPart := actionBarStyle.Width(m.width/2 - 2).Render(left)
	rightPart := actionBarStyle.Width(m.width/2 - 2).Align(lipgloss.Right).Render(right)

	return lipgloss.JoinHorizontal(lipgloss.Top, leftPart, rightPart)
}

func getStatusIcon(status string) string {
	switch status {
	case "running":
		return "🟡"
	case "waiting":
		return "🔵"
	case "completed", "complete":
		return "🟢"
	case "error":
		return "🔴"
	default:
		return "○"
	}
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
