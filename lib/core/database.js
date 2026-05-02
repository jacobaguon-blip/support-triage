/**
 * Database Wrapper
 * Simplified SQLite interface for CLI operations
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import os from 'os';

let db = null;

/**
 * Get or create database connection
 */
export async function getDb() {
  if (db) return db;

  const dbPath = path.join(os.homedir(), 'support-triage', 'triage.db');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  return db;
}

/**
 * Get investigation by ID
 */
export async function getInvestigation(id) {
  const db = await getDb();
  return await db.get('SELECT * FROM investigations WHERE id = ?', [id]);
}

/**
 * Update investigation
 */
export async function updateInvestigation(id, updates) {
  const db = await getDb();
  const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  await db.run(
    `UPDATE investigations SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`,
    values
  );

  return await getInvestigation(id);
}

/**
 * List investigations with optional filters
 */
export async function listInvestigations(filters = {}) {
  const db = await getDb();
  let query = 'SELECT * FROM investigations WHERE 1=1';
  const params = [];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  query += ' ORDER BY created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return await db.all(query, params);
}

/**
 * Get agents for an investigation
 */
export async function getAgents(investigationId) {
  const db = await getDb();
  return await db.all(
    'SELECT * FROM agents WHERE investigation_id = ? ORDER BY started_at ASC',
    [investigationId]
  );
}

/**
 * Create or update agent
 */
export async function upsertAgent(agentData) {
  const db = await getDb();

  const existing = await db.get(
    'SELECT id FROM agents WHERE investigation_id = ? AND agent_name = ?',
    [agentData.investigation_id, agentData.agent_name]
  );

  if (existing) {
    // Update
    const updates = Object.keys(agentData)
      .filter(k => k !== 'investigation_id' && k !== 'agent_name')
      .map(k => `${k} = ?`)
      .join(', ');
    const values = Object.keys(agentData)
      .filter(k => k !== 'investigation_id' && k !== 'agent_name')
      .map(k => agentData[k]);
    values.push(existing.id);

    await db.run(`UPDATE agents SET ${updates} WHERE id = ?`, values);
    return existing.id;
  } else {
    // Insert
    const columns = Object.keys(agentData).join(', ');
    const placeholders = Object.keys(agentData).map(() => '?').join(', ');
    const values = Object.values(agentData);

    const result = await db.run(
      `INSERT INTO agents (${columns}) VALUES (${placeholders})`,
      values
    );
    return result.lastID;
  }
}

export default {
  getDb,
  getInvestigation,
  updateInvestigation,
  listInvestigations,
  getAgents,
  upsertAgent
};
