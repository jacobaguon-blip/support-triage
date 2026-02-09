// SQLite database service — connects to Express backend API

const API_BASE = '/api'

export async function loadInvestigations() {
  const res = await fetch(`${API_BASE}/investigations`)
  if (!res.ok) throw new Error(`Failed to load investigations: ${res.statusText}`)
  return res.json()
}

export async function loadSettings() {
  const res = await fetch(`${API_BASE}/settings`)
  if (!res.ok) throw new Error(`Failed to load settings: ${res.statusText}`)
  return res.json()
}

export async function saveSettings(settings) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!res.ok) throw new Error(`Failed to save settings: ${res.statusText}`)
  return res.json()
}

export async function createInvestigation(ticketId, agentMode = 'team') {
  const res = await fetch(`${API_BASE}/investigations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, agentMode })
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to create investigation')
  }
  return data
}

export async function updateInvestigation(id, updates) {
  const res = await fetch(`${API_BASE}/investigations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  if (!res.ok) throw new Error(`Failed to update investigation: ${res.statusText}`)
  return res.json()
}

export async function sendCheckpointAction(id, checkpoint, action, feedback) {
  const res = await fetch(`${API_BASE}/investigations/${id}/checkpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkpoint, action, feedback })
  })
  if (!res.ok) throw new Error(`Failed to send checkpoint action: ${res.statusText}`)
  return res.json()
}

export async function loadInvestigationFiles(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/investigations/${ticketId}/files`)
    if (!res.ok) return { summary: null, customerResponse: null, linearDraft: null, checkpointActions: [], activity: [] }
    return res.json()
  } catch {
    return { summary: null, customerResponse: null, linearDraft: null, checkpointActions: [], activity: [] }
  }
}

export async function loadActivityLog(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/investigations/${ticketId}/activity`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// ============ CONVERSATION & VERSION CONTROL ============

export async function loadConversation(ticketId, since = null) {
  try {
    const url = since
      ? `${API_BASE}/investigations/${ticketId}/conversation?since=${encodeURIComponent(since)}`
      : `${API_BASE}/investigations/${ticketId}/conversation`
    const res = await fetch(url)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function loadVersions(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/investigations/${ticketId}/versions`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function restoreVersion(ticketId, versionId, mode) {
  const res = await fetch(`${API_BASE}/investigations/${ticketId}/versions/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionId, mode })
  })
  if (!res.ok) throw new Error(`Failed to restore version: ${res.statusText}`)
  return res.json()
}

export async function syncResponses(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/investigations/${ticketId}/sync-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) return { newCount: 0, totalCount: 0, newResponses: [] }
    return res.json()
  } catch {
    return { newCount: 0, totalCount: 0, newResponses: [] }
  }
}

// ============ INVESTIGATION RUNS ============

export async function loadRuns(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/investigations/${ticketId}/runs`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function loadRunConversation(ticketId, runNumber, since = null) {
  try {
    const url = since
      ? `${API_BASE}/investigations/${ticketId}/runs/${runNumber}/conversation?since=${encodeURIComponent(since)}`
      : `${API_BASE}/investigations/${ticketId}/runs/${runNumber}/conversation`
    const res = await fetch(url)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function hardReset(ticketId) {
  let res
  try {
    res = await fetch(`${API_BASE}/investigations/${ticketId}/hard-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}. Is the server running on port 3001?`)
  }
  let data
  try {
    data = await res.json()
  } catch (parseErr) {
    const text = await res.text().catch(() => '(empty)')
    throw new Error(`Server returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    throw new Error(data.message || data.error || `Server error (status ${res.status})`)
  }
  return data
}

export async function checkNewResponses(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/investigations/${ticketId}/check-new-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) return { hasNew: false }
    return res.json()
  } catch {
    return { hasNew: false }
  }
}

export async function getDebounceStatus(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/investigations/${ticketId}/debounce-status`)
    if (!res.ok) return { active: false }
    return res.json()
  } catch {
    return { active: false }
  }
}

// ============ ADMIN PORTAL ============

export async function loadAdminStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ============ FEATURE REQUESTS ============

export async function loadFeatureRequests() {
  try {
    const res = await fetch(`${API_BASE}/feature-requests`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function createFeatureRequest(data) {
  const res = await fetch(`${API_BASE}/feature-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create feature request' }))
    throw new Error(err.error || 'Failed to create feature request')
  }
  return res.json()
}

export async function updateFeatureRequest(id, data) {
  const res = await fetch(`${API_BASE}/feature-requests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update feature request' }))
    throw new Error(err.error || 'Failed to update feature request')
  }
  return res.json()
}

// ============ BUG REPORTS ============

export async function loadBugReports() {
  try {
    const res = await fetch(`${API_BASE}/bug-reports`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function submitBugReport(data) {
  const res = await fetch(`${API_BASE}/bug-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit bug report' }))
    throw new Error(err.error || 'Failed to submit bug report')
  }
  return res.json()
}

export async function deleteFeatureRequest(id) {
  const res = await fetch(`${API_BASE}/feature-requests/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete feature request' }))
    throw new Error(err.error || 'Failed to delete feature request')
  }
  return res.json()
}
