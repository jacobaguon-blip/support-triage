package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

const apiBase = "http://localhost:3001"

const cliPath = "/Users/jacobaguon/support-triage/bin/triage"

// Load all investigations from CLI
func loadInvestigationsCmd() tea.Cmd {
	return func() tea.Msg {
	cmd := exec.Command(cliPath, "list", "--json")
	output, err := cmd.Output()
	if err != nil {
		return errMsg{err}
	}

	var investigations []Investigation
	err = json.Unmarshal(output, &investigations)
	if err != nil {
		return errMsg{err}
	}

		// Initialize AgentStatuses map for each investigation
		for i := range investigations {
			investigations[i].AgentStatuses = make(map[string]string)
		}

		return investigationsLoadedMsg{investigations: investigations}
	}
}

// Load agent statuses for a specific investigation
func loadAgentStatusesCmd(investigationID int) tea.Cmd {
	return func() tea.Msg {
		cmd := exec.Command(cliPath, "status", strconv.Itoa(investigationID), "--json")
		output, err := cmd.Output()
		if err != nil {
			return errMsg{err}
		}

		var status struct {
			Investigation Investigation   `json:"investigation"`
			Agents        []struct {
				ID              int    `json:"id"`
				InvestigationID int    `json:"investigation_id"`
				AgentName       string `json:"agent_name"`
				PID             int    `json:"pid"`
				Status          string `json:"status"`
				LogFile         string `json:"log_file"`
				FindingsFile    string `json:"findings_file"`
				StartedAt       string `json:"started_at"`
			} `json:"agents"`
		}
		err = json.Unmarshal(output, &status)
		if err != nil {
			return errMsg{err}
		}

		// Convert to AgentState map
		agents := make(map[string]*AgentState)
		for _, agent := range status.Agents {
			startedAt, _ := time.Parse(time.RFC3339, agent.StartedAt)
			runtime := time.Since(startedAt)

			agents[agent.AgentName] = &AgentState{
				Name:         agent.AgentName,
				Status:       agent.Status,
				PID:          agent.PID,
				StartedAt:    startedAt,
				Runtime:      runtime,
				Logs:         []LogEntry{},
				Findings:     []Finding{},
				LogFile:      agent.LogFile,
				FindingsFile: agent.FindingsFile,
			}
		}

		return agentStatusesLoadedMsg{
			investigationID: investigationID,
			agents:          agents,
		}
	}
}

// Stream agent logs (read last N lines)
func streamAgentLogsCmd(investigationID int, agentName string) tea.Cmd {
	return func() tea.Msg {
		logPath := fmt.Sprintf(
			"/Users/jacobaguon/support-triage/investigations/%d/investigation-1/%s-agent.log",
			investigationID,
			strings.ToLower(agentName),
		)

		// Check if file exists
		if _, err := os.Stat(logPath); os.IsNotExist(err) {
			return agentLogsLoadedMsg{
				investigationID: investigationID,
				agentName:       agentName,
				logs:            []LogEntry{},
			}
		}

		// Use tail to get last 50 lines
		cmd := exec.Command("tail", "-n", "50", logPath)
		output, err := cmd.Output()
		if err != nil {
			return errMsg{err}
		}

		// Parse JSONL logs
		var logs []LogEntry
		scanner := bufio.NewScanner(bytes.NewReader(output))
		for scanner.Scan() {
			var entry struct {
				Timestamp string `json:"ts"`
				Level     string `json:"level"`
				Message   string `json:"msg"`
			}
			if err := json.Unmarshal(scanner.Bytes(), &entry); err != nil {
				continue // Skip malformed lines
			}

			timestamp, _ := time.Parse(time.RFC3339, entry.Timestamp)
			logs = append(logs, LogEntry{
				Timestamp: timestamp,
				Level:     entry.Level,
				Message:   entry.Message,
			})
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
			"/Users/jacobaguon/support-triage/investigations/%d/investigation-1/%s-findings.md",
			investigationID,
			strings.ToLower(agentName),
		)

		// Check if file exists
		if _, err := os.Stat(findingsPath); os.IsNotExist(err) {
			return agentFindingsLoadedMsg{
				investigationID: investigationID,
				agentName:       agentName,
				findings:        []Finding{},
			}
		}

		content, err := os.ReadFile(findingsPath)
		if err != nil {
			return errMsg{err}
		}

		// Simple markdown parsing - extract ## headers as findings
		findings := parseMarkdownFindings(string(content))

		return agentFindingsLoadedMsg{
			investigationID: investigationID,
			agentName:       agentName,
			findings:        findings,
		}
	}
}

// Parse markdown to extract findings
func parseMarkdownFindings(content string) []Finding {
	var findings []Finding
	var currentFinding *Finding

	lines := strings.Split(content, "\n")
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// ## Header = new finding
		if strings.HasPrefix(trimmed, "## ") {
			if currentFinding != nil {
				findings = append(findings, *currentFinding)
			}
			currentFinding = &Finding{
				Title:   strings.TrimPrefix(trimmed, "## "),
				Details: []string{},
			}
		} else if currentFinding != nil && strings.HasPrefix(trimmed, "- ") {
			// Bullet point = detail
			detail := strings.TrimPrefix(trimmed, "- ")
			currentFinding.Details = append(currentFinding.Details, detail)
		}
	}

	// Add last finding
	if currentFinding != nil {
		findings = append(findings, *currentFinding)
	}

	return findings
}

// Approve checkpoint via Express API
func approveCheckpointCmd(investigationID int, checkpoint string) tea.Cmd {
	return func() tea.Msg {
		body := fmt.Sprintf(`{"action":"confirm","checkpoint":"%s"}`, checkpoint)
		url := fmt.Sprintf("%s/api/investigations/%d/checkpoint", apiBase, investigationID)

		resp, err := http.Post(url, "application/json", strings.NewReader(body))
		if err != nil {
			return errMsg{fmt.Errorf("API error: %w", err)}
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			return errMsg{fmt.Errorf("checkpoint approval failed: HTTP %d", resp.StatusCode)}
		}

		return checkpointApprovedMsg{investigationID: investigationID}
	}
}

// Load investigation summary
func loadSummaryCmd(investigationID int) tea.Cmd {
	return func() tea.Msg {
		summaryPath := fmt.Sprintf(
			"/Users/jacobaguon/support-triage/investigations/%d/investigation-1/summary.md",
			investigationID,
		)

		// Check if file exists
		if _, err := os.Stat(summaryPath); os.IsNotExist(err) {
			return summaryLoadedMsg{
				investigationID: investigationID,
				summary:         nil,
			}
		}

		content, err := os.ReadFile(summaryPath)
		if err != nil {
			return errMsg{err}
		}

		// Parse the summary markdown
		summary := parseSummaryMarkdown(string(content))
		summary.LoadedAt = time.Now()

		return summaryLoadedMsg{
			investigationID: investigationID,
			summary:         summary,
		}
	}
}

// Load customer response
func loadCustomerResponseCmd(investigationID int) tea.Cmd {
	return func() tea.Msg {
		responsePath := fmt.Sprintf(
			"/Users/jacobaguon/support-triage/investigations/%d/investigation-1/customer-response.md",
			investigationID,
		)

		// Check if file exists
		if _, err := os.Stat(responsePath); os.IsNotExist(err) {
			return customerResponseLoadedMsg{
				investigationID: investigationID,
				response:        nil,
			}
		}

		content, err := os.ReadFile(responsePath)
		if err != nil {
			return errMsg{err}
		}

		response := &CustomerResponse{
			Content:  string(content),
			LastEdited: time.Now(),
		}

		return customerResponseLoadedMsg{
			investigationID: investigationID,
			response:        response,
		}
	}
}

// Parse summary markdown into structured data
func parseSummaryMarkdown(content string) *InvestigationSummary {
	summary := &InvestigationSummary{
		KeyFindings: make(map[string][]string),
	}

	lines := strings.Split(content, "\n")
	currentSection := ""
	currentAgent := ""

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Section headers
		if strings.HasPrefix(trimmed, "## ") {
			currentSection = strings.TrimPrefix(trimmed, "## ")
			continue
		}

		// Agent headers (### or bold **Agent:**)
		if strings.HasPrefix(trimmed, "### ") || strings.Contains(trimmed, "**") {
			// Extract agent name
			agentName := strings.TrimPrefix(trimmed, "### ")
			agentName = strings.TrimPrefix(agentName, "**")
			agentName = strings.TrimSuffix(agentName, "**")
			agentName = strings.TrimSuffix(agentName, ":")
			agentName = strings.TrimSpace(agentName)

			// Check if it's an agent name
			if strings.Contains(agentName, "Slack") {
				currentAgent = "Slack"
			} else if strings.Contains(agentName, "Linear") {
				currentAgent = "Linear"
			} else if strings.Contains(agentName, "Pylon") {
				currentAgent = "Pylon"
			} else if strings.Contains(agentName, "Codebase") {
				currentAgent = "Codebase"
			}
			continue
		}

		// Content based on section
		if currentSection == "Root Cause" && trimmed != "" {
			summary.RootCause += trimmed + " "
		} else if currentSection == "Key Findings" && currentAgent != "" && strings.HasPrefix(trimmed, "- ") {
			finding := strings.TrimPrefix(trimmed, "- ")
			summary.KeyFindings[currentAgent] = append(summary.KeyFindings[currentAgent], finding)
		} else if currentSection == "Open Questions" && strings.HasPrefix(trimmed, "- ") {
			question := strings.TrimPrefix(trimmed, "- ")
			summary.OpenQuestions = append(summary.OpenQuestions, question)
		} else if currentSection == "Next Steps" && strings.HasPrefix(trimmed, "- ") {
			step := strings.TrimPrefix(trimmed, "- ")
			summary.NextSteps = append(summary.NextSteps, step)
		}
	}

	summary.RootCause = strings.TrimSpace(summary.RootCause)
	return summary
}

// Save edited customer response
func saveCustomerResponseCmd(investigationID int, content string) tea.Cmd {
	return func() tea.Msg {
		responsePath := fmt.Sprintf(
			"/Users/jacobaguon/support-triage/investigations/%d/investigation-1/customer-response.md",
			investigationID,
		)

		err := os.WriteFile(responsePath, []byte(content), 0644)
		if err != nil {
			return errMsg{err}
		}

		return responseSavedMsg{investigationID: investigationID}
	}
}

// Post customer response to Pylon via MCP
func postToPylonCmd(investigationID int, content string) tea.Cmd {
	return func() tea.Msg {
		// Use Pylon MCP to post the response
		// First, we need to get the ticket ID from the investigation
		cmd := exec.Command(cliPath, "status", strconv.Itoa(investigationID), "--json")
		output, err := cmd.Output()
		if err != nil {
			return errMsg{fmt.Errorf("failed to get investigation status: %w", err)}
		}

		var status struct {
			Investigation struct {
				ID int `json:"id"`
			} `json:"investigation"`
		}
		err = json.Unmarshal(output, &status)
		if err != nil {
			return errMsg{fmt.Errorf("failed to parse investigation status: %w", err)}
		}

		// Use the pylon MCP tool to post a message
		// For now, just mark as posted (actual MCP integration would go here)
		// TODO: Implement actual Pylon MCP call:
		// mcp__pylon__pylon_update_issue with the response content

		return responsePostedMsg{investigationID: investigationID}
	}
}

// Copy to clipboard (uses pbcopy on macOS)
func copyToClipboardCmd(content string) tea.Cmd {
	return func() tea.Msg {
		cmd := exec.Command("pbcopy")
		cmd.Stdin = strings.NewReader(content)
		err := cmd.Run()
		if err != nil {
			return errMsg{err}
		}
		return responseCopiedMsg{}
	}
}

// Create a new investigation via CLI
func createInvestigationCmd(ticketID, skill, context string) tea.Cmd {
	return func() tea.Msg {
		args := []string{"create", "--ticket", ticketID, "--skill", skill}
		if context != "" {
			args = append(args, "--context", context)
		}

		cmd := exec.Command(cliPath, args...)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return investigationCreatedMsg{err: fmt.Errorf("create failed: %w\n%s", err, string(output))}
		}

		return investigationCreatedMsg{investigationID: 0, err: nil}
	}
}

// Periodic refresh tick
func tickCmd() tea.Cmd {
	return tea.Tick(time.Second*2, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}
