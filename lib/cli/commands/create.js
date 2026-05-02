/**
 * triage create command
 * Creates a new investigation and runs Phase 0 (classification)
 */

import path from 'path';
import os from 'os';
import { createInvestigationLogger } from '../../core/logger.js';

export default async function createCommand(options) {
  const { ticket, skill, customer, context, autoProceed } = options;

  console.log(`Creating investigation for ticket #${ticket}...`);
  console.log(`Skill: ${skill}`);
  if (customer) console.log(`Customer: ${customer}`);
  if (context) console.log(`Context: ${context}`);
  console.log('');

  // Create logger
  const logger = createInvestigationLogger(ticket, 'main');
  logger.info('Investigation create started', { ticket, skill, customer, context });

  try {
    // Call Express API to create investigation
    // (Reuse existing Phase 0 logic in server.js)
    const response = await fetch('http://localhost:3001/api/investigations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId: ticket,
        agentMode: 'team',
        customer_name: customer,
        extra_context: context
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    logger.info('Investigation created via API', { result });

    // Wait for Phase 0 to complete
    console.log('Waiting for Phase 0 (classification) to complete...');
    logger.info('Waiting for Phase 0');

    const investigation = await waitForPhase0(ticket, logger);

    // Display results
    console.log('');
    console.log('✅ Investigation created successfully!');
    console.log('');
    console.log(`Investigation #${investigation.id}`);
    console.log(`Customer: ${investigation.customer_name || 'Unknown'}`);
    console.log(`Classification: ${investigation.classification || 'pending'}`);
    if (investigation.connector_name) {
      console.log(`Connector: ${investigation.connector_name}`);
    }
    console.log(`Product Area: ${investigation.product_area || 'Unknown'}`);
    console.log(`Priority: ${investigation.priority || 'Unknown'}`);
    console.log(`Status: ${investigation.status}`);
    console.log(`Checkpoint: ${investigation.current_checkpoint || 'none'}`);
    console.log('');
    console.log(`Investigation Dir: ${investigation.output_path}`);
    console.log(`Main Log: ${path.join(os.homedir(), 'support-triage', 'logs', `${ticket}-main.jsonl`)}`);
    console.log('');

    if (investigation.status === 'waiting') {
      console.log(`⏸️  Waiting at checkpoint: ${investigation.current_checkpoint}`);
      console.log('');
      console.log('To approve and continue:');
      console.log(`  triage approve ${ticket} ${investigation.current_checkpoint}`);
      console.log('');
      console.log('To watch logs:');
      console.log(`  triage logs ${ticket} -f`);
    }

    logger.info('Investigation create completed', { investigation });
    logger.close();

  } catch (error) {
    logger.error('Investigation create failed', { error: error.message, stack: error.stack });
    logger.close();
    console.error('');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Wait for Phase 0 to complete (poll API instead of DB directly,
 * since Express uses an in-memory sql.js DB that the sqlite3 driver can't see)
 */
async function waitForPhase0(ticketId, logger, maxWait = 60000) {
  const startTime = Date.now();
  const pollInterval = 1000;

  while (Date.now() - startTime < maxWait) {
    try {
      const res = await fetch(`http://localhost:3001/api/investigations/${ticketId}`);
      if (res.ok) {
        const investigation = await res.json();

        // Phase 0 is done when we have classification and are at checkpoint 1
        const phase0Complete = investigation.classification &&
                              (investigation.status === 'waiting' || investigation.status === 'running');

        if (phase0Complete) {
          logger.info('Phase 0 completed', {
            classification: investigation.classification,
            status: investigation.status
          });
          return investigation;
        }
      }
    } catch {
      // API not reachable yet, keep polling
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Timeout waiting for Phase 0 to complete');
}
