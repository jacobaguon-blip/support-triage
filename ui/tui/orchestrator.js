/**
 * tmux Orchestrator
 * Spawns tmux sessions with agent panes for each investigation
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

class TmuxOrchestrator {
  constructor() {
    this.sessions = new Map(); // ticketNumber -> session info
    this.investigationsRoot = path.join(os.homedir(), 'support-triage', 'investigations');
  }

  /**
   * Check if tmux is available
   */
  async checkTmuxAvailable() {
    try {
      await execAsync('which tmux');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create tmux session for an investigation
   * @param {Object} investigation - Investigation data
   * @param {Array} agents - List of agent names for this skill
   * @returns {Promise<Object>} Session info
   */
  async createSession(investigation, agents) {
    const ticketNumber = investigation.ticketNumber || 'adhoc';
    const sessionName = `triage-${ticketNumber}`;

    // Check if session already exists
    const exists = await this.sessionExists(sessionName);
    if (exists) {
      console.log(`Session ${sessionName} already exists, killing and recreating...`);
      await this.killSession(sessionName);
    }

    // Create the investigation directory
    const investigationDir = path.join(this.investigationsRoot, `${ticketNumber}`, `investigation-${investigation.runNumber || 1}`);
    await fs.promises.mkdir(investigationDir, { recursive: true });

    // Create new tmux session (detached)
    await execAsync(`tmux new-session -d -s ${sessionName}`);

    // Set pane title display
    await execAsync(`tmux set -t ${sessionName} pane-border-status top`);
    await execAsync(`tmux set -t ${sessionName} pane-border-format " #{pane_title} "`);

    // Split into panes based on agent count
    const paneIds = await this.splitPanes(sessionName, agents.length);

    // Spawn Claude Code in each pane
    const agentProcesses = [];
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const paneId = paneIds[i];

      const agentInfo = await this.spawnAgent({
        sessionName,
        paneId,
        paneIndex: i,
        agentName: agent,
        ticketNumber,
        customerName: investigation.customerName,
        extraContext: investigation.extraContext,
        skill: investigation.skill,
        investigationDir
      });

      agentProcesses.push(agentInfo);
    }

    const sessionInfo = {
      sessionName,
      ticketNumber,
      investigationId: investigation.id,
      agents: agentProcesses,
      createdAt: new Date()
    };

    this.sessions.set(ticketNumber, sessionInfo);
    return sessionInfo;
  }

  /**
   * Check if tmux session exists
   */
  async sessionExists(sessionName) {
    try {
      await execAsync(`tmux has-session -t ${sessionName} 2>/dev/null`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Kill a tmux session
   */
  async killSession(sessionName) {
    try {
      await execAsync(`tmux kill-session -t ${sessionName}`);
    } catch (error) {
      console.error(`Failed to kill session ${sessionName}:`, error.message);
    }
  }

  /**
   * Split tmux window into N panes
   * @param {string} sessionName - tmux session name
   * @param {number} agentCount - Number of agents (panes to create)
   * @returns {Promise<Array>} Array of pane IDs
   */
  async splitPanes(sessionName, agentCount) {
    const paneIds = [];

    // First pane already exists (pane 0)
    paneIds.push(0);

    if (agentCount === 1) {
      return paneIds;
    }

    // Split strategy based on count:
    // 2 agents: vertical split (left/right)
    // 3 agents: vertical split, then horizontal split on right
    // 4 agents: 2x2 grid (two vertical splits, then horizontal on each)

    if (agentCount === 2) {
      // Split vertically (left | right)
      await execAsync(`tmux split-window -t ${sessionName} -h`);
      paneIds.push(1);
    } else if (agentCount === 3) {
      // Split vertically first
      await execAsync(`tmux split-window -t ${sessionName} -h`);
      // Split the right pane horizontally
      await execAsync(`tmux split-window -t ${sessionName}:0.1 -v`);
      paneIds.push(1, 2);
    } else if (agentCount === 4) {
      // Create 2x2 grid
      // Split vertically (left | right)
      await execAsync(`tmux split-window -t ${sessionName} -h`);
      // Split left pane horizontally (top-left | bottom-left)
      await execAsync(`tmux split-window -t ${sessionName}:0.0 -v`);
      // Split right pane horizontally (top-right | bottom-right)
      await execAsync(`tmux split-window -t ${sessionName}:0.2 -v`);
      paneIds.push(1, 2, 3);
    } else {
      // Fallback: just keep splitting vertically
      for (let i = 1; i < agentCount; i++) {
        await execAsync(`tmux split-window -t ${sessionName} -h`);
        paneIds.push(i);
      }
    }

    return paneIds;
  }

  /**
   * Spawn Claude Code agent in a tmux pane
   * @param {Object} config - Agent configuration
   * @returns {Promise<Object>} Agent info
   */
  async spawnAgent(config) {
    const {
      sessionName,
      paneId,
      paneIndex,
      agentName,
      ticketNumber,
      customerName,
      extraContext,
      skill,
      investigationDir
    } = config;

    // Set pane title
    await execAsync(`tmux select-pane -t ${sessionName}:0.${paneIndex} -T "${agentName}"`);

    // Generate agent prompt
    const agentPrompt = this.generateAgentPrompt({
      agentName,
      ticketNumber,
      customerName,
      extraContext,
      skill,
      investigationDir
    });

    // Create a temp file for the prompt
    const promptFile = path.join(investigationDir, `.${agentName.toLowerCase()}-prompt.txt`);
    await fs.promises.writeFile(promptFile, agentPrompt, 'utf8');

    // Output file for agent findings
    const findingsFile = path.join(investigationDir, `${agentName.toLowerCase()}-findings.md`);

    // Display the prompt file for the agent
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "echo 'Agent: ${agentName}'" C-m`);
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "echo 'Prompt saved to: ${promptFile}'" C-m`);
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "echo 'Findings will be saved to: ${findingsFile}'" C-m`);
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "echo ''" C-m`);
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "cat ${promptFile}" C-m`);
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "echo ''" C-m`);
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "echo '--- Ready for agent execution ---'" C-m`);
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "echo ''" C-m`);

    // Launch Claude Code with the agent prompt from the file
    const envVars = `TICKET="${ticketNumber}" CUSTOMER="${customerName || 'Unknown'}" SKILL="${skill}" AGENT="${agentName}" OUTPUT_PATH="${investigationDir}"`;
    // Use cat to pipe the prompt file into claude
    await execAsync(`tmux send-keys -t ${sessionName}:0.${paneIndex} "${envVars} cat ${promptFile} | claude" C-m`);

    return {
      agentName,
      paneId,
      paneIndex,
      findingsFile,
      status: 'running',
      startedAt: new Date()
    };
  }

  /**
   * Generate agent prompt based on role
   * @param {Object} config - Agent config
   * @returns {string} Prompt text
   */
  generateAgentPrompt(config) {
    const { agentName, ticketNumber, customerName, skill, investigationDir, extraContext } = config;

    const contextSection = extraContext ? `

Extra Context:
${extraContext}
` : '';

    const baseContext = `
You are the ${agentName} research agent for ticket ${ticketNumber}${customerName ? ` (${customerName})` : ''}.

Skill: ${skill}
Investigation Directory: ${investigationDir}${contextSection}

Your role:
${this.getAgentRole(agentName)}

Output Format:
Save your findings to: ${investigationDir}/${agentName.toLowerCase()}-findings.md

${this.getAgentOutputFormat(agentName)}

When done, output: AGENT_COMPLETE
If you need approval, output: CHECKPOINT: <your question>
If you encounter an error, output: AGENT_ERROR: <description>
`;

    return baseContext.trim();
  }

  /**
   * Get agent role description
   */
  getAgentRole(agentName) {
    const roles = {
      'Slack': `
- Search Slack workspace for discussions about this customer and issue
- Focus on #support-eng, #engineering, #product channels
- Look for: error mentions, customer complaints, engineering discussions
- Time range: Last 3-6 months`,

      'Linear': `
- Search Linear for related issues, features, roadmap items
- Check for: duplicates, similar bugs, planned features
- Identify: what's already fixed, what's planned, what's new`,

      'Pylon': `
- Fetch full ticket details from Pylon
- Read entire thread (all messages)
- Extract: customer impact, timeline, severity
- Identify: if priority should change`,

      'Codebase': `
- Search /C1/ConductorOne/ and /C1/ductone/ for relevant code
- Find: error traces, related functions, config files
- Identify: files and line numbers involved
- Code Review Depth: Level 2 (match error to code paths, explain what code does)
- DO NOT perform root cause analysis unless explicitly approved`
    };

    return roles[agentName] || '- Perform general research on this ticket';
  }

  /**
   * Get agent output format instructions
   */
  getAgentOutputFormat(agentName) {
    const formats = {
      'Slack': `
Include:
- Channel names and thread links
- Key quotes from discussions
- Engineering insights
- Timeline of when issue was first mentioned`,

      'Linear': `
Include:
- Linear issue IDs with clickable links
- Status of each issue (open/closed/in-progress)
- Roadmap items if applicable
- Priority and assignees`,

      'Pylon': `
Include:
- Full ticket metadata (created, priority, state)
- Thread summary (key messages)
- Customer sentiment analysis
- Suggested priority (if different from current)`,

      'Codebase': `
Include:
- File paths with line numbers (e.g., src/auth.go:45-67)
- Code snippets (relevant sections only)
- What the code does (not why it's broken)
- Data flow through problem area`
    };

    return formats[agentName] || 'Include all relevant findings with citations.';
  }

  /**
   * Capture output from a tmux pane
   * @param {string} sessionName - Session name
   * @param {number} paneIndex - Pane index
   * @param {number} lines - Number of lines to capture
   * @returns {Promise<string>} Pane output
   */
  async captureOutput(sessionName, paneIndex, lines = 100) {
    try {
      const { stdout } = await execAsync(
        `tmux capture-pane -t ${sessionName}:0.${paneIndex} -p -S -${lines}`
      );
      return stdout;
    } catch (error) {
      console.error(`Failed to capture output from ${sessionName}:${paneIndex}:`, error.message);
      return '';
    }
  }

  /**
   * Parse agent output for status markers
   * @param {string} output - Raw output text
   * @returns {Object} Parsed status
   */
  parseAgentStatus(output) {
    if (output.includes('AGENT_COMPLETE')) {
      return { status: 'completed', message: null };
    }

    const checkpointMatch = output.match(/CHECKPOINT:\s*(.+)/);
    if (checkpointMatch) {
      return { status: 'checkpoint', message: checkpointMatch[1] };
    }

    const errorMatch = output.match(/AGENT_ERROR:\s*(.+)/);
    if (errorMatch) {
      return { status: 'error', message: errorMatch[1] };
    }

    return { status: 'running', message: null };
  }

  /**
   * Get status of all agents in a session
   * @param {string} ticketNumber - Ticket number
   * @returns {Promise<Array>} Agent statuses
   */
  async getAgentStatuses(ticketNumber) {
    const session = this.sessions.get(ticketNumber);
    if (!session) {
      throw new Error(`No session found for ticket ${ticketNumber}`);
    }

    const statuses = [];
    for (const agent of session.agents) {
      const output = await this.captureOutput(session.sessionName, agent.paneIndex);
      const parsed = this.parseAgentStatus(output);

      statuses.push({
        agentName: agent.agentName,
        status: parsed.status,
        message: parsed.message,
        output: output.slice(-500) // Last 500 chars
      });
    }

    return statuses;
  }

  /**
   * Send command to a specific agent pane
   * @param {string} ticketNumber - Ticket number
   * @param {string} agentName - Agent name
   * @param {string} command - Command to send
   */
  async sendCommandToAgent(ticketNumber, agentName, command) {
    const session = this.sessions.get(ticketNumber);
    if (!session) {
      throw new Error(`No session found for ticket ${ticketNumber}`);
    }

    const agent = session.agents.find(a => a.agentName === agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found in session`);
    }

    await execAsync(
      `tmux send-keys -t ${session.sessionName}:0.${agent.paneIndex} "${command}" C-m`
    );
  }

  /**
   * Attach to a tmux session (for manual viewing)
   * @param {string} ticketNumber - Ticket number
   */
  async attachSession(ticketNumber) {
    const session = this.sessions.get(ticketNumber);
    if (!session) {
      throw new Error(`No session found for ticket ${ticketNumber}`);
    }

    // This will be run in the user's terminal, not in the TUI
    console.log(`To attach to session, run: tmux attach -t ${session.sessionName}`);
  }

  /**
   * List all active tmux sessions
   * @returns {Promise<Array>} Session names
   */
  async listActiveSessions() {
    try {
      const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}"');
      return stdout.trim().split('\n').filter(name => name.startsWith('triage-'));
    } catch (error) {
      // No sessions running
      return [];
    }
  }

  /**
   * Cleanup: kill session and remove from map
   * @param {string} ticketNumber - Ticket number
   */
  async cleanup(ticketNumber) {
    const session = this.sessions.get(ticketNumber);
    if (session) {
      await this.killSession(session.sessionName);
      this.sessions.delete(ticketNumber);
    }
  }
}

export default TmuxOrchestrator;
