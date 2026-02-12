package main

import "time"

// Message types for async updates

type investigationsLoadedMsg struct {
	investigations []Investigation
}

type agentStatusesLoadedMsg struct {
	investigationID int
	agents          map[string]*AgentState
}

type agentLogsLoadedMsg struct {
	investigationID int
	agentName       string
	logs            []LogEntry
}

type agentFindingsLoadedMsg struct {
	investigationID int
	agentName       string
	findings        []Finding
}

type checkpointApprovedMsg struct {
	investigationID int
}

type summaryLoadedMsg struct {
	investigationID int
	summary         *InvestigationSummary
}

type customerResponseLoadedMsg struct {
	investigationID int
	response        *CustomerResponse
}

type responseEditedMsg struct {
	investigationID int
	newContent      string
}

type responseCopiedMsg struct {
	investigationID int
}

type responseSavedMsg struct {
	investigationID int
}

type responsePostedMsg struct {
	investigationID int
}

type errMsg struct {
	err error
}

func (e errMsg) Error() string {
	return e.err.Error()
}

// tickMsg is sent periodically to trigger refresh of running investigations
type tickMsg time.Time
