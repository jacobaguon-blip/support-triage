import { useState } from 'react'
import { saveSettings } from '../services/sqlite'
import '../styles/SettingsPane.css'

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
