import { useState, useEffect } from 'react'
import '../styles/MCPHealthCheck.css'

/**
 * MCPHealthCheck - Validates all MCP servers on startup
 * Shows a modal with status of Pylon, Linear, Slack, Notion, and Claude CLI
 */
export default function MCPHealthCheck({ onClose }) {
  const [checking, setChecking] = useState(true)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkMCPServers()
  }, [])

  async function checkMCPServers() {
    try {
      setChecking(true)
      setError(null)

      const response = await fetch('http://localhost:3001/api/health/mcp')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      console.error('MCP health check failed:', err)
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  function getStatusIcon(status) {
    if (status === 'ok') return '✓'
    if (status === 'error') return '✗'
    return '?'
  }

  function getStatusClass(status) {
    if (status === 'ok') return 'status-ok'
    if (status === 'error') return 'status-error'
    return 'status-unknown'
  }

  if (checking) {
    return (
      <div className="mcp-health-modal-overlay">
        <div className="mcp-health-modal">
          <div className="mcp-health-header">
            <h2>Checking MCP Servers...</h2>
          </div>
          <div className="mcp-health-body">
            <div className="mcp-health-spinner">
              <div className="spinner"></div>
              <p>Validating access to Pylon, Linear, Slack, and Notion</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mcp-health-modal-overlay">
        <div className="mcp-health-modal">
          <div className="mcp-health-header error">
            <h2>Health Check Failed</h2>
          </div>
          <div className="mcp-health-body">
            <p className="error-message">{error}</p>
            <p className="error-hint">
              Make sure the backend server is running on port 3001
            </p>
          </div>
          <div className="mcp-health-footer">
            <button onClick={checkMCPServers} className="btn-retry">
              Retry
            </button>
            <button onClick={onClose} className="btn-dismiss">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!results) return null

  const { overall, servers } = results
  const hasErrors = overall === 'error'

  return (
    <div className="mcp-health-modal-overlay">
      <div className="mcp-health-modal">
        <div className={`mcp-health-header ${overall}`}>
          <h2>
            {overall === 'ok' && '✓ All Systems Ready'}
            {overall === 'error' && '✗ Some Services Unavailable'}
            {overall === 'warning' && '⚠ Partial Connectivity'}
          </h2>
        </div>

        <div className="mcp-health-body">
          <div className="mcp-health-grid">
            {Object.entries(servers).map(([key, server]) => (
              <div key={key} className={`mcp-health-item ${getStatusClass(server.status)}`}>
                <div className="mcp-health-item-header">
                  <span className="status-icon">{getStatusIcon(server.status)}</span>
                  <span className="server-name">{server.server}</span>
                </div>
                <div className="mcp-health-item-message">
                  {server.message || 'Unknown status'}
                </div>
              </div>
            ))}
          </div>

          {hasErrors && (
            <div className="mcp-health-warning">
              <strong>⚠ Action Required:</strong>
              <ul>
                {servers.claude?.status === 'error' && (
                  <li>Run <code>claude /login</code> in your terminal to authenticate</li>
                )}
                {(servers.pylon?.status === 'error' ||
                  servers.linear?.status === 'error' ||
                  servers.slack?.status === 'error' ||
                  servers.notion?.status === 'error') && (
                  <li>Check MCP server configuration and API credentials</li>
                )}
              </ul>
              <p className="warning-note">
                Investigations may fail if required services are unavailable.
              </p>
            </div>
          )}
        </div>

        <div className="mcp-health-footer">
          <button onClick={checkMCPServers} className="btn-retry">
            Re-check
          </button>
          {!hasErrors && (
            <button onClick={onClose} className="btn-primary">
              Continue
            </button>
          )}
          {hasErrors && (
            <button onClick={onClose} className="btn-dismiss">
              Continue Anyway
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
