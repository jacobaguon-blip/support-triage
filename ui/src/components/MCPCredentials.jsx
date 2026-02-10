import { useState, useEffect } from 'react'
import '../styles/MCPCredentials.css'

/**
 * MCP Credentials Management
 * UI for adding, editing, and testing MCP server credentials
 */
export default function MCPCredentials({ onClose }) {
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [authMethod, setAuthMethod] = useState({}) // Track auth method per service
  const [showApiKey, setShowApiKey] = useState({})
  const [formData, setFormData] = useState({ api_key: '', is_enabled: true })
  const [testResults, setTestResults] = useState({})
  const [saving, setSaving] = useState(false)

  const services = [
    { id: 'pylon', name: 'Pylon', description: 'Ticket management and customer support', supportsOAuth: false },
    { id: 'linear', name: 'Linear', description: 'Issue tracking and project management', supportsOAuth: true },
    { id: 'slack', name: 'Slack', description: 'Team communication and context search', supportsOAuth: false },
    { id: 'notion', name: 'Notion', description: 'Documentation and knowledge base', supportsOAuth: false }
  ]

  useEffect(() => {
    loadCredentials()

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search)
    const oauthSuccess = urlParams.get('oauth_success')
    const oauthError = urlParams.get('oauth_error')
    const service = urlParams.get('service')

    if (oauthSuccess && service) {
      setTestResults({ [service]: { success: true, message: `Successfully connected with ${service} via OAuth!` } })
      setTimeout(() => setTestResults({}), 5000)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (oauthError) {
      const serviceName = service || 'the service'
      setTestResults({ [serviceName]: { success: false, error: decodeURIComponent(oauthError) } })
      setTimeout(() => setTestResults({}), 8000)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function loadCredentials() {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/credentials/mcp')
      if (!response.ok) throw new Error('Failed to load credentials')
      const data = await response.json()
      setCredentials(data)
    } catch (err) {
      console.error('Error loading credentials:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(service) {
    try {
      setSaving(true)
      const response = await fetch(`http://localhost:3001/api/credentials/mcp/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save credentials')

      await loadCredentials()
      setEditing(null)
      setFormData({ api_key: '', is_enabled: true })
      setTestResults({ ...testResults, [service]: { success: true, message: 'Credentials saved successfully' } })
      setTimeout(() => setTestResults(prev => ({ ...prev, [service]: null })), 3000)
    } catch (err) {
      console.error('Error saving credentials:', err)
      setTestResults({ ...testResults, [service]: { success: false, error: err.message } })
    } finally {
      setSaving(false)
    }
  }

  async function handleTest(service) {
    try {
      const apiKey = editing === service ? formData.api_key : null
      if (!apiKey) {
        setTestResults({ ...testResults, [service]: { success: false, error: 'Enter API key first' } })
        return
      }

      setTestResults({ ...testResults, [service]: { testing: true } })

      const response = await fetch(`http://localhost:3001/api/credentials/mcp/${service}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey })
      })

      const result = await response.json()
      setTestResults({ ...testResults, [service]: result })
      setTimeout(() => setTestResults(prev => ({ ...prev, [service]: null })), 5000)
    } catch (err) {
      setTestResults({ ...testResults, [service]: { success: false, error: err.message } })
    }
  }

  async function handleDelete(service) {
    if (!confirm(`Delete credentials for ${service}? This cannot be undone.`)) return

    try {
      const response = await fetch(`http://localhost:3001/api/credentials/mcp/${service}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete credentials')

      await loadCredentials()
      setTestResults({ ...testResults, [service]: { success: true, message: 'Credentials deleted' } })
      setTimeout(() => setTestResults(prev => ({ ...prev, [service]: null })), 3000)
    } catch (err) {
      console.error('Error deleting credentials:', err)
    }
  }

  async function handleToggle(service, isEnabled) {
    try {
      const response = await fetch(`http://localhost:3001/api/credentials/mcp/${service}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: isEnabled })
      })

      if (!response.ok) throw new Error('Failed to toggle credential')

      await loadCredentials()
    } catch (err) {
      console.error('Error toggling credential:', err)
    }
  }

  function startEdit(service) {
    setEditing(service)
    const existing = credentials.find(c => c.service === service)
    const currentAuthType = existing?.auth_type || 'api_key'

    setAuthMethod({ ...authMethod, [service]: currentAuthType })
    setFormData({
      api_key: '',
      is_enabled: existing ? existing.is_enabled : true
    })
    setTestResults({ ...testResults, [service]: null })
  }

  function cancelEdit() {
    setEditing(null)
    setFormData({ api_key: '', is_enabled: true })
  }

  function handleOAuthConnect(service) {
    // Redirect to OAuth authorization endpoint
    window.location.href = `http://localhost:3001/api/oauth/authorize/${service}`
  }

  function getStatus(service) {
    const cred = credentials.find(c => c.service === service.id)
    if (!cred) return { configured: false, enabled: false, authType: 'api_key' }
    return {
      configured: true,
      enabled: cred.is_enabled === 1,
      authType: cred.auth_type || 'api_key',
      tokenExpiresAt: cred.token_expires_at
    }
  }

  if (loading) {
    return (
      <div className="mcp-credentials">
        <div className="credentials-header">
          <h2>MCP Credentials</h2>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        <div className="credentials-body">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading credentials...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mcp-credentials">
      <div className="credentials-header">
        <h2>MCP Server Credentials</h2>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>

      <div className="credentials-body">
        <p className="credentials-intro">
          Configure API credentials for MCP servers. These are encrypted and stored locally.
          The app will auto-generate <code>~/.claude/mcp.json</code> on startup.
        </p>

        <div className="credentials-grid">
          {services.map(service => {
            const status = getStatus(service)
            const isEditing = editing === service.id
            const result = testResults[service.id]

            return (
              <div key={service.id} className={`credential-card ${status.configured ? 'configured' : 'unconfigured'}`}>
                <div className="credential-card-header">
                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                  </div>
                  <div className="service-status">
                    {status.configured ? (
                      <>
                        <span className={`status-badge ${status.enabled ? 'enabled' : 'disabled'}`}>
                          {status.enabled ? '✓ Enabled' : '○ Disabled'}
                        </span>
                        {status.authType === 'oauth' && (
                          <span className="status-badge oauth-badge">OAuth</span>
                        )}
                      </>
                    ) : (
                      <span className="status-badge unconfigured">Not Configured</span>
                    )}
                  </div>
                </div>

                {!isEditing && status.configured && (
                  <div className="credential-actions">
                    <button onClick={() => startEdit(service.id)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="btn-delete">
                      Delete
                    </button>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={status.enabled}
                        onChange={(e) => handleToggle(service.id, e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                )}

                {!isEditing && !status.configured && (
                  <div className="credential-actions">
                    <button onClick={() => startEdit(service.id)} className="btn-configure">
                      + Configure
                    </button>
                  </div>
                )}

                {isEditing && (
                  <div className="credential-form">
                    {/* Auth method selector - only show if service supports OAuth */}
                    {service.supportsOAuth && (
                      <div className="auth-method-selector">
                        <button
                          className={`auth-method-btn ${(authMethod[service.id] || 'api_key') === 'api_key' ? 'active' : ''}`}
                          onClick={() => setAuthMethod({ ...authMethod, [service.id]: 'api_key' })}
                        >
                          🔑 API Key
                        </button>
                        <button
                          className={`auth-method-btn ${(authMethod[service.id] || 'api_key') === 'oauth' ? 'active' : ''}`}
                          onClick={() => setAuthMethod({ ...authMethod, [service.id]: 'oauth' })}
                        >
                          🔐 OAuth
                        </button>
                      </div>
                    )}

                    {/* API Key input */}
                    {(!service.supportsOAuth || (authMethod[service.id] || 'api_key') === 'api_key') && (
                      <div className="form-group">
                        <label>API Key / Token</label>
                        <div className="input-with-toggle">
                          <input
                            type={showApiKey[service.id] ? 'text' : 'password'}
                            value={formData.api_key}
                            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            placeholder={`Enter ${service.name} API key...`}
                            autoFocus
                          />
                          <button
                            onClick={() => setShowApiKey({ ...showApiKey, [service.id]: !showApiKey[service.id] })}
                            className="btn-toggle-visibility"
                            title={showApiKey[service.id] ? 'Hide' : 'Show'}
                          >
                            {showApiKey[service.id] ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* OAuth connect button */}
                    {service.supportsOAuth && (authMethod[service.id] || 'api_key') === 'oauth' && (
                      <div className="oauth-section">
                        <p className="oauth-info">
                          Click the button below to authenticate with {service.name} using OAuth.
                          You'll be redirected to {service.name}'s authorization page.
                        </p>
                        <button
                          onClick={() => handleOAuthConnect(service.id)}
                          className="btn-oauth-connect"
                        >
                          Connect with {service.name}
                        </button>
                      </div>
                    )}

                    {result && (
                      <div className={`test-result ${result.success ? 'success' : 'error'}`}>
                        {result.testing ? '⏳ Testing...' : result.success ? `✓ ${result.message}` : `✗ ${result.error}`}
                      </div>
                    )}

                    {/* Form actions - only show for API key method */}
                    {(!service.supportsOAuth || (authMethod[service.id] || 'api_key') === 'api_key') && (
                      <div className="form-actions">
                        <button onClick={() => handleTest(service.id)} className="btn-test" disabled={!formData.api_key}>
                          Test Connection
                        </button>
                        <button onClick={() => handleSave(service.id)} className="btn-save" disabled={saving || !formData.api_key}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={cancelEdit} className="btn-cancel">
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Cancel button for OAuth */}
                    {service.supportsOAuth && (authMethod[service.id] || 'api_key') === 'oauth' && (
                      <div className="form-actions">
                        <button onClick={cancelEdit} className="btn-cancel">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="credentials-footer">
          <div className="encryption-info">
            <strong>🔒 Security:</strong> All credentials are encrypted using AES-256-GCM before storage.
          </div>
        </div>
      </div>
    </div>
  )
}
