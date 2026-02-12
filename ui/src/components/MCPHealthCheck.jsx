import { useState, useEffect } from 'react'
import '../styles/MCPHealthCheck.css'

/**
 * MCPHealthCheck - Validates all MCP servers on startup
 * Shows as a non-blocking banner at the top of the page.
 * Auto-dismisses after 5 seconds if all services are OK.
 */
export default function MCPHealthCheck({ onClose }) {
  const [checking, setChecking] = useState(true)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [expandedService, setExpandedService] = useState(null)
  const [copied, setCopied] = useState(null)
  const [expanded, setExpanded] = useState(false)

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

  // Auto-dismiss after 5 seconds if all services are OK
  useEffect(() => {
    if (!checking && results && results.overall === 'ok') {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [checking, results, onClose])

  // Banner: checking state
  if (checking) {
    return (
      <div className="mcp-health-banner mcp-health-banner--checking">
        <div className="mcp-health-banner__content">
          <div className="mcp-health-banner__spinner" />
          <span>Checking MCP servers...</span>
        </div>
        <button className="mcp-health-banner__close" onClick={onClose} title="Dismiss">✕</button>
      </div>
    )
  }

  // Banner: error contacting backend
  if (error) {
    return (
      <div className="mcp-health-banner mcp-health-banner--error">
        <div className="mcp-health-banner__content">
          <span className="mcp-health-banner__icon">✗</span>
          <span>Health check failed: {error}</span>
          <button className="mcp-health-banner__action" onClick={checkMCPServers}>Retry</button>
        </div>
        <button className="mcp-health-banner__close" onClick={onClose} title="Dismiss">✕</button>
      </div>
    )
  }

  if (!results) return null

  const { overall, servers } = results
  const hasErrors = overall === 'error'
  const okCount = Object.values(servers).filter(s => s.status === 'ok').length
  const totalCount = Object.values(servers).length

  // Compact banner
  return (
    <div className={`mcp-health-banner mcp-health-banner--${overall}`}>
      <div className="mcp-health-banner__content">
        <span className="mcp-health-banner__icon">
          {overall === 'ok' && '✓'}
          {overall === 'error' && '✗'}
          {overall === 'warning' && '⚠'}
        </span>
        <span>
          {overall === 'ok' && 'All systems ready'}
          {overall === 'error' && `${okCount}/${totalCount} services connected`}
          {overall === 'warning' && 'Partial connectivity'}
        </span>

        {hasErrors && (
          <button
            className="mcp-health-banner__action"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>
        )}

        <button className="mcp-health-banner__action" onClick={checkMCPServers}>
          Re-check
        </button>
      </div>
      <button className="mcp-health-banner__close" onClick={onClose} title="Dismiss">✕</button>

      {/* Expanded detail panel (only when user clicks "Show Details") */}
      {expanded && (
        <div className="mcp-health-banner__details">
          <div className="mcp-health-grid">
            {Object.entries(servers).map(([key, server]) => {
              const isServiceExpanded = expandedService === key
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
                        onClick={() => setExpandedService(isServiceExpanded ? null : key)}
                        title="Show resolution steps"
                      >
                        {isServiceExpanded ? '▼ Hide Fix' : '▶ How to Fix'}
                      </button>
                    )}
                  </div>
                  <div className="mcp-health-item-message">
                    {server.message || 'Unknown status'}
                  </div>

                  {hasError && isServiceExpanded && resolution && (
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
        </div>
      )}
    </div>
  )
}
