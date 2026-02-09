import { useState, useEffect, useRef, useCallback } from 'react'
import { saveSettings, loadBugReports, submitBugReport } from '../services/sqlite'
import '../styles/SettingsPane.css'

function BugReporter() {
  const [reports, setReports] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [screenshotData, setScreenshotData] = useState(null)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    category: 'ui',
    investigationId: ''
  })

  useEffect(() => {
    loadBugReports().then(setReports)
  }, [])

  const handleScreenshot = useCallback((dataUrl) => {
    setScreenshotPreview(dataUrl)
    setScreenshotData(dataUrl)
  }, [])

  // Handle paste from clipboard (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (!showForm) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          const reader = new FileReader()
          reader.onload = (ev) => handleScreenshot(ev.target.result)
          reader.readAsDataURL(file)
          return
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [showForm, handleScreenshot])

  const handleFileDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropZoneRef.current?.classList.remove('drag-over')
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => handleScreenshot(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => handleScreenshot(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) return
    setSubmitting(true)
    try {
      const result = await submitBugReport({
        ...form,
        investigationId: form.investigationId || undefined,
        screenshot: screenshotData || undefined
      })
      setSubmitted(result)
      setForm({ title: '', description: '', severity: 'medium', category: 'ui', investigationId: '' })
      setScreenshotPreview(null)
      setScreenshotData(null)
      // Refresh list
      const updated = await loadBugReports()
      setReports(updated)
      // Auto-dismiss success after 4s
      setTimeout(() => {
        setSubmitted(null)
        setShowForm(false)
      }, 4000)
    } catch (err) {
      alert(`Failed to submit: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="settings-section card bug-reporter">
      <div className="bug-reporter-header">
        <div>
          <h3>Bug Reporter</h3>
          <p className="section-description">
            File bugs for your Claude Code agent to fix
          </p>
        </div>
        <button
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => { setShowForm(!showForm); setSubmitted(null) }}
          style={{ fontSize: '0.85em', padding: '6px 14px' }}
        >
          {showForm ? 'Cancel' : '+ New Bug Report'}
        </button>
      </div>

      {submitted && (
        <div className="bug-success">
          Bug report saved to <code>{submitted.filename}</code>
          <br />
          <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
            Run your Claude Code agent in the project directory to pick it up.
          </span>
        </div>
      )}

      {showForm && !submitted && (
        <div className="bug-form">
          <div className="bug-form-row">
            <label className="setting-label">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Phase 0 fails when Claude CLI auth expires"
              className="bug-input"
              autoFocus
            />
          </div>

          <div className="bug-form-row">
            <label className="setting-label">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What happened? What did you expect? Steps to reproduce..."
              className="bug-textarea"
              rows={4}
            />
          </div>

          <div className="bug-form-grid">
            <div>
              <label className="setting-label">Severity</label>
              <select
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="bug-select"
              >
                <option value="critical">Critical - system unusable</option>
                <option value="high">High - major feature broken</option>
                <option value="medium">Medium - workaround exists</option>
                <option value="low">Low - cosmetic / minor</option>
              </select>
            </div>
            <div>
              <label className="setting-label">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="bug-select"
              >
                <option value="ui">UI / Frontend</option>
                <option value="backend">Backend / API</option>
                <option value="investigation-runner">Investigation Runner</option>
                <option value="claude-cli">Claude CLI Integration</option>
                <option value="mcp-tools">MCP Tools</option>
                <option value="database">Database</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="setting-label">Investigation # (optional)</label>
              <input
                type="text"
                value={form.investigationId}
                onChange={e => setForm(f => ({ ...f, investigationId: e.target.value }))}
                placeholder="e.g. 8317"
                className="bug-input"
              />
            </div>
          </div>

          {/* Screenshot area */}
          <div className="bug-form-row">
            <label className="setting-label">Screenshot (paste, drag, or browse)</label>
            <div
              ref={dropZoneRef}
              className={`bug-dropzone ${screenshotPreview ? 'has-image' : ''}`}
              onDragOver={e => { e.preventDefault(); dropZoneRef.current?.classList.add('drag-over') }}
              onDragLeave={() => dropZoneRef.current?.classList.remove('drag-over')}
              onDrop={handleFileDrop}
              onClick={() => !screenshotPreview && fileInputRef.current?.click()}
            >
              {screenshotPreview ? (
                <div className="bug-screenshot-preview">
                  <img src={screenshotPreview} alt="Screenshot preview" />
                  <button
                    className="bug-screenshot-remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      setScreenshotPreview(null)
                      setScreenshotData(null)
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="bug-dropzone-label">
                  Paste (Cmd+V), drag an image here, or click to browse
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="bug-form-actions">
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !form.title.trim() || !form.description.trim()}
            >
              {submitting ? 'Saving...' : 'Submit Bug Report'}
            </button>
          </div>
        </div>
      )}

      {/* Past reports */}
      {reports.length > 0 && (
        <div className="bug-reports-list">
          <h4 style={{ marginBottom: '8px', fontSize: '0.95em' }}>
            Recent Reports ({reports.length})
          </h4>
          {reports.slice(0, 10).map(r => (
            <div key={r.filename} className="bug-report-item">
              <span className={`bug-severity-dot severity-${r.severity}`} />
              <span className="bug-report-title">{r.title}</span>
              <span className="bug-report-status">{r.status}</span>
              {r.hasScreenshot && <span className="bug-report-badge">img</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SettingsPane({ settings, onClose }) {
  const [localSettings, setLocalSettings] = useState(settings || {})

  const handleSave = async () => {
    try {
      await saveSettings(localSettings)
      onClose()
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`)
    }
  }

  const handleCheckpointToggle = (checkpointId) => {
    setLocalSettings(prev => ({
      ...prev,
      checkpoints: {
        ...prev.checkpoints,
        [checkpointId]: {
          ...prev.checkpoints[checkpointId],
          enabled: !prev.checkpoints[checkpointId]?.enabled
        }
      }
    }))
  }

  const handleConcurrencyChange = (value) => {
    setLocalSettings(prev => ({
      ...prev,
      concurrency: {
        ...prev.concurrency,
        max_active_investigations: parseInt(value)
      }
    }))
  }

  const handleAgentModeChange = (value) => {
    setLocalSettings(prev => ({
      ...prev,
      agent_mode: {
        ...prev.agent_mode,
        default: value
      }
    }))
  }

  const handleCodeReviewDepthChange = (value) => {
    setLocalSettings(prev => ({
      ...prev,
      code_review: {
        ...prev.code_review,
        default_depth: parseInt(value)
      }
    }))
  }

  if (!settings) {
    return <div className="settings-pane">Loading settings...</div>
  }

  return (
    <div className="settings-pane">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="btn btn-secondary" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      <div className="settings-content">
        {/* Bug Reporter — first section for visibility */}
        <BugReporter />

        {/* Checkpoints Configuration */}
        <section className="settings-section card">
          <h3>Checkpoints</h3>
          <p className="section-description">
            Configure which checkpoints are enabled during investigations
          </p>

          {Object.entries(localSettings.checkpoints || {}).map(([id, checkpoint]) => (
            <div key={id} className="setting-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={checkpoint.enabled}
                  onChange={() => handleCheckpointToggle(id)}
                />
                <span className="checkpoint-name">
                  {checkpoint.name || id.replace(/_/g, ' ')}
                </span>
              </label>
              {checkpoint.description && (
                <p className="setting-description">{checkpoint.description}</p>
              )}
            </div>
          ))}
        </section>

        {/* Concurrency Settings */}
        <section className="settings-section card">
          <h3>Concurrency</h3>
          <p className="section-description">
            Control how many investigations can run simultaneously
          </p>

          <div className="setting-row">
            <label className="setting-label">
              Max Active Investigations
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={localSettings.concurrency?.max_active_investigations || 3}
              onChange={(e) => handleConcurrencyChange(e.target.value)}
              className="number-input"
            />
          </div>
        </section>

        {/* Agent Mode Settings */}
        <section className="settings-section card">
          <h3>Agent Mode</h3>
          <p className="section-description">
            Choose default mode for running investigations
          </p>

          <div className="setting-row">
            <label className="radio-label">
              <input
                type="radio"
                name="agent_mode"
                value="team"
                checked={localSettings.agent_mode?.default === 'team'}
                onChange={(e) => handleAgentModeChange(e.target.value)}
              />
              <div>
                <span className="radio-title">Team Mode</span>
                <p className="radio-description">
                  3 specialist agents run in parallel (faster, requires Agent Teams feature)
                </p>
              </div>
            </label>
          </div>

          <div className="setting-row">
            <label className="radio-label">
              <input
                type="radio"
                name="agent_mode"
                value="single"
                checked={localSettings.agent_mode?.default === 'single'}
                onChange={(e) => handleAgentModeChange(e.target.value)}
              />
              <div>
                <span className="radio-title">Single Agent Mode</span>
                <p className="radio-description">
                  One agent performs all roles sequentially (slower but always available)
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Code Review Settings */}
        <section className="settings-section card">
          <h3>Code Review Depth</h3>
          <p className="section-description">
            Default depth for code analysis during investigations
          </p>

          <div className="setting-row">
            <label className="radio-label">
              <input
                type="radio"
                name="code_depth"
                value="2"
                checked={localSettings.code_review?.default_depth === 2}
                onChange={(e) => handleCodeReviewDepthChange(e.target.value)}
              />
              <div>
                <span className="radio-title">Level 2 - Error Trace (Recommended)</span>
                <p className="radio-description">
                  Match error to code paths, identify files and lines, explain what code does
                </p>
              </div>
            </label>
          </div>

          <div className="setting-row">
            <label className="radio-label">
              <input
                type="radio"
                name="code_depth"
                value="3"
                checked={localSettings.code_review?.default_depth === 3}
                onChange={(e) => handleCodeReviewDepthChange(e.target.value)}
              />
              <div>
                <span className="radio-title">Level 3 - Root Cause Analysis</span>
                <p className="radio-description">
                  Reason about why code is broken, propose fixes (slower)
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Customer Response Style */}
        <section className="settings-section card">
          <h3>Customer Response Style</h3>
          <p className="section-description">
            Rules learned from feedback over time
          </p>

          <div className="style-lists">
            <div className="style-list">
              <h4>Always Include</h4>
              <ul className="style-items">
                {(localSettings.customer_response_style?.always_include || []).length === 0 ? (
                  <li className="empty-item">No rules yet - built through feedback</li>
                ) : (
                  localSettings.customer_response_style.always_include.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))
                )}
              </ul>
            </div>

            <div className="style-list">
              <h4>Never Do</h4>
              <ul className="style-items">
                {(localSettings.customer_response_style?.never_do || []).length === 0 ? (
                  <li className="empty-item">No rules yet - built through feedback</li>
                ) : (
                  localSettings.customer_response_style.never_do.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Feature Requests — moved to Admin Portal */}
        <section className="settings-section card">
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
              Feature requests have moved to the Admin Portal
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Click the <strong>Admin</strong> button in the header → <strong>Feature Board</strong> tab
            </p>
          </div>
        </section>
      </div>

      <div className="settings-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  )
}

export default SettingsPane
