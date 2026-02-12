/**
 * triage status command
 * Show investigation status — fetches from Express API
 */

import path from 'path';
import os from 'os';
import fs from 'fs';

const API_BASE = 'http://localhost:3001';

async function fetchJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API returned HTTP ${resp.status}`);
  return resp.json();
}

export default async function statusCommand(id, options) {
  try {
    const investigation = await fetchJSON(`${API_BASE}/api/investigations/${id}`);

    if (!investigation) {
      console.error(`Investigation #${id} not found`);
      process.exit(1);
    }

    // Fetch agents from Express API
    let agents = [];
    try {
      agents = await fetchJSON(`${API_BASE}/api/investigations/${id}/agents`);
    } catch {
      // API may not be running, fall back to empty
    }

    if (options.json) {
      console.log(JSON.stringify({ investigation, agents }, null, 2));
      return;
    }

    // Display human-readable status
    console.log('');
    console.log(`Investigation #${investigation.id}`);
    console.log('─'.repeat(50));
    console.log(`Customer: ${investigation.customer_name || 'Unknown'}`);
    console.log(`Classification: ${investigation.classification || 'pending'}`);
    if (investigation.connector_name) {
      console.log(`Connector: ${investigation.connector_name}`);
    }
    console.log(`Product Area: ${investigation.product_area || 'Unknown'}`);
    console.log(`Priority: ${investigation.priority || 'Unknown'}`);
    console.log(`Status: ${investigation.status}`);
    if (investigation.current_checkpoint) {
      console.log(`Checkpoint: ${investigation.current_checkpoint}`);
    }
    console.log(`Created: ${investigation.created_at}`);
    console.log(`Updated: ${investigation.updated_at}`);
    console.log('');

    // Show agents if any
    if (agents.length > 0) {
      console.log('Agents:');
      console.log('─'.repeat(50));
      for (const agent of agents) {
        const statusEmoji = {
          pending: '○',
          running: '🟡',
          completed: '🟢',
          error: '🔴',
          checkpoint: '🔵'
        }[agent.status] || '?';

        console.log(`  ${statusEmoji} ${agent.agent_name}: ${agent.status}`);
        if (agent.findings_file) {
          console.log(`     Findings: ${agent.findings_file}`);
        }
        if (agent.error_message) {
          console.log(`     Error: ${agent.error_message}`);
        }
      }
      console.log('');
    }

    // Show files
    console.log('Files:');
    console.log('─'.repeat(50));
    console.log(`Investigation: ${investigation.output_path}`);

    const logsDir = path.join(os.homedir(), 'support-triage', 'logs');
    const mainLog = path.join(logsDir, `${id}-main.jsonl`);
    if (fs.existsSync(mainLog)) {
      const lines = fs.readFileSync(mainLog, 'utf8').split('\n').filter(l => l.length > 0).length;
      console.log(`Main Log: ${mainLog} (${lines} lines)`);
    }

    // Agent logs
    for (const agentName of ['slack', 'linear', 'pylon', 'codebase']) {
      const agentLog = path.join(logsDir, `${id}-agent-${agentName}.jsonl`);
      if (fs.existsSync(agentLog)) {
        const lines = fs.readFileSync(agentLog, 'utf8').split('\n').filter(l => l.length > 0).length;
        console.log(`${agentName} Log: ${agentLog} (${lines} lines)`);
      }
    }
    console.log('');

    // Show next steps
    if (investigation.status === 'waiting') {
      console.log('Next steps:');
      console.log('─'.repeat(50));
      console.log(`Approve checkpoint:`);
      console.log(`  triage approve ${id} ${investigation.current_checkpoint}`);
      console.log('');
      console.log('Watch logs:');
      console.log(`  triage logs ${id} -f`);
      console.log('');
    } else if (investigation.status === 'running') {
      console.log('Investigation is running...');
      console.log('─'.repeat(50));
      console.log('Watch logs:');
      console.log(`  triage logs ${id} -f`);
      console.log('');
      console.log('Check agent logs:');
      console.log(`  triage logs ${id} --agent slack -f`);
      console.log('');
    } else if (investigation.status === 'completed') {
      console.log('Investigation completed!');
      console.log('─'.repeat(50));
      console.log('View results:');
      console.log(`  cat ${investigation.output_path}/summary.md`);
      console.log(`  cat ${investigation.output_path}/customer-response.md`);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
