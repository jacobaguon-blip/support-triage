/**
 * Agent Manager
 * Spawns and manages Claude Code agents as background processes
 * No tmux - uses child_process with log file piping
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createInvestigationLogger } from './logger.js';
import { upsertAgent } from './database.js';

class AgentManager {
  constructor() {
    this.runningAgents = new Map(); // investigationId → Map<agentName, process>
  }

  /**
   * Spawn all agents for a skill
   * @param {Object} investigation - Investigation data
   * @param {Array<string>} agentNames - Agent names to spawn
   * @returns {Promise<Array>} Array of agent info
   */
  async spawnAgents(investigation, agentNames) {
    const { id, ticketNumber, customerName, extraContext, skill } = investigation;

    const logger = createInvestigationLogger(id, 'main');
    logger.info('Spawning agents', {
      investigation_id: id,
      agent_count: agentNames.length,
      agents: agentNames
    });

    const investigationDir = path.join(
      os.homedir(),
      'support-triage',
      'investigations',
      ticketNumber.toString(),
      'investigation-1'
    );

    // Ensure investigation directory exists
    fs.mkdirSync(investigationDir, { recursive: true });

    const agentProcesses = [];

    for (const agentName of agentNames) {
      try {
        const agentInfo = await this.spawnAgent({
          investigationId: id,
          ticketNumber,
          customerName,
          extraContext,
          skill,
          agentName,
          investigationDir
        });

        agentProcesses.push(agentInfo);
        logger.info('Agent spawned', {
          agent: agentName,
          pid: agentInfo.pid,
          log_file: agentInfo.logFile
        });
      } catch (error) {
        logger.error('Failed to spawn agent', {
          agent: agentName,
          error: error.message
        });
      }
    }

    logger.close();
    return agentProcesses;
  }

  /**
   * Spawn a single agent
   */
  async spawnAgent(config) {
    const {
      investigationId,
      ticketNumber,
      customerName,
      extraContext,
      skill,
      agentName,
      investigationDir
    } = config;

    // Generate agent prompt
    const agentPrompt = this.generateAgentPrompt({
      agentName,
      ticketNumber,
      customerName,
      extraContext,
      skill,
      investigationDir
    });

    // Create prompt file
    const promptFile = path.join(investigationDir, `.${agentName.toLowerCase()}-prompt.txt`);
    fs.writeFileSync(promptFile, agentPrompt, 'utf8');

    // Create log file for this agent
    const logsDir = path.join(os.homedir(), 'support-triage', 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const logFile = path.join(logsDir, `${investigationId}-agent-${agentName.toLowerCase()}.jsonl`);

    // Create findings file path
    const findingsFile = path.join(investigationDir, `${agentName.toLowerCase()}-findings.md`);

    // Create log stream
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    // Create agent logger
    const agentLogger = createInvestigationLogger(investigationId, `agent-${agentName.toLowerCase()}`);
    agentLogger.info('Agent starting', {
      agent: agentName,
      investigation_id: investigationId,
      prompt_file: promptFile,
      findings_file: findingsFile
    });
    agentLogger.close();

    // Spawn Claude Code as background process
    const agentProcess = spawn('claude', [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true, // Run in background
      env: {
        ...process.env,
        TICKET: ticketNumber.toString(),
        CUSTOMER: customerName || 'Unknown',
        SKILL: skill,
        AGENT: agentName,
        OUTPUT_PATH: investigationDir
      },
      cwd: investigationDir
    });

    // Send the prompt to stdin
    agentProcess.stdin.write(agentPrompt);
    agentProcess.stdin.end();

    // Pipe stdout and stderr to log file
    agentProcess.stdout.pipe(logStream);
    agentProcess.stderr.pipe(logStream);

    // Track in database
    await upsertAgent({
      investigation_id: investigationId,
      agent_name: agentName.toLowerCase(),
      pid: agentProcess.pid,
      status: 'running',
      log_file: logFile,
      findings_file: findingsFile,
      started_at: new Date().toISOString()
    });

    // Handle process events
    agentProcess.on('exit', async (code, signal) => {
      const agentLogger = createInvestigationLogger(investigationId, `agent-${agentName.toLowerCase()}`);

      if (code === 0) {
        agentLogger.info('Agent completed', {
          agent: agentName,
          pid: agentProcess.pid,
          exit_code: code
        });

        await upsertAgent({
          investigation_id: investigationId,
          agent_name: agentName.toLowerCase(),
          status: 'completed',
          completed_at: new Date().toISOString()
        });
      } else {
        agentLogger.error('Agent exited with error', {
          agent: agentName,
          pid: agentProcess.pid,
          exit_code: code,
          signal
        });

        await upsertAgent({
          investigation_id: investigationId,
          agent_name: agentName.toLowerCase(),
          status: 'error',
          error_message: `Exited with code ${code}`,
          completed_at: new Date().toISOString()
        });
      }

      agentLogger.close();
      logStream.end();
    });

    agentProcess.on('error', async (error) => {
      const agentLogger = createInvestigationLogger(investigationId, `agent-${agentName.toLowerCase()}`);
      agentLogger.error('Agent process error', {
        agent: agentName,
        error: error.message
      });
      agentLogger.close();

      await upsertAgent({
        investigation_id: investigationId,
        agent_name: agentName.toLowerCase(),
        status: 'error',
        error_message: error.message
      });
    });

    // Don't wait for process - let it run in background
    agentProcess.unref();

    // Store in running agents map
    if (!this.runningAgents.has(investigationId)) {
      this.runningAgents.set(investigationId, new Map());
    }
    this.runningAgents.get(investigationId).set(agentName, agentProcess);

    return {
      agent: agentName,
      pid: agentProcess.pid,
      logFile,
      findingsFile,
      status: 'running'
    };
  }

  /**
   * Generate agent prompt based on role
   */
  generateAgentPrompt(config) {
    const { agentName, ticketNumber, customerName, skill, investigationDir, extraContext } = config;

    const contextSection = extraContext ? `

Extra Context:
${extraContext}
` : '';

    const baseContext = `You are the ${agentName} research agent for ticket ${ticketNumber}${customerName ? ` (${customerName})` : ''}.

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
      'Slack': `- Search Slack workspace for discussions about this customer and issue
- Focus on #support-eng, #engineering, #product channels
- Look for: error mentions, customer complaints, engineering discussions
- Time range: Last 3-6 months`,

      'Linear': `- Search Linear for related issues, features, roadmap items
- Check for: duplicates, similar bugs, planned features
- Identify: what's already fixed, what's planned, what's new`,

      'Pylon': `- Fetch full ticket details from Pylon
- Read entire thread (all messages)
- Extract: customer impact, timeline, severity
- Identify: if priority should change`,

      'Codebase': `- Search codebase for relevant code
- Find: error traces, related functions, config files
- Identify: files and line numbers involved
- Perform Level 2 analysis (error trace, not root cause)`
    };

    return roles[agentName] || 'Research and gather information about this issue';
  }

  /**
   * Get agent output format
   */
  getAgentOutputFormat(agentName) {
    return `Include:
- Key findings with source citations
- Links to relevant resources
- Timeline of events if applicable
- Recommendations for next steps`;
  }

  /**
   * Kill agent process
   */
  async killAgent(investigationId, agentName) {
    const agents = this.runningAgents.get(investigationId);
    if (!agents) return false;

    const process = agents.get(agentName);
    if (!process) return false;

    try {
      process.kill();
      agents.delete(agentName);

      await upsertAgent({
        investigation_id: investigationId,
        agent_name: agentName.toLowerCase(),
        status: 'error',
        error_message: 'Killed by user',
        completed_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Kill all agents for an investigation
   */
  async killAllAgents(investigationId) {
    const agents = this.runningAgents.get(investigationId);
    if (!agents) return;

    for (const [agentName, process] of agents.entries()) {
      try {
        process.kill();
        await upsertAgent({
          investigation_id: investigationId,
          agent_name: agentName.toLowerCase(),
          status: 'error',
          error_message: 'Investigation cancelled',
          completed_at: new Date().toISOString()
        });
      } catch (error) {
        // Ignore errors
      }
    }

    this.runningAgents.delete(investigationId);
  }
}

// Singleton instance
const agentManager = new AgentManager();
export default agentManager;
