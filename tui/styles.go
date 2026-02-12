package main

import "github.com/charmbracelet/lipgloss"

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

	// Content panels
	contentPanelStyle = lipgloss.NewStyle().
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

	// Content boxes
	findingsBoxStyle = lipgloss.NewStyle().
				BorderStyle(lipgloss.NormalBorder()).
				BorderForeground(borderColor).
				Padding(0, 1)

	terminalBoxStyle = lipgloss.NewStyle().
				BorderStyle(lipgloss.NormalBorder()).
				BorderForeground(borderColor).
				Padding(0, 1).
				Foreground(textSecondary)

	// Log level styles
	logInfoStyle = lipgloss.NewStyle().
			Foreground(textSecondary)

	logToolStyle = lipgloss.NewStyle().
			Foreground(c1Primary).
			Bold(true)

	logErrorStyle = lipgloss.NewStyle().
			Foreground(statusError).
			Bold(true)

	logCheckpointStyle = lipgloss.NewStyle().
				Foreground(statusWaiting).
				Bold(true).
				Background(bgTertiary)

	// Empty state style
	emptyStateStyle = lipgloss.NewStyle().
			Foreground(textMuted).
			Italic(true).
			Padding(2, 4)

	// Loading spinner style
	spinnerStyle = lipgloss.NewStyle().
			Foreground(c1Primary)

	// Debug overlay styles
	debugOverlayStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(lipgloss.Color("#F59E0B")).
				Padding(1, 2)

	debugLabelStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#F59E0B")).
			Bold(true)

	debugValueStyle = lipgloss.NewStyle().
			Foreground(textSecondary)
)

// Helper functions for status icons and colors
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
	case "pending":
		return "○"
	default:
		return "○"
	}
}

func getAgentIcon(agentName string) string {
	icons := map[string]string{
		"Slack":    "💬",
		"Linear":   "📋",
		"Pylon":    "🎫",
		"Codebase": "💻",
	}
	if icon, ok := icons[agentName]; ok {
		return icon
	}
	return "🔧"
}

func getTabName(tab TabType) string {
	switch tab {
	case TabSlack:
		return "Slack"
	case TabLinear:
		return "Linear"
	case TabPylon:
		return "Pylon"
	case TabCodebase:
		return "Codebase"
	case TabSummary:
		return "Summary"
	case TabKB:
		return "KB Article"
	default:
		return "Unknown"
	}
}
