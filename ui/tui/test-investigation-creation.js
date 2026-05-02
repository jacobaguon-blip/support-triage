#!/usr/bin/env node
/**
 * Test script for investigation creation logic
 * Tests the resilient error handling when API returns null
 */

import DatabaseAdapter from './db-adapter.js';

async function test() {
  console.log('Testing investigation creation...\n');

  const db = new DatabaseAdapter();

  // Test 1: Create an investigation
  const testTicketId = Date.now().toString().slice(-4);
  console.log(`Test 1: Creating investigation with ticketId: ${testTicketId}`);

  const investigationData = {
    ticketId: testTicketId,
    agentMode: 'team'
  };

  const result = await db.createInvestigation(investigationData);
  console.log('Create result:', result);

  // Test 2: Check if investigation exists (even if result is null)
  let investigation = result;
  if (!investigation) {
    console.log('\nTest 2: Result was null, checking if investigation exists anyway...');
    const allInvestigations = await db.getAllInvestigations();
    console.log(`Found ${allInvestigations.length} total investigations`);

    investigation = allInvestigations.find(inv =>
      inv.id.toString() === investigationData.ticketId.toString()
    );

    if (investigation) {
      console.log('✅ Investigation found despite null result!');
      console.log('Investigation data:', JSON.stringify(investigation, null, 2));
    } else {
      console.log('❌ Investigation not found');
    }
  } else {
    console.log('✅ Create returned valid result:', JSON.stringify(investigation, null, 2));
  }

  // Test 3: Verify we can use the investigation ID
  if (investigation) {
    console.log(`\nTest 3: Using investigation ID ${investigation.id} for session creation`);
    const sessionData = {
      id: investigation.id,
      ticketNumber: testTicketId,
      status: 'running'
    };
    console.log('Session would be created with:', JSON.stringify(sessionData, null, 2));
    console.log('✅ Can proceed with session creation');
  } else {
    console.log('❌ Cannot proceed - no investigation found');
  }
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
