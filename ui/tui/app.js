#!/usr/bin/env node

/**
 * Support Triage Session Manager - Terminal UI
 * Main entry point for the blessed TUI application
 */

import blessed from 'blessed';
import theme, { themeManager } from './theme.js';
import SessionList from './components/session-list.js';
import AgentTabs from './components/agent-tabs.js';
import SessionView from './components/session-view.js';
import StatusBar from './components/status-bar.js';
import NewSessionModal from './components/new-session-modal-skip.js';
import TicketSummaryModal from './components/ticket-summary-modal.js';
import SkillSelectorModal from './components/skill-selector-modal.js';
import CheckpointModal from './components/checkpoint-modal.js';
import SearchModal from './components/search-modal.js';
import DatabaseAdapter from './db-adapter.js';
import TmuxOrchestrator from './orchestrator.js';
import FindingsAggregator from './aggregator.js';
import logger from './logger.js';

class TriageSessionManager {
  constructor() {
    this.sessions = [];
    this.selectedSessionIndex = 0;
    this.selectedTabIndex = 0;
    this.db = new DatabaseAdapter();
    this.orchestrator = new TmuxOrchestrator();
    this.aggregator = new FindingsAggregator();

    // New session state
    this.newSessionData = null;

    // Polling intervals
    this.agentPollingIntervals = new Map();

    // Checkpoint tracking (to avoid showing same checkpoint multiple times)
    this.handledCheckpoints = new Set();

    // Parse command-line arguments
    this.parseArgs();

    logger.info('TUI Starting', {
      args: this.cliArgs,
      cwd: process.cwd()
    });

    this.initScreen();
    this.initComponents();
    this.bindKeys();
    this.loadExistingSessions();
    this.checkTmux();
    this.render();

    logger.info('TUI Ready');
  }

  parseArgs() {
    const args = process.argv.slice(2);
    this.cliArgs = {
      ticket: null,
      customer: null,
      context: null
    };

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--ticket' && args[i + 1]) {
        this.cliArgs.ticket = args[i + 1];
        i++;
      } else if (args[i] === '--customer' && args[i + 1]) {
        this.cliArgs.customer = args[i + 1];
        i++;
      } else if (args[i] === '--context' && args[i + 1]) {
        this.cliArgs.context = args[i + 1];
        i++;
      }
    }
  }

  initScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Support Triage Session Manager',
      fullUnicode: true,
      cursor: {
        artificial: true,
        shape: 'line',
        blink: true,
        color: 'white'
      }
    });
  }

  initComponents() {
    // Left sidebar - session list
    this.sessionList = new SessionList(this.screen, {
      left: 0,
      top: 0,
      width: '25%',
      height: '100%-1'
    });

    // Top tabs - agent tabs
    this.agentTabs = new AgentTabs(this.screen, {
      left: '25%',
      top: 0,
      width: '75%',
      height: 3
    });

    // Center - session view
    this.sessionView = new SessionView(this.screen, {
      left: '25%',
      top: 3,
      width: '75%',
      height: '100%-4'
    });

    // Bottom - status bar
    this.statusBar = new StatusBar(this.screen, {
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1
    });

    // Set initial status
    this.updateStatus('Ready | No sessions | Press N to create new session');
  }

  bindKeys() {
    // Quit
    this.screen.key(['q', 'C-c'], () => {
      logger.info('TUI exiting (user quit)');
      logger.close();
      return process.exit(0);
    });

    // Help
    this.screen.key(['?'], () => {
      this.showHelp();
    });

    // Toggle theme (d key)
    this.screen.key(['d'], () => {
      this.toggleTheme();
    });

    // New session
    this.screen.key(['n'], () => {
      this.createNewSession();
    });

    // Search
    this.screen.key(['s'], () => {
      this.showSearch();
    });

    // Navigation - j/k for up/down
    this.screen.key(['j', 'down'], () => {
      this.sessionList.selectNext();
      this.render();
    });

    this.screen.key(['k', 'up'], () => {
      this.sessionList.selectPrevious();
      this.render();
    });

    // Tab switching - 1-6 keys
    this.screen.key(['1'], () => {
      this.agentTabs.selectTab(0);
      this.onTabChanged();
    });

    this.screen.key(['2'], () => {
      this.agentTabs.selectTab(1);
      this.onTabChanged();
    });

    this.screen.key(['3'], () => {
      this.agentTabs.selectTab(2);
      this.onTabChanged();
    });

    this.screen.key(['4'], () => {
      this.agentTabs.selectTab(3);
      this.onTabChanged();
    });

    this.screen.key(['5'], () => {
      this.agentTabs.selectTab(4);
      this.onTabChanged();
    });

    this.screen.key(['6'], () => {
      this.agentTabs.selectTab(5);
      this.onTabChanged();
    });

    // Tab key to cycle
    this.screen.key(['tab'], () => {
      this.agentTabs.selectNext();
      this.onTabChanged();
    });

    // Enter to select/activate
    this.screen.key(['enter'], () => {
      // TODO: Handle checkpoint approval or session selection
      this.render();
    });
  }

  async checkTmux() {
    const available = await this.orchestrator.checkTmuxAvailable();
    if (!available) {
      this.updateStatus('WARNING: tmux not found. Agent orchestration will not work.');
    }
  }

  async loadExistingSessions() {
    try {
      const investigations = await this.db.getAllInvestigations();

      // Convert investigations to session format
      const sessions = investigations.map(inv => ({
        id: inv.id,
        ticketNumber: inv.id,
        customerName: inv.customer_name,
        status: inv.status,
        classification: inv.classification,
        agents: [] // TODO: Load agents from database
      }));

      this.sessions = sessions;
      this.sessionList.setSessions(sessions);
      this.render();
    } catch (error) {
      this.updateStatus(`Error loading sessions: ${error.message}`);
    }
  }

  createNewSession() {
    logger.event('createNewSession', { hasCliArgs: !!this.cliArgs.ticket });
    this.updateStatus('Creating new session...');

    // If CLI args were provided, use them directly
    if (this.cliArgs.ticket) {
      logger.info('Using CLI args for new session', this.cliArgs);
      this.onTicketInfoEntered({
        ticketNumber: this.cliArgs.ticket,
        customerName: this.cliArgs.customer,
        extraContext: this.cliArgs.context
      });
      return;
    }

    // Otherwise show the modal (skip version for now)
    logger.event('showNewSessionModal');
    new NewSessionModal(
      this.screen,
      (data) => this.onTicketInfoEntered(data),
      () => this.onNewSessionCancelled()
    );
  }

  async onTicketInfoEntered(data) {
    this.newSessionData = data;
    this.updateStatus(`Processing ticket ${data.ticketNumber || 'ad-hoc'}...`);

    // If ticket number provided, fetch from Pylon
    if (data.ticketNumber) {
      await this.fetchAndShowTicketSummary(data.ticketNumber);
    } else {
      // Skip to skill selection for ad-hoc
      this.showSkillSelector();
    }
  }

  async fetchAndShowTicketSummary(ticketNumber) {
    this.updateStatus(`Fetching ticket ${ticketNumber} from Pylon...`);

    try {
      // TODO: Call Pylon MCP to fetch ticket data
      // For now, use mock data
      const ticketData = {
        ticketNumber: ticketNumber,
        customerName: this.newSessionData.customerName || 'Unknown Customer',
        priority: 'P2',
        created: new Date().toISOString(),
        title: 'Sample ticket title',
        description: 'This is a sample ticket description. In production, this will be fetched from Pylon.',
        threadCount: 5,
        lastMessage: '2 hours ago'
      };

      // Show ticket summary modal
      new TicketSummaryModal(
        this.screen,
        ticketData,
        () => this.showSkillSelector(),
        () => this.onNewSessionCancelled()
      );
    } catch (error) {
      this.updateStatus(`Error fetching ticket: ${error.message}`);
      this.showSkillSelector(); // Continue anyway
    }
  }

  showSkillSelector() {
    new SkillSelectorModal(
      this.screen,
      (skill) => this.onSkillSelected(skill),
      () => this.onNewSessionCancelled()
    );
  }

  async onSkillSelected(skill) {
    logger.event('skillSelected', {
      skill: skill.id,
      agentCount: skill.agents.length,
      ticketNumber: this.newSessionData?.ticketNumber
    });
    this.updateStatus(`Creating session with skill: ${skill.name}...`);

    try {
      // Create investigation in database
      // Note: Server only accepts ticketId (number) and agentMode
      const investigationData = {
        ticketId: this.newSessionData.ticketNumber || Date.now().toString().slice(-4),
        agentMode: 'team'
      };

      logger.info('Creating investigation in database', investigationData);
      const result = await this.db.createInvestigation(investigationData);
      logger.info('Investigation created', { result });

      // Extract investigation data from result
      // API returns: { success, id, status, message, investigationDir }
      let investigation = null;
      if (result && result.success && result.id) {
        // Success! Use the ID from the response
        investigation = {
          id: result.id,
          status: result.status,
          investigationDir: result.investigationDir
        };
        logger.info('Investigation created successfully', { investigation });
      } else {
        // Fallback: Check if investigation exists anyway
        logger.warn('Create did not return success, checking if investigation exists...');
        const allInvestigations = await this.db.getAllInvestigations();
        investigation = allInvestigations.find(inv =>
          inv.id.toString() === investigationData.ticketId.toString()
        );
        logger.info('Investigation existence check', {
          exists: investigation !== null && investigation !== undefined,
          investigation
        });
      }

      if (investigation) {
        this.updateStatus(`Session created! Launching ${skill.agents.length} agents...`);

        // Add to sessions list
        const newSession = {
          id: investigation.id,
          ticketNumber: this.newSessionData.ticketNumber || 'adhoc',
          customerName: this.newSessionData.customerName,
          status: 'running',
          skill: skill,
          agents: skill.agents.map(name => ({
            name,
            status: 'pending'
          }))
        };

        this.sessions.push(newSession);
        this.sessionList.setSessions(this.sessions);

        // Launch agents in tmux
        try {
          const investigationForTmux = {
            id: investigation.id,
            ticketNumber: this.newSessionData.ticketNumber,
            customerName: this.newSessionData.customerName,
            extraContext: this.newSessionData.extraContext,
            skill: skill.id,
            runNumber: 1
          };

          logger.info('Launching tmux session', { investigation: investigationForTmux, agents: skill.agents });
          const tmuxSession = await this.orchestrator.createSession(investigationForTmux, skill.agents);
          logger.info('tmux session created', { sessionName: tmuxSession.sessionName });

          this.updateStatus(`Agents launched in tmux session: ${tmuxSession.sessionName}`);

          // Start polling for agent status
          this.startAgentPolling(newSession.ticketNumber);
          logger.info('Agent polling started', { ticketNumber: newSession.ticketNumber });

        } catch (error) {
          logger.error('Error launching agents', { error: error.message, stack: error.stack });
          this.updateStatus(`Error launching agents: ${error.message}`);
          console.error('tmux launch error:', error);
        }

        // Reset new session data
        this.newSessionData = null;
      } else {
        throw new Error('Failed to create investigation in database');
      }
    } catch (error) {
      logger.error('Error creating session', { error: error.message, stack: error.stack });
      this.updateStatus(`Error creating session: ${error.message}`);
    }

    this.render();
  }

  onNewSessionCancelled() {
    this.updateStatus('New session cancelled');
    this.newSessionData = null;
    this.render();
  }

  /**
   * Start polling for agent status updates
   */
  startAgentPolling(ticketNumber) {
    // Poll every 3 seconds
    const intervalId = setInterval(async () => {
      try {
        await this.updateAgentStatuses(ticketNumber);
      } catch (error) {
        console.error('Agent polling error:', error);
      }
    }, 3000);

    this.agentPollingIntervals.set(ticketNumber, intervalId);
  }

  /**
   * Stop polling for a ticket
   */
  stopAgentPolling(ticketNumber) {
    const intervalId = this.agentPollingIntervals.get(ticketNumber);
    if (intervalId) {
      clearInterval(intervalId);
      this.agentPollingIntervals.delete(ticketNumber);
    }
  }

  /**
   * Update agent statuses from tmux output
   */
  async updateAgentStatuses(ticketNumber) {
    try {
      const statuses = await this.orchestrator.getAgentStatuses(ticketNumber);

      // Find the session in our list
      const session = this.sessions.find(s => s.ticketNumber === ticketNumber);
      if (!session) return;

      // Update agent statuses
      let allComplete = true;
      let anyCheckpoint = false;
      let anyError = false;
      let checkpointAgent = null;

      statuses.forEach((statusInfo, index) => {
        if (session.agents[index]) {
          session.agents[index].status = statusInfo.status;
          session.agents[index].message = statusInfo.message;
          session.agents[index].output = statusInfo.output;
        }

        if (statusInfo.status !== 'completed') {
          allComplete = false;
        }
        if (statusInfo.status === 'checkpoint') {
          anyCheckpoint = true;
          checkpointAgent = {
            index,
            agentName: statusInfo.agentName,
            message: statusInfo.message
          };
        }
        if (statusInfo.status === 'error') {
          anyError = true;
        }
      });

      // Show checkpoint modal if needed
      if (checkpointAgent) {
        const checkpointKey = `${ticketNumber}-${checkpointAgent.agentName}`;
        if (!this.handledCheckpoints.has(checkpointKey)) {
          this.handledCheckpoints.add(checkpointKey);
          this.showCheckpointModal(ticketNumber, checkpointAgent);
        }
      }

      // Update session status
      if (allComplete) {
        session.status = 'completed';
        this.stopAgentPolling(ticketNumber);
        this.updateStatus(`All agents completed for ticket ${ticketNumber}`);
      } else if (anyCheckpoint) {
        session.status = 'waiting';
        this.updateStatus(`Checkpoint required for ticket ${ticketNumber}`);
      } else if (anyError) {
        session.status = 'error';
        this.updateStatus(`Agent error in ticket ${ticketNumber}`);
      } else {
        session.status = 'running';
      }

      // Update UI
      this.sessionList.setSessions(this.sessions);

      // Update agent tabs if this is the selected session
      const selectedSession = this.sessionList.getSelectedSession();
      if (selectedSession && selectedSession.ticketNumber === ticketNumber) {
        this.updateAgentTabs(session);
      }

      this.render();
    } catch (error) {
      console.error('Error updating agent statuses:', error);
    }
  }

  /**
   * Update agent tabs with current session's agents
   */
  updateAgentTabs(session) {
    if (!session || !session.agents) return;

    // Map agent names to tab indices
    const agentTabMap = {
      'Slack': 0,
      'Linear': 1,
      'Pylon': 2,
      'Codebase': 3
    };

    session.agents.forEach(agent => {
      const tabIndex = agentTabMap[agent.name];
      if (tabIndex !== undefined) {
        this.agentTabs.setTabStatus(tabIndex, agent.status);
      }
    });

    // Update session view with agent output
    const selectedTabIndex = this.agentTabs.getSelectedIndex();
    const selectedAgent = session.agents[selectedTabIndex];
    if (selectedAgent && selectedAgent.output) {
      this.sessionView.setContent(selectedAgent.output);
    }
  }

  showSearch() {
    this.updateStatus('Opening search...');

    new SearchModal(
      this.screen,
      this.db,
      (investigation) => this.onSearchResultSelected(investigation),
      () => this.onSearchCancelled()
    );
  }

  onSearchResultSelected(investigation) {
    this.updateStatus(`Opening investigation: ${investigation.id}`);

    // Find the session in our list or add it
    let session = this.sessions.find(s => s.id === investigation.id);

    if (!session) {
      // Add to sessions list
      session = {
        id: investigation.id,
        ticketNumber: investigation.id,
        customerName: investigation.customer_name,
        status: investigation.status,
        classification: investigation.classification,
        agents: [] // TODO: Load agents from database
      };

      this.sessions.push(session);
      this.sessionList.setSessions(this.sessions);
    }

    // Select the session in the list
    const sessionIndex = this.sessions.indexOf(session);
    this.sessionList.selectedIndex = sessionIndex;
    this.sessionList.render();

    // Update view
    this.updateAgentTabs(session);

    this.render();
  }

  onSearchCancelled() {
    this.updateStatus('Search cancelled');
    this.render();
  }

  showHelp() {
    const currentMode = themeManager.getMode();
    const helpText = `
{bold}Support Triage Session Manager - Keyboard Shortcuts{/bold}

{cyan}Usage:{/cyan}
  node tui/app.js --ticket 8484 --customer "acme.com" --context "Auth issue"

{cyan}Navigation:{/cyan}
  j/k or ↑/↓  Navigate session list
  1,2,3,4     Jump to agents (Slack, Linear, Pylon, Codebase)
  5           Summary tab
  6           Response tab
  Tab         Cycle through tabs

{cyan}Actions:{/cyan}
  n           New session (uses CLI args or auto-creates test session)
  s           Search tickets
  Enter       Select / Approve checkpoint
  d           Toggle dark/light mode (currently: ${currentMode})

{cyan}System:{/cyan}
  ?           Show this help
  q           Quit
  Ctrl+C      Force quit

{dim}Press any key to close{/dim}
`;

    this.sessionView.showMessage('Help', helpText);
    this.render();
  }

  toggleTheme() {
    const newMode = themeManager.toggle();
    this.updateStatus(`Switched to ${newMode} mode (restart required for full effect)`);

    // Note: Full theme switching requires restarting the app
    // The theme is loaded at startup, so we just notify the user
    setTimeout(() => {
      this.updateStatus(`Theme saved. Press q to quit, then restart to see ${newMode} mode.`);
    }, 2000);

    this.render();
  }

  /**
   * Show checkpoint approval modal
   */
  showCheckpointModal(ticketNumber, checkpointAgent) {
    this.updateStatus(`Checkpoint: ${checkpointAgent.agentName} needs approval`);

    new CheckpointModal(
      this.screen,
      {
        agentName: checkpointAgent.agentName,
        message: checkpointAgent.message
      },
      (feedback) => this.onCheckpointApprove(ticketNumber, checkpointAgent, feedback),
      (feedback) => this.onCheckpointReject(ticketNumber, checkpointAgent, feedback),
      (feedback) => this.onCheckpointFeedback(ticketNumber, checkpointAgent, feedback),
      () => this.onCheckpointCancel(ticketNumber, checkpointAgent)
    );
  }

  /**
   * Handle checkpoint approval
   */
  async onCheckpointApprove(ticketNumber, checkpointAgent, feedback) {
    this.updateStatus(`Approved checkpoint for ${checkpointAgent.agentName}`);

    const response = feedback ? `APPROVED: ${feedback}` : 'APPROVED';

    try {
      await this.orchestrator.sendCommandToAgent(
        ticketNumber,
        checkpointAgent.agentName,
        response
      );

      // Remove from handled checkpoints so future checkpoints can be shown
      const checkpointKey = `${ticketNumber}-${checkpointAgent.agentName}`;
      this.handledCheckpoints.delete(checkpointKey);
    } catch (error) {
      this.updateStatus(`Error sending approval: ${error.message}`);
    }

    this.render();
  }

  /**
   * Handle checkpoint rejection
   */
  async onCheckpointReject(ticketNumber, checkpointAgent, feedback) {
    this.updateStatus(`Rejected checkpoint for ${checkpointAgent.agentName}`);

    const response = feedback ? `REJECTED: ${feedback}` : 'REJECTED';

    try {
      await this.orchestrator.sendCommandToAgent(
        ticketNumber,
        checkpointAgent.agentName,
        response
      );

      // Remove from handled checkpoints
      const checkpointKey = `${ticketNumber}-${checkpointAgent.agentName}`;
      this.handledCheckpoints.delete(checkpointKey);
    } catch (error) {
      this.updateStatus(`Error sending rejection: ${error.message}`);
    }

    this.render();
  }

  /**
   * Handle checkpoint feedback
   */
  async onCheckpointFeedback(ticketNumber, checkpointAgent, feedback) {
    this.updateStatus(`Sent feedback to ${checkpointAgent.agentName}`);

    const response = `FEEDBACK: ${feedback}`;

    try {
      await this.orchestrator.sendCommandToAgent(
        ticketNumber,
        checkpointAgent.agentName,
        response
      );

      // Remove from handled checkpoints
      const checkpointKey = `${ticketNumber}-${checkpointAgent.agentName}`;
      this.handledCheckpoints.delete(checkpointKey);
    } catch (error) {
      this.updateStatus(`Error sending feedback: ${error.message}`);
    }

    this.render();
  }

  /**
   * Handle checkpoint cancellation
   */
  onCheckpointCancel(ticketNumber, checkpointAgent) {
    this.updateStatus('Checkpoint approval cancelled');

    // Keep in handled checkpoints so it doesn't re-appear immediately
    // It will be cleared when the agent outputs a different status

    this.render();
  }

  /**
   * Handle tab change - load appropriate content
   */
  async onTabChanged() {
    const selectedSession = this.sessionList.getSelectedSession();
    if (!selectedSession) {
      this.render();
      return;
    }

    const selectedTabIndex = this.agentTabs.getSelectedIndex();

    // Tabs 0-3 are agent outputs (already handled by updateAgentTabs)
    if (selectedTabIndex <= 3) {
      this.updateAgentTabs(selectedSession);
    }
    // Tab 4 is Summary
    else if (selectedTabIndex === 4) {
      await this.showSummaryTab(selectedSession);
    }
    // Tab 5 is Response
    else if (selectedTabIndex === 5) {
      await this.showResponseTab(selectedSession);
    }

    this.render();
  }

  /**
   * Show summary tab content
   */
  async showSummaryTab(session) {
    this.updateStatus('Loading investigation summary...');

    try {
      const summary = await this.aggregator.loadSummary(
        session.ticketNumber || 'adhoc',
        1 // runNumber
      );

      this.sessionView.showSummary(summary);
      this.updateStatus('Summary loaded');
    } catch (error) {
      this.updateStatus(`Error loading summary: ${error.message}`);
      this.sessionView.showSummary('Error loading summary: ' + error.message);
    }
  }

  /**
   * Show response tab content
   */
  async showResponseTab(session) {
    this.updateStatus('Loading customer response...');

    try {
      const response = await this.aggregator.loadCustomerResponse(
        session.ticketNumber || 'adhoc',
        1 // runNumber
      );

      this.sessionView.showResponse(response);
      this.updateStatus('Response loaded (press i to edit)');
    } catch (error) {
      this.updateStatus(`Error loading response: ${error.message}`);
      this.sessionView.showResponse('Error loading response: ' + error.message);
    }
  }

  updateStatus(message) {
    this.statusBar.setText(message);
  }

  render() {
    this.screen.render();
  }
}

// Start the app
const app = new TriageSessionManager();
