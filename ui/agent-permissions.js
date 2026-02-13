/**
 * Per-agent tool declarations for the multi-agent Phase 1 system.
 *
 * When spawning `claude -p`, the --allowedTools flag explicitly authorizes
 * each agent's required tools. Without this, tools not in the project's
 * allow list are silently denied under defaultMode: "dontAsk".
 *
 * Tool names must match the exact patterns Claude Code uses:
 *   - MCP tools: mcp__{server}__{tool_name}
 *   - Built-in tools: Read, Grep, Glob, Bash, Edit, Write, WebSearch, WebFetch
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export const AGENT_REQUIRED_TOOLS = {
  pylon: {
    mcpServers: ['pylon'],
    tools: [
      'mcp__pylon__pylon_search_issues',
      'mcp__pylon__pylon_list_issues',
      'mcp__pylon__pylon_get_issue',
      'mcp__pylon__pylon_get_issue_body',
      'mcp__pylon__pylon_get_account',
      'mcp__pylon__pylon_search_accounts',
    ],
  },
  slack: {
    mcpServers: ['slack'],
    tools: [
      'mcp__slack__slack_list_channels',
      'mcp__slack__slack_get_channel_history',
      'mcp__slack__slack_get_thread_replies',
      'mcp__slack__slack_get_users',
      'mcp__slack__slack_get_user_profile',
    ],
  },
  linear: {
    mcpServers: ['linear'],
    tools: [
      'mcp__linear-server__search_issues',
      'mcp__linear-server__list_issues',
      'mcp__linear-server__get_issue',
      'mcp__linear-server__list_teams',
      'mcp__linear-server__search_projects',
    ],
  },
  codebase: {
    mcpServers: [],
    tools: ['Read', 'Grep', 'Glob'],
  },
  phase0: {
    mcpServers: ['pylon'],
    tools: [
      'mcp__pylon__pylon_get_issue',
      'mcp__pylon__pylon_get_issue_body',
      'mcp__pylon__pylon_get_account',
    ],
  },
  phase2: {
    mcpServers: [],
    tools: ['Read', 'Glob'],
  },
}

/**
 * Get the --allowedTools list for a given agent name.
 * @param {string} agentName - One of: pylon, slack, linear, codebase, phase0, phase2
 * @returns {string[]} Array of tool name strings to pass to --allowedTools
 */
export function getAllowedToolsForAgent(agentName) {
  const entry = AGENT_REQUIRED_TOOLS[agentName]
  if (!entry) return []
  return [...entry.tools]
}

/**
 * Get all unique MCP server names required across all agents.
 * @returns {string[]}
 */
export function getRequiredMCPServers() {
  const servers = new Set()
  for (const entry of Object.values(AGENT_REQUIRED_TOOLS)) {
    for (const s of entry.mcpServers) {
      servers.add(s)
    }
  }
  return [...servers]
}

/**
 * Fast file-based preflight check. Reads config files directly — does NOT spawn claude.
 * Returns per-agent readiness status.
 *
 * @param {string} projectDir - Root project directory (for .claude/settings.local.json)
 * @returns {{ agents: Object, allReady: boolean, missingServers: string[], fixes: string[] }}
 */
export function checkPermissions(projectDir) {
  const result = {
    agents: {},
    allReady: true,
    missingServers: [],
    fixes: [],
  }

  // 1. Read ~/.claude/mcp.json to check which MCP servers are configured
  const globalMcpPath = join(homedir(), '.claude', 'mcp.json')
  let configuredServers = {}
  try {
    if (existsSync(globalMcpPath)) {
      const mcpConfig = JSON.parse(readFileSync(globalMcpPath, 'utf-8'))
      configuredServers = mcpConfig.mcpServers || {}
    }
  } catch (e) {
    result.fixes.push(`Could not read ${globalMcpPath}: ${e.message}`)
  }

  // 2. Read .claude/settings.local.json for permission allow list + enabledMcpjsonServers
  const localSettingsPath = join(projectDir, '.claude', 'settings.local.json')
  let localSettings = { permissions: { allow: [] }, enabledMcpjsonServers: [] }
  try {
    if (existsSync(localSettingsPath)) {
      localSettings = JSON.parse(readFileSync(localSettingsPath, 'utf-8'))
    }
  } catch (e) {
    result.fixes.push(`Could not read ${localSettingsPath}: ${e.message}`)
  }

  // 3. Read ~/.claude/settings.json for global allow list
  const globalSettingsPath = join(homedir(), '.claude', 'settings.json')
  let globalSettings = { permissions: { allow: [] } }
  try {
    if (existsSync(globalSettingsPath)) {
      globalSettings = JSON.parse(readFileSync(globalSettingsPath, 'utf-8'))
    }
  } catch {}

  const localAllow = localSettings.permissions?.allow || []
  const globalAllow = globalSettings.permissions?.allow || []
  const allAllow = [...localAllow, ...globalAllow]
  const enabledServers = localSettings.enabledMcpjsonServers || []

  // 4. Check each Phase 1 agent
  const phase1Agents = ['pylon', 'slack', 'linear', 'codebase']
  for (const agentName of phase1Agents) {
    const spec = AGENT_REQUIRED_TOOLS[agentName]
    const agentResult = {
      ready: true,
      missingTools: [],
      missingServers: [],
      serverNotConfigured: [],
    }

    // Check MCP servers are configured in mcp.json (have API keys)
    for (const server of spec.mcpServers) {
      if (!configuredServers[server]) {
        agentResult.serverNotConfigured.push(server)
        agentResult.ready = false
      }
      if (!enabledServers.includes(server)) {
        agentResult.missingServers.push(server)
      }
    }

    // Check tools against combined allow lists
    for (const tool of spec.tools) {
      const isAllowed = allAllow.some(pattern => {
        if (pattern === tool) return true
        if (pattern.endsWith('*')) {
          return tool.startsWith(pattern.slice(0, -1))
        }
        return false
      })
      if (!isAllowed) {
        agentResult.missingTools.push(tool)
      }
    }

    if (agentResult.serverNotConfigured.length > 0) {
      result.allReady = false
      for (const s of agentResult.serverNotConfigured) {
        if (!result.missingServers.includes(s)) {
          result.missingServers.push(s)
          result.fixes.push(`MCP server "${s}" not configured in ~/.claude/mcp.json (requires API key)`)
        }
      }
    }

    result.agents[agentName] = agentResult
  }

  return result
}

/**
 * Fix all permissions: add missing tools to .claude/settings.local.json
 * and add missing servers to enabledMcpjsonServers.
 *
 * Does NOT fix missing MCP server configs in mcp.json (those require API keys).
 *
 * @param {string} projectDir - Root project directory
 * @returns {{ addedTools: string[], addedServers: string[] }}
 */
export function fixAllPermissions(projectDir) {
  const localSettingsPath = join(projectDir, '.claude', 'settings.local.json')
  let settings = {}

  try {
    if (existsSync(localSettingsPath)) {
      settings = JSON.parse(readFileSync(localSettingsPath, 'utf-8'))
    }
  } catch {}

  if (!settings.permissions) settings.permissions = {}
  if (!settings.permissions.allow) settings.permissions.allow = []
  if (!settings.enabledMcpjsonServers) settings.enabledMcpjsonServers = []

  const addedTools = []
  const addedServers = []

  // Collect all unique tools from all agents
  const allTools = new Set()
  for (const spec of Object.values(AGENT_REQUIRED_TOOLS)) {
    for (const tool of spec.tools) {
      allTools.add(tool)
    }
  }

  // Add missing tools to allow list
  for (const tool of allTools) {
    const isAllowed = settings.permissions.allow.some(pattern => {
      if (pattern === tool) return true
      if (pattern.endsWith('*')) return tool.startsWith(pattern.slice(0, -1))
      return false
    })
    if (!isAllowed) {
      settings.permissions.allow.push(tool)
      addedTools.push(tool)
    }
  }

  // Add missing MCP servers to enabledMcpjsonServers
  const requiredServers = getRequiredMCPServers()
  for (const server of requiredServers) {
    if (!settings.enabledMcpjsonServers.includes(server)) {
      settings.enabledMcpjsonServers.push(server)
      addedServers.push(server)
    }
  }

  settings.enableAllProjectMcpServers = true

  // Write the updated settings
  mkdirSync(join(projectDir, '.claude'), { recursive: true })
  writeFileSync(localSettingsPath, JSON.stringify(settings, null, 2))

  return { addedTools, addedServers }
}
