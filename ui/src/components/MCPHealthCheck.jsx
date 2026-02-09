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
  const [expandedService, setExpandedService] = useState(null)
  const [copied, setCopied] = useState(null)

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

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function getResolutionSteps(serviceKey, server) {
    const steps = {
      claude: {
        title: 'Fix Claude CLI Authentication',
        steps: [
          { text: 'Run this command in your terminal:', command: 'claude /login' },
          { text: 'Follow the browser prompts to authenticate' },
          { text: 'Return here and click "Re-check" to verify' }
        ],
        docs: 'https://docs.anthropic.com/claude-code'
      },
      pylon: {
        title: 'Configure Pylon MCP Server',
        steps: [
          { text: 'Check your MCP server configuration in ~/.claude/mcp.json' },
          { text: 'Verify Pylon API credentials are set' },
          { text: 'Ensure the Pylon MCP server is running' },
          { text: 'Test with:', command: 'claude -p "Using Pylon MCP, list issues with limit 1"' }
        ],
        docs: 'https://pylon.com/docs/api'
      },
      linear: {
        title: 'Configure Linear MCP Server',
        steps: [
          { text: 'Check your MCP server configuration in ~/.claude/mcp.json' },
          { text: 'Verify Linear API key is set' },
          { text: 'Ensure the Linear MCP server is running' },
          { text: 'Test with:', command: 'claude -p "Using Linear MCP, search for issues"' }
        ],
        docs: 'https://developers.linear.app'
      },
      slack: {
        title: 'Configure Slack MCP Server',
        steps: [
          { text: 'Check your MCP server configuration in ~/.claude/mcp.json' },
          { text: 'Verify Slack API token is set' },
          { text: 'Ensure the Slack MCP server is running' },
          { text: 'Test with:', command: 'claude -p "Using Slack MCP, search for messages"' }
        ],
        docs: 'https://api.slack.com/docs'
      },
      notion: {
        title: 'Configure Notion MCP Server',
        steps: [
          { text: 'Check your MCP server configuration in ~/.claude/mcp.json' },
          { text: 'Verify Notion integration token is set' },
          { text: 'Ensure the Notion MCP server is running' },
          { text: 'Test with:', command: 'claude -p "Using Notion MCP, search for pages"' }
        ],
        docs: 'https://developers.notion.com'
      }
    }
    return steps[serviceKey] || null
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
            {Object.entries(servers).map(([key, server]) => {
              const isExpanded = expandedService === key
              const resolution = getResolutionSteps(key, server)
              const hasError = server.status === 'error'

              return (
                <div key={key} className={`mcp-health-item ${getStatusClass(server.status)}`}>
                  <div className="mcp-health-item-header">
                    <span className="status-icon">{getStatusIcon(server.status)}</span>
                    <span className="server-name">{server.server}</span>
                    {hasError && resolution && (
                      <button
                        className="btn-expand"
                        onClick={() => setExpandedService(isExpanded ? null : key)}
                        title="Show resolution steps"
                      >
                        {isExpanded ? '▼ Hide Fix' : '▶ How to Fix'}
                      </button>
                    )}
                  </div>
                  <div className="mcp-health-item-message">
                    {server.message || 'Unknown status'}
                  </div>

                  {/* Expandable resolution section */}
                  {hasError && isExpanded && resolution && (
                    <div className="mcp-resolution-section">
                      <h4>{resolution.title}</h4>
                      <ol className="resolution-steps">
                        {resolution.steps.map((step, idx) => (
                          <li key={idx}>
                            <span>{step.text}</span>
                            {step.command && (
                              <div className="command-box">
                                <code>{step.command}</code>
                                <button
                                  className="btn-copy"
                                  onClick={() => copyToClipboard(step.command, `${key}-${idx}`)}
                                  title="Copy to clipboard"
                                >
                                  {copied === `${key}-${idx}` ? '✓ Copied!' : '📋 Copy'}
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                      {resolution.docs && (
                        <a
                          href={resolution.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="docs-link"
                        >
                          📚 View Documentation →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {hasErrors && (
            <div className="mcp-health-warning">
              <strong>⚠ Some Services Are Unavailable</strong>
              <p className="warning-note">
                Click "How to Fix" on any failed service above for step-by-step resolution instructions.
                You can continue anyway, but investigations may fail if required services are unavailable.
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
