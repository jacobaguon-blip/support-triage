package main

import (
	"fmt"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"
)

func (m model) View() string {
	if m.err != nil {
		return fmt.Sprintf("Error: %v\n\nPress q to quit.", m.err)
	}

	// Render confirmation dialog overlay if shown
	if m.showConfirmDialog {
		return m.renderConfirmDialog()
	}

	// Render create form overlay if shown
	if m.showCreateForm {
		return m.renderCreateForm()
	}

	// Title bar
	title := titleStyle.Width(m.width).Render("Support Triage")

	// Calculate dimensions
	sidebarWidth := m.width / 3
	if sidebarWidth < 40 {
		sidebarWidth = 40
	}
	contentWidth := m.width - sidebarWidth - 6

	// Strict height budget: title(1) + mainContent(contentHeight) + actionBar(2) = m.height
	contentHeight := m.height - 4
	if contentHeight < 10 {
		contentHeight = 10
	}

	// Render sidebar (list)
	sidebar := m.renderSidebar(sidebarWidth, contentHeight)

	// Render tab bar and content
	inv := m.getSelectedInvestigation()
	var content string
	if inv != nil {
		tabBar := m.renderTabBar(contentWidth)
		tabContent := m.renderTabContent(contentWidth, contentHeight-4)

		content = lipgloss.JoinVertical(
			lipgloss.Left,
			tabBar,
			tabContent,
		)
	} else {
		content = contentPanelStyle.
			Width(contentWidth - 4).
			Height(contentHeight - 2).
			Render("No investigation selected")
	}

	// Combine sidebar and content horizontally
	mainContent := lipgloss.JoinHorizontal(
		lipgloss.Top,
		sidebar,
		content,
	)

	// Debug overlay: side panel or compact bar
	if m.showDebugOverlay {
		if m.width >= 100 {
			// Side panel mode: render debug panel to the right
			debugPanelWidth := 40
			// Recalculate content area to make room for debug panel
			adjustedContentWidth := m.width - sidebarWidth - debugPanelWidth - 8

			var adjustedContent string
			if inv != nil {
				tabBar := m.renderTabBar(adjustedContentWidth)
				tabContent := m.renderTabContent(adjustedContentWidth, contentHeight-4)
				adjustedContent = lipgloss.JoinVertical(
					lipgloss.Left,
					tabBar,
					tabContent,
				)
			} else {
				adjustedContent = contentPanelStyle.
					Width(adjustedContentWidth - 4).
					Height(contentHeight - 2).
					Render("No investigation selected")
			}

			debugPanel := m.renderDebugOverlay(debugPanelWidth, contentHeight)

			mainContent = lipgloss.JoinHorizontal(
				lipgloss.Top,
				sidebar,
				adjustedContent,
				debugPanel,
			)
		} else {
			// Compact mode: add debug bar at top
			debugBar := m.renderCompactDebugBar()
			mainContent = lipgloss.JoinVertical(
				lipgloss.Left,
				debugBar,
				lipgloss.JoinHorizontal(
					lipgloss.Top,
					sidebar,
					content,
				),
			)
		}
	}

	// Action bar
	actionBar := m.renderActionBar()

	// Combine everything vertically, then hard-clamp to terminal height
	output := lipgloss.JoinVertical(
		lipgloss.Left,
		title,
		mainContent,
		actionBar,
	)

	// Ensure output never exceeds terminal height (prevents scroll-off)
	lines := strings.Split(output, "\n")
	if len(lines) > m.height {
		lines = lines[:m.height]
	}
	return strings.Join(lines, "\n")
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

		if i == m.selectedIndex {
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

func (m model) renderTabBar(width int) string {
	inv := m.getSelectedInvestigation()
	if inv == nil {
		return ""
	}

	tabs := []struct {
		tab    TabType
		name   string
		icon   string
		status string
	}{
		{TabSlack, "Slack", "💬", inv.AgentStatuses["Slack"]},
		{TabLinear, "Linear", "📋", inv.AgentStatuses["Linear"]},
		{TabPylon, "Pylon", "🎫", inv.AgentStatuses["Pylon"]},
		{TabCodebase, "Codebase", "💻", inv.AgentStatuses["Codebase"]},
		{TabSummary, "Summary", "📊", ""},
		// {TabKB, "KB Article", "📝", ""}, // V2 feature
	}

	var renderedTabs []string
	for _, tab := range tabs {
		var style lipgloss.Style
		if tab.tab == m.activeTab {
			style = activeTabStyle
		} else {
			style = inactiveTabStyle
		}

		statusIcon := getStatusIcon(tab.status)
		if tab.status == "" {
			statusIcon = ""
		}

		tabContent := fmt.Sprintf("%s %s %s", tab.icon, tab.name, statusIcon)
		renderedTabs = append(renderedTabs, style.Render(tabContent))
	}

	return lipgloss.JoinHorizontal(lipgloss.Top, renderedTabs...)
}

func (m model) renderTabContent(width, height int) string {
	inv := m.getSelectedInvestigation()
	if inv == nil {
		return ""
	}

	// Show checkpoint 1 review card when waiting at classification
	if inv.Status == "waiting" && inv.CurrentCheckpoint == "checkpoint_1_post_classification" {
		return m.renderCheckpointReview(inv, width, height)
	}

	switch m.activeTab {
	case TabSlack, TabLinear, TabPylon, TabCodebase:
		return m.renderAgentView(width, height)
	case TabSummary:
		return m.renderSummaryView(width, height)
	// case TabKB:
	// 	return m.renderKBView(width, height)
	// NOTE: Tab 6 (KB Article) disabled - V2 feature
	default:
		return contentPanelStyle.
			Width(width - 4).
			Height(height - 2).
			Render("Unknown tab")
	}
}

func (m model) renderCheckpointBanner(inv *Investigation, width int) string {
	if inv.Status != "waiting" || inv.CurrentCheckpoint == "" {
		return ""
	}

	// Map checkpoint to human-readable name
	checkpointNames := map[string]string{
		"checkpoint_1_post_classification":      "Classification Review",
		"checkpoint_2_post_context_gathering":    "Context Gathering Review",
		"checkpoint_3_investigation_validation":  "Investigation Validation",
		"checkpoint_4_solution_check":            "Solution Review",
	}
	name := checkpointNames[inv.CurrentCheckpoint]
	if name == "" {
		name = inv.CurrentCheckpoint
	}

	bannerStyle := lipgloss.NewStyle().
		Background(lipgloss.Color("#F59E0B")).
		Foreground(lipgloss.Color("#000000")).
		Bold(true).
		Padding(0, 2).
		Width(width - 4)

	return bannerStyle.Render(fmt.Sprintf("⏸ Checkpoint: %s — Press 'a' to approve", name))
}

func (m model) renderCheckpointReview(inv *Investigation, width, height int) string {
	td := m.ticketData[inv.ID]

	// Loading state
	if td == nil {
		placeholder := fmt.Sprintf("%s Loading ticket data...", m.spinner.View())
		return contentPanelStyle.
			Width(width - 4).
			Height(height - 2).
			Render(placeholder)
	}

	innerWidth := width - 8
	var sections []string

	// Header
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(statusWaiting).
		Background(bgTertiary).
		Padding(0, 1).
		Width(innerWidth)
	sections = append(sections, headerStyle.Render("⏸ CLASSIFICATION REVIEW"))
	sections = append(sections, "")

	// Ticket info
	ticketLine := lipgloss.NewStyle().Bold(true).Foreground(textPrimary).
		Render(fmt.Sprintf("#%d — %s", td.TicketID, td.CustomerName))
	sections = append(sections, ticketLine)

	titleLine := lipgloss.NewStyle().Foreground(textSecondary).
		Render(fmt.Sprintf("Title: %s", td.Title))
	sections = append(sections, titleLine)
	sections = append(sections, "")

	// Classification fields intro
	introStyle := lipgloss.NewStyle().Foreground(textSecondary).Italic(true)
	sections = append(sections, introStyle.Render("The system classified this ticket as:"))
	sections = append(sections, "")

	// Editable fields
	fieldNames := []string{"Classification", "Product Area", "Priority"}
	fieldValues := []string{m.cp1Classification, m.cp1ProductArea, m.cp1Priority}

	for i, name := range fieldNames {
		sections = append(sections, m.renderCP1Field(name, fieldValues[i], i, innerWidth))

		// Render dropdown if open for this field
		if m.cp1DropdownOpen && m.cp1FocusField == i {
			sections = append(sections, m.renderCP1Dropdown(innerWidth))
		}
	}

	// Connector (read-only)
	connectorVal := "—"
	if td.ConnectorName != nil && *td.ConnectorName != "" {
		connectorVal = *td.ConnectorName
	}
	connLabel := lipgloss.NewStyle().Foreground(textSecondary).Width(18).Render("  Connector:")
	connValue := lipgloss.NewStyle().Foreground(textMuted).Render(connectorVal)
	sections = append(sections, connLabel+connValue)

	sections = append(sections, "")

	// Sources
	sourceStyle := lipgloss.NewStyle().Foreground(textMuted).Italic(true)
	sections = append(sections, sourceStyle.Render(fmt.Sprintf("Sources: Pylon #%d, Built-in classifier", td.TicketID)))
	sections = append(sections, "")

	// Ticket body preview
	bodyHeaderStyle := lipgloss.NewStyle().Bold(true).Foreground(textPrimary)
	sections = append(sections, bodyHeaderStyle.Render("Ticket Body:"))

	bodyText := td.Body
	if bodyText == "" {
		bodyText = "(no body text)"
	}
	// Truncate to ~5 lines worth
	bodyLines := strings.Split(bodyText, "\n")
	if len(bodyLines) > 5 {
		bodyLines = bodyLines[:5]
		bodyLines = append(bodyLines, "...")
	}
	// Also truncate very long single lines
	for i, line := range bodyLines {
		if len(line) > innerWidth-4 {
			bodyLines[i] = line[:innerWidth-7] + "..."
		}
	}
	bodyStyle := lipgloss.NewStyle().Foreground(textSecondary).Width(innerWidth - 2).Padding(0, 1)
	sections = append(sections, bodyStyle.Render(strings.Join(bodyLines, "\n")))

	sections = append(sections, "")

	// Divider
	divider := lipgloss.NewStyle().Foreground(borderColor).Render(strings.Repeat("─", innerWidth))
	sections = append(sections, divider)

	// Next step info
	nextStyle := lipgloss.NewStyle().Foreground(textSecondary)
	sections = append(sections, nextStyle.Render("Approve → starts context gathering"))
	sections = append(sections, nextStyle.Render("(Agents will search Pylon, Slack for context)"))
	sections = append(sections, "")

	// Key hints
	hintStyle := lipgloss.NewStyle().Foreground(textMuted)
	sections = append(sections, hintStyle.Render("[Tab] next field  [Enter] open dropdown  [a] approve  [r] refresh"))

	content := strings.Join(sections, "\n")

	return contentPanelStyle.
		Width(width - 4).
		Height(height - 2).
		Render(content)
}

func (m model) renderCP1Field(name, value string, fieldIndex, width int) string {
	isFocused := m.cp1FocusField == fieldIndex

	// Label
	labelWidth := 18
	var label string
	if isFocused {
		label = lipgloss.NewStyle().Bold(true).Foreground(c1Primary).Width(labelWidth).
			Render(fmt.Sprintf("▸ %s:", name))
	} else {
		label = lipgloss.NewStyle().Foreground(textSecondary).Width(labelWidth).
			Render(fmt.Sprintf("  %s:", name))
	}

	// Value with dropdown indicator
	var valueRendered string
	if isFocused {
		valueStyle := lipgloss.NewStyle().
			Bold(true).
			Foreground(c1Primary).
			Background(bgTertiary).
			Padding(0, 1)
		valueRendered = valueStyle.Render(fmt.Sprintf("%s ▾", value))
	} else {
		valueStyle := lipgloss.NewStyle().
			Foreground(textPrimary).
			Padding(0, 1)
		valueRendered = valueStyle.Render(value)
	}

	return label + valueRendered
}

func (m model) renderCP1Dropdown(width int) string {
	options := m.cp1ActiveOptions()
	if options == nil {
		return ""
	}

	var lines []string
	for i, opt := range options {
		if i == m.cp1DropdownIndex {
			style := lipgloss.NewStyle().
				Bold(true).
				Foreground(bgPrimary).
				Background(c1Primary).
				Padding(0, 1)
			lines = append(lines, fmt.Sprintf("  %s", style.Render(opt)))
		} else {
			style := lipgloss.NewStyle().
				Foreground(textPrimary).
				Background(bgSecondary).
				Padding(0, 1)
			lines = append(lines, fmt.Sprintf("  %s", style.Render(opt)))
		}
	}

	dropdownStyle := lipgloss.NewStyle().
		Border(lipgloss.NormalBorder()).
		BorderForeground(c1Primary).
		Background(bgSecondary).
		Padding(0, 0).
		MarginLeft(18)

	return dropdownStyle.Render(strings.Join(lines, "\n"))
}

func (m model) renderAgentView(width, height int) string {
	inv := m.getSelectedInvestigation()
	if inv == nil {
		return ""
	}

	// Checkpoint banner
	checkpointBanner := m.renderCheckpointBanner(inv, width)
	bannerHeight := 0
	if checkpointBanner != "" {
		bannerHeight = 2
	}

	agentName := m.getActiveAgentName()
	agentState := m.getAgentState(inv.ID, agentName)

	if agentState == nil {
		// Show loading state or "not started" message
		var placeholder string
		if m.loading {
			placeholder = fmt.Sprintf("%s Loading %s agent data...", m.spinner.View(), agentName)
		} else {
			placeholder = emptyStateStyle.Render(
				fmt.Sprintf("Agent %s has not started yet\n\nThis agent will begin when the investigation checkpoint is approved.", agentName),
			)
		}
		content := contentPanelStyle.
			Width(width - 4).
			Height(height - 2 - bannerHeight).
			Render(placeholder)
		if checkpointBanner != "" {
			return lipgloss.JoinVertical(lipgloss.Left, checkpointBanner, content)
		}
		return content
	}

	// Agent status header
	statusHeader := m.renderAgentStatusHeader(agentState, width)

	// Findings (40% height)
	findingsHeight := int(float64(height) * 0.4)
	findings := m.renderFindings(agentState, width, findingsHeight)

	// Terminal output (60% height)
	terminalHeight := height - findingsHeight - 8
	terminal := m.renderTerminalOutput(agentState, width, terminalHeight)

	content := lipgloss.JoinVertical(
		lipgloss.Left,
		statusHeader,
		findings,
		terminal,
	)

	return contentPanelStyle.
		Width(width - 4).
		Height(height - 2).
		Render(content)
}

func (m model) renderAgentStatusHeader(state *AgentState, width int) string {
	status := fmt.Sprintf(
		"Agent: %s    Status: %s %s    PID: %d\nStarted: %s    Runtime: %s",
		state.Name,
		getStatusIcon(state.Status),
		state.Status,
		state.PID,
		state.StartedAt.Format("15:04:05"),
		state.Runtime.Round(time.Second).String(),
	)

	return sectionHeaderStyle.Render(status)
}

func (m model) renderFindings(state *AgentState, width, height int) string {
	header := sectionHeaderStyle.Render(fmt.Sprintf("FINDINGS (%d)", len(state.Findings)))

	if len(state.Findings) == 0 {
		// Better empty state based on agent status
		var placeholder string
		if state.Status == "running" {
			placeholder = emptyStateStyle.Render(
				fmt.Sprintf("%s Agent is working...\n\nFindings will appear here when the agent discovers relevant information.", m.spinner.View()),
			)
		} else if state.Status == "pending" {
			placeholder = emptyStateStyle.Render("Agent has not started yet")
		} else {
			placeholder = emptyStateStyle.Render("No findings recorded")
		}

		return lipgloss.JoinVertical(
			lipgloss.Left,
			header,
			findingsBoxStyle.
				Width(width - 8).
				Height(height - 4).
				Render(placeholder),
		)
	}

	var findingLines []string
	for i, finding := range state.Findings {
		// Finding title with emoji
		titleStyle := lipgloss.NewStyle().Bold(true).Foreground(c1Primary)
		findingLines = append(findingLines, titleStyle.Render(fmt.Sprintf("📌 Finding #%d: %s", i+1, finding.Title)))

		// Details with bullet points
		for _, detail := range finding.Details {
			findingLines = append(findingLines, fmt.Sprintf("   • %s", detail))
		}
		findingLines = append(findingLines, "")
	}

	content := strings.Join(findingLines, "\n")

	// Use viewport if ready
	if m.ready {
		m.findingsViewport.SetContent(content)
		viewportContent := m.findingsViewport.View()
		return lipgloss.JoinVertical(
			lipgloss.Left,
			header,
			findingsBoxStyle.
				Width(width - 8).
				Height(height - 4).
				Render(viewportContent),
		)
	}

	return lipgloss.JoinVertical(
		lipgloss.Left,
		header,
		findingsBoxStyle.
			Width(width - 8).
			Height(height - 4).
			Render(content),
	)
}

func (m model) renderTerminalOutput(state *AgentState, width, height int) string {
	scrollHint := ""
	if len(state.Logs) > height-6 {
		scrollHint = " • PgUp/PgDn to scroll"
	}
	header := sectionHeaderStyle.Render(fmt.Sprintf("TERMINAL OUTPUT (%d lines)%s", len(state.Logs), scrollHint))

	if len(state.Logs) == 0 {
		// Better empty state based on agent status
		var placeholder string
		if state.Status == "running" {
			placeholder = emptyStateStyle.Render(
				fmt.Sprintf("%s Agent is starting...\n\nTerminal output will appear here shortly.", m.spinner.View()),
			)
		} else if state.Status == "pending" {
			placeholder = emptyStateStyle.Render("Agent has not started yet")
		} else {
			placeholder = emptyStateStyle.Render("No terminal output recorded")
		}

		return lipgloss.JoinVertical(
			lipgloss.Left,
			header,
			terminalBoxStyle.
				Width(width - 8).
				Height(height - 4).
				Render(placeholder),
		)
	}

	// Format logs with syntax highlighting
	var logLines []string
	for _, log := range state.Logs {
		timestamp := dimmedTextStyle.Render(log.Timestamp.Format("15:04:05"))

		// Style based on log level and content
		var styledLine string
		levelUpper := strings.ToUpper(log.Level)

		// Detect checkpoints
		if strings.Contains(strings.ToLower(log.Message), "checkpoint") ||
			strings.Contains(strings.ToLower(log.Message), "approval") ||
			strings.Contains(strings.ToLower(log.Message), "waiting") {
			styledLine = fmt.Sprintf("%s %s", timestamp, logCheckpointStyle.Render(fmt.Sprintf("[%s] %s", levelUpper, log.Message)))
		} else if levelUpper == "ERROR" || levelUpper == "ERR" {
			styledLine = fmt.Sprintf("%s %s", timestamp, logErrorStyle.Render(fmt.Sprintf("[%s] %s", levelUpper, log.Message)))
		} else if levelUpper == "TOOL" {
			styledLine = fmt.Sprintf("%s %s", timestamp, logToolStyle.Render(fmt.Sprintf("[%s] %s", levelUpper, log.Message)))
		} else {
			styledLine = fmt.Sprintf("%s %s", timestamp, logInfoStyle.Render(fmt.Sprintf("[%s] %s", levelUpper, log.Message)))
		}

		logLines = append(logLines, styledLine)
	}

	content := strings.Join(logLines, "\n")

	// Use viewport if ready
	if m.ready {
		m.terminalViewport.SetContent(content)
		// Auto-scroll to bottom for running agents
		if state.Status == "running" {
			m.terminalViewport.GotoBottom()
		}
		viewportContent := m.terminalViewport.View()
		return lipgloss.JoinVertical(
			lipgloss.Left,
			header,
			terminalBoxStyle.
				Width(width - 8).
				Height(height - 4).
				Render(viewportContent),
		)
	}

	// Fallback without viewport
	startIdx := 0
	if len(logLines) > height-6 {
		startIdx = len(logLines) - (height - 6)
	}
	visibleLogs := logLines[startIdx:]
	content = strings.Join(visibleLogs, "\n")

	return lipgloss.JoinVertical(
		lipgloss.Left,
		header,
		terminalBoxStyle.
			Width(width - 8).
			Height(height - 4).
			Render(content),
	)
}

func (m model) renderSummaryView(width, height int) string {
	inv := m.getSelectedInvestigation()
	if inv == nil {
		return contentPanelStyle.
			Width(width - 4).
			Height(height - 2).
			Render("No investigation selected")
	}

	summary := m.getSummary(inv.ID)
	response := m.getCustomerResponse(inv.ID)

	// Use fixed height constraints to prevent overflow
	// Reserve: 2 for headers, 1 for divider, 1 for footer
	usableHeight := height - 6
	summaryHeight := usableHeight / 2
	responseHeight := usableHeight - summaryHeight

	summarySection := m.renderSummarySection(inv, summary, width, summaryHeight)
	responseSection := m.renderResponseSection(inv, response, width, responseHeight)

	divider := lipgloss.NewStyle().
		Foreground(borderColor).
		Width(width - 8).
		Render("────────────────────────────────────────────")

	content := lipgloss.JoinVertical(
		lipgloss.Left,
		summarySection,
		divider,
		responseSection,
	)

	return contentPanelStyle.
		Width(width - 4).
		Height(height - 2).
		Render(content)
}

func (m model) renderSummarySection(inv *Investigation, summary *InvestigationSummary, width, height int) string {
	header := sectionHeaderStyle.Render("INVESTIGATION SUMMARY")

	if summary == nil {
		placeholder := fmt.Sprintf("%s Loading summary...\n\nSummary will appear when the investigation completes.", m.spinner.View())
		content := lipgloss.NewStyle().
			Foreground(textMuted).
			Italic(true).
			Width(width - 8).
			Height(height - 2).
			Render(placeholder)
		return lipgloss.JoinVertical(lipgloss.Left, header, content)
	}

	var sections []string

	// Investigation metadata
	metaStyle := lipgloss.NewStyle().Foreground(textSecondary)
	sections = append(sections,
		fmt.Sprintf("Ticket: #%d - %s", inv.ID, inv.CustomerName),
		metaStyle.Render(fmt.Sprintf("Classification: %s  •  Status: %s  •  Priority: %s",
			inv.Classification, inv.Status, inv.Priority)),
		"",
	)

	// Root cause
	if summary.RootCause != "" {
		sections = append(sections,
			sectionHeaderStyle.Render("🔍 ROOT CAUSE"),
			summary.RootCause,
			"",
		)
	}

	// Key findings from each agent
	if len(summary.KeyFindings) > 0 {
		sections = append(sections, sectionHeaderStyle.Render("📋 KEY FINDINGS"), "")

		for _, agentName := range []string{"Slack", "Linear", "Pylon", "Codebase"} {
			findings := summary.KeyFindings[agentName]
			if len(findings) > 0 {
				icon := getAgentIcon(agentName)
				agentHeader := lipgloss.NewStyle().Bold(true).Foreground(c1Primary).Render(
					fmt.Sprintf("%s %s", icon, agentName),
				)
				sections = append(sections, agentHeader)

				for _, finding := range findings {
					sections = append(sections, fmt.Sprintf("   • %s", finding))
				}
				sections = append(sections, "")
			}
		}
	}

	// Open questions
	if len(summary.OpenQuestions) > 0 {
		sections = append(sections, sectionHeaderStyle.Render("❓ OPEN QUESTIONS"), "")
		for _, question := range summary.OpenQuestions {
			sections = append(sections, fmt.Sprintf("   • %s", question))
		}
		sections = append(sections, "")
	}

	// Next steps
	if len(summary.NextSteps) > 0 {
		sections = append(sections, sectionHeaderStyle.Render("➡️  NEXT STEPS"), "")
		for i, step := range summary.NextSteps {
			sections = append(sections, fmt.Sprintf("   %d. %s", i+1, step))
		}
	}

	content := strings.Join(sections, "\n")

	// Constrain to allocated height
	contentView := lipgloss.NewStyle().
		Width(width - 8).
		Height(height - 2).
		Render(content)

	return lipgloss.JoinVertical(lipgloss.Left, header, contentView)
}

func (m model) renderResponseSection(inv *Investigation, response *CustomerResponse, width, height int) string {
	header := sectionHeaderStyle.Render("CUSTOMER RESPONSE (Non-Technical)")

	if response == nil {
		placeholder := lipgloss.NewStyle().
			Foreground(textMuted).
			Italic(true).
			Width(width - 8).
			Height(height - 2).
			Render("Customer response will be generated when the investigation completes.")
		return lipgloss.JoinVertical(lipgloss.Left, header, placeholder)
	}

	// Show editing UI if in edit mode
	if m.editingResponse {
		editHeader := logCheckpointStyle.Render("✏️  EDITING MODE")

		// Update textarea dimensions - constrain to available height
		taHeight := height - 5
		if taHeight < 3 {
			taHeight = 3
		}
		m.responseTextarea.SetWidth(width - 12)
		m.responseTextarea.SetHeight(taHeight)

		textareaView := m.responseTextarea.View()
		footer := dimmedTextStyle.Render("Ctrl+S: save • Esc: cancel")

		return lipgloss.JoinVertical(
			lipgloss.Left,
			header,
			editHeader,
			textareaView,
			footer,
		)
	}

	// Normal display mode
	var footer string
	if response.CopiedToClip {
		footer = "✅ Copied! • [E] Edit • [C] Copy again • [P] Post to Pylon"
	} else if response.PostedToPylon {
		footer = "✅ Posted to Pylon! • [E] Edit • [C] Copy"
	} else {
		footer = "[E] Edit • [C] Copy to clipboard • [P] Post to Pylon"
	}

	// Constrain response content to available height
	contentView := lipgloss.NewStyle().
		Width(width - 8).
		Height(height - 3).
		Render(response.Content)

	return lipgloss.JoinVertical(
		lipgloss.Left,
		header,
		contentView,
		dimmedTextStyle.Render(footer),
	)
}

func (m model) renderKBView(width, height int) string {
	// Placeholder for Phase 3E (V2)
	return contentPanelStyle.
		Width(width - 4).
		Height(height - 2).
		Render("KB Article view - V2 feature")
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

	// Show different hints based on active tab
	var right string
	debugHint := ""
	if m.showDebugOverlay {
		debugHint = " • ?: debug"
	}
	if m.activeTab >= TabSlack && m.activeTab <= TabCodebase {
		right = "↑↓/jk: nav • 1-5: tabs • PgUp/PgDn: scroll • n: new • r: refresh • a: approve • q: quit" + debugHint
	} else if m.activeTab == TabSummary {
		if m.editingResponse {
			right = "Esc: cancel edit • 1-5: tabs • q: quit" + debugHint
		} else {
			right = "↑↓/jk: nav • 1-5: tabs • e: edit • c: copy • p: post • n: new • r: refresh • q: quit" + debugHint
		}
	} else {
		right = "↑↓/jk: nav • 1-5: tabs • n: new • r: refresh • a: approve • q: quit" + debugHint
	}

	leftPart := actionBarStyle.Width(m.width/2 - 2).Render(left)
	rightPart := actionBarStyle.Width(m.width/2 - 2).Align(lipgloss.Right).Render(right)

	return lipgloss.JoinHorizontal(lipgloss.Top, leftPart, rightPart)
}

func (m model) renderConfirmDialog() string {
	// Create modal overlay
	dialogWidth := 60
	dialogHeight := 10

	// Title bar (still show at top)
	title := titleStyle.Width(m.width).Render("Support Triage")

	// Dialog box
	dialogStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(c1Primary).
		BorderBackground(bgPrimary).
		Background(bgPrimary).
		Padding(1, 2).
		Width(dialogWidth).
		Height(dialogHeight)

	// Content
	var icon string
	if m.confirmAction == "post" {
		icon = "📤"
	} else if m.confirmAction == "save" {
		icon = "💾"
	}

	dialogHeader := lipgloss.NewStyle().
		Bold(true).
		Foreground(c1Primary).
		Render(fmt.Sprintf("%s Confirmation", icon))

	dialogMessage := lipgloss.NewStyle().
		Foreground(textPrimary).
		Padding(1, 0).
		Render(m.confirmMessage)

	dialogButtons := lipgloss.NewStyle().
		Foreground(textSecondary).
		Padding(1, 0).
		Render("[Y] Yes    [N] No")

	dialogContent := lipgloss.JoinVertical(
		lipgloss.Left,
		dialogHeader,
		dialogMessage,
		dialogButtons,
	)

	dialog := dialogStyle.Render(dialogContent)

	// Center the dialog
	centered := lipgloss.Place(
		m.width,
		m.height-2, // Leave room for title
		lipgloss.Center,
		lipgloss.Center,
		dialog,
		lipgloss.WithWhitespaceChars(" "),
	)

	return lipgloss.JoinVertical(
		lipgloss.Left,
		title,
		centered,
	)
}

func (m model) renderCreateForm() string {
	dialogWidth := 70
	dialogHeight := 22

	title := titleStyle.Width(m.width).Render("Support Triage")

	dialogStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(c1Primary).
		BorderBackground(bgPrimary).
		Background(bgPrimary).
		Padding(1, 2).
		Width(dialogWidth).
		Height(dialogHeight)

	dialogHeader := lipgloss.NewStyle().
		Bold(true).
		Foreground(c1Primary).
		Render("New Investigation")

	// Ticket ID field
	ticketLabel := "  Ticket ID"
	if m.createFocusField == 0 {
		ticketLabel = "▸ Ticket ID"
	}
	ticketLabelRendered := lipgloss.NewStyle().Bold(true).Foreground(textPrimary).Render(ticketLabel)
	ticketField := m.createTicketInput.View()

	// Skill selector
	skillLabel := "  Skill"
	if m.createFocusField == 1 {
		skillLabel = "▸ Skill"
	}
	skillLabelRendered := lipgloss.NewStyle().Bold(true).Foreground(textPrimary).Render(skillLabel)
	var skillParts []string
	for i, s := range skillOptions {
		if i == m.createSkill {
			skillParts = append(skillParts, activeTabStyle.Render(" "+s+" "))
		} else {
			skillParts = append(skillParts, inactiveTabStyle.Render(" "+s+" "))
		}
	}
	skillSelector := lipgloss.JoinHorizontal(lipgloss.Top, skillParts...)

	// Context field
	contextLabel := "  Context (optional)"
	if m.createFocusField == 2 {
		contextLabel = "▸ Context (optional)"
	}
	contextLabelRendered := lipgloss.NewStyle().Bold(true).Foreground(textPrimary).Render(contextLabel)
	contextField := m.createContextArea.View()

	// Error message
	var errorLine string
	if m.createError != "" {
		errorLine = lipgloss.NewStyle().Foreground(statusError).Bold(true).Render("Error: " + m.createError)
	}

	// Footer
	var footer string
	if m.creatingInProgress {
		footer = m.spinner.View() + " Creating investigation..."
	} else {
		footer = dimmedTextStyle.Render("Tab: next field • Space: cycle skill • Enter/Ctrl+S: submit • Esc: cancel")
	}

	dialogContent := lipgloss.JoinVertical(
		lipgloss.Left,
		dialogHeader,
		"",
		ticketLabelRendered,
		ticketField,
		"",
		skillLabelRendered,
		skillSelector,
		"",
		contextLabelRendered,
		contextField,
		"",
		errorLine,
		footer,
	)

	dialog := dialogStyle.Render(dialogContent)

	centered := lipgloss.Place(
		m.width,
		m.height-2,
		lipgloss.Center,
		lipgloss.Center,
		dialog,
		lipgloss.WithWhitespaceChars(" "),
	)

	return lipgloss.JoinVertical(
		lipgloss.Left,
		title,
		centered,
	)
}

func (m model) renderDebugOverlay(width, height int) string {
	var sections []string

	// Section 1: Build Info
	sections = append(sections, debugLabelStyle.Render("BUILD INFO"))
	sections = append(sections, debugRow("Version", m.buildVersion))
	sections = append(sections, debugRow("Built", m.buildTime))
	binPath, _ := os.Executable()
	sections = append(sections, debugRow("Binary", truncateStr(binPath, width-12)))
	sections = append(sections, debugRow("Go", runtime.Version()))
	sections = append(sections, "")

	// Section 2: Window & Layout
	sections = append(sections, debugLabelStyle.Render("WINDOW & LAYOUT"))
	sections = append(sections, debugRow("Terminal", fmt.Sprintf("%dx%d", m.width, m.height)))
	sidebarWidth := m.width / 3
	if sidebarWidth < 40 {
		sidebarWidth = 40
	}
	contentWidth := m.width - sidebarWidth - 6
	contentHeight := m.height - 6
	sections = append(sections, debugRow("Sidebar W", strconv.Itoa(sidebarWidth)))
	sections = append(sections, debugRow("Content W", strconv.Itoa(contentWidth)))
	sections = append(sections, debugRow("Content H", strconv.Itoa(contentHeight)))
	sections = append(sections, "")

	// Section 3: Navigation State
	sections = append(sections, debugLabelStyle.Render("NAVIGATION"))
	sections = append(sections, debugRow("Tab", fmt.Sprintf("%s (%d)", getTabName(m.activeTab), m.activeTab)))
	sections = append(sections, debugRow("Sel Index", strconv.Itoa(m.selectedIndex)))
	inv := m.getSelectedInvestigation()
	if inv != nil {
		sections = append(sections, debugRow("Inv ID", fmt.Sprintf("#%d", inv.ID)))
		sections = append(sections, debugRow("Customer", truncateStr(inv.CustomerName, width-14)))
	} else {
		sections = append(sections, debugRow("Inv", "none"))
	}
	sections = append(sections, "")

	// Section 4: UI Flags
	sections = append(sections, debugLabelStyle.Render("UI FLAGS"))
	sections = append(sections, debugRow("loading", strconv.FormatBool(m.loading)))
	sections = append(sections, debugRow("ready", strconv.FormatBool(m.ready)))
	sections = append(sections, debugRow("editing", strconv.FormatBool(m.editingResponse)))
	sections = append(sections, debugRow("confirm", strconv.FormatBool(m.showConfirmDialog)))
	if m.showConfirmDialog {
		sections = append(sections, debugRow("action", m.confirmAction))
	}
	sections = append(sections, debugRow("debug", strconv.FormatBool(m.showDebugOverlay)))
	sections = append(sections, "")

	// Section 5: Data Counts
	sections = append(sections, debugLabelStyle.Render("DATA"))
	sections = append(sections, debugRow("Investig.", strconv.Itoa(len(m.investigations))))
	sections = append(sections, debugRow("Agents", strconv.Itoa(len(m.agents))))
	sections = append(sections, debugRow("Summaries", strconv.Itoa(len(m.summaries))))
	sections = append(sections, debugRow("Responses", strconv.Itoa(len(m.customerResponses))))
	sections = append(sections, "")

	// Section 6: Active Investigation Detail
	if inv != nil {
		sections = append(sections, debugLabelStyle.Render("ACTIVE INVESTIGATION"))
		sections = append(sections, debugRow("Status", inv.Status))
		sections = append(sections, debugRow("Class.", truncateStr(inv.Classification, width-12)))
		sections = append(sections, debugRow("Priority", inv.Priority))
		for _, agentName := range []string{"Slack", "Linear", "Pylon", "Codebase"} {
			status := inv.AgentStatuses[agentName]
			if status == "" {
				status = "-"
			}
			sections = append(sections, debugRow(agentName, status))
		}
	}

	content := strings.Join(sections, "\n")

	return debugOverlayStyle.
		Width(width - 4).
		Height(height - 2).
		Render(content)
}

func (m model) renderCompactDebugBar() string {
	inv := m.getSelectedInvestigation()
	invInfo := "none"
	if inv != nil {
		invInfo = fmt.Sprintf("#%d", inv.ID)
	}

	bar := fmt.Sprintf("[tab:%d | inv:%s | %dx%d | v:%s]",
		m.activeTab, invInfo, m.width, m.height, m.buildVersion)

	return debugLabelStyle.Render(bar)
}

func debugRow(label, value string) string {
	return debugLabelStyle.Render(label+": ") + debugValueStyle.Render(value)
}

func truncateStr(s string, maxLen int) string {
	if maxLen <= 3 {
		return s
	}
	if len(s) > maxLen {
		return s[:maxLen-3] + "..."
	}
	return s
}
