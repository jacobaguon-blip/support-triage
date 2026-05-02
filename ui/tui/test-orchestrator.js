#!/usr/bin/env node
/**
 * Test script for tmux orchestrator
 * Tests spawning agents in tmux with Claude Code
 */

import TmuxOrchestrator from './orchestrator.js';

async function test() {
  console.log('Testing tmux orchestrator...\n');

  const orchestrator = new TmuxOrchestrator();

  // Check tmux availability
  const tmuxAvailable = await orchestrator.checkTmuxAvailable();
  if (!tmuxAvailable) {
    console.error('❌ tmux is not available');
    process.exit(1);
  }
  console.log('✅ tmux is available');

  // Test investigation data
  const investigation = {
    id: 9999,
    ticketNumber: '9999',
    customerName: 'Test Customer',
    extraContext: 'Testing orchestrator',
    skill: 'troubleshoot',
    runNumber: 1
  };

  const agents = ['Slack']; // Just test with one agent

  console.log('\nCreating tmux session with 1 agent...');
  try {
    const session = await orchestrator.createSession(investigation, agents);
    console.log('✅ tmux session created:', session.sessionName);
    console.log('\nAgent spawned. Check the tmux session:');
    console.log(`  tmux attach -t ${session.sessionName}`);
    console.log('\nPress Ctrl+B then D to detach without killing the session.');
    console.log('\nWait a few seconds, then check if Claude Code started in the pane.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

test();
