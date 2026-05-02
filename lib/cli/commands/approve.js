/**
 * triage approve command
 * Approve a checkpoint and continue investigation
 */

import { createInvestigationLogger } from '../../core/logger.js';
import { getInvestigation, updateInvestigation } from '../../core/database.js';
import agentManager from '../../core/agent-manager.js';

export default async function approveCommand(id, checkpoint, options) {
  const { feedback } = options;

  console.log(`Approving checkpoint for investigation #${id}...`);
  console.log(`Checkpoint: ${checkpoint}`);
  if (feedback) {
    console.log(`Feedback: ${feedback}`);
  }
  console.log('');

  const logger = createInvestigationLogger(id, 'main');
  logger.info('Checkpoint approval requested', { checkpoint, feedback });

  try {
    // Get current investigation
    const investigation = await getInvestigation(id);

    if (!investigation) {
      throw new Error(`Investigation #${id} not found`);
    }

    if (investigation.status !== 'waiting') {
      throw new Error(`Investigation is not waiting (current status: ${investigation.status})`);
    }

    if (investigation.current_checkpoint !== checkpoint) {
      throw new Error(`Investigation is at different checkpoint: ${investigation.current_checkpoint}`);
    }

    // Update investigation in database directly (CLI-first architecture)
    await updateInvestigation(id, {
      status: 'running',
      current_checkpoint: null
    });

    logger.info('Checkpoint approved', { checkpoint, feedback });

    console.log('✅ Checkpoint approved!');
    console.log('');

    // If this is checkpoint_1 (post-classification), spawn Phase 1 agents
    if (checkpoint === 'checkpoint_1_post_classification') {
      console.log('Starting Phase 1 (Context Gathering)...');
      logger.info('Starting Phase 1 - spawning agents');

      // Define agents for troubleshoot skill (from CLAUDE.md)
      const agents = ['Slack', 'Linear', 'Pylon', 'Codebase'];

      console.log(`Spawning ${agents.length} agents:`);

      const agentProcesses = await agentManager.spawnAgents({
        id: investigation.id,
        ticketNumber: investigation.id,
        customerName: investigation.customer_name,
        extraContext: feedback || '',
        skill: 'troubleshoot' // TODO: Get from investigation
      }, agents);

      console.log('');
      agentProcesses.forEach(agent => {
        console.log(`  ✓ ${agent.agent} Agent (PID ${agent.pid})`);
        console.log(`    Log: ${agent.logFile}`);
      });

      console.log('');
      console.log('Agents running in background...');
      logger.info('Agents spawned', {
        agent_count: agentProcesses.length,
        agents: agentProcesses.map(a => ({ name: a.agent, pid: a.pid }))
      });
    } else {
      console.log('Investigation continuing...');
    }

    console.log('');
    console.log('Watch progress:');
    console.log(`  triage logs ${id} -f`);
    console.log('');
    console.log('Watch specific agent:');
    console.log(`  triage logs ${id} --agent slack -f`);
    console.log('');
    console.log('Check status:');
    console.log(`  triage status ${id}`);
    console.log('');

    logger.close();

  } catch (error) {
    logger.error('Checkpoint approval failed', { error: error.message, stack: error.stack });
    logger.close();
    console.error('');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
