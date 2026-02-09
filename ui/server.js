import express from 'express'
import cors from 'cors'
import initSqlJs from 'sql.js'
import { spawn } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync, renameSync, cpSync } from 'fs'
import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { runPhase0, runPhase1, runPhase2, populateFromTicketData } from './investigation-runner.js'
import { createSnapshot, restoreToVersion, getVersions, getVersionDiff } from './version-manager.js'
import { syncTicketResponses, checkForNewResponses } from './response-sync.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Paths
const TRIAGE_DIR = resolve(__dirname, '..')
const DB_PATH = join(TRIAGE_DIR, 'triage.db')
const SETTINGS_PATH = join(TRIAGE_DIR, 'settings.json')
const INVESTIGATIONS_DIR = join(TRIAGE_DIR, 'investigations')
const CLAUDE_MD = join(TRIAGE_DIR, 'CLAUDE.md')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ============ DATABASE ============

let SQL = null
let db = null
let dbLastMtime = 0

async function initDB() {
  SQL = await initSqlJs()
  reloadDB()
}

function reloadDB() {
  try {
    if (existsSync(DB_PATH)) {
      const stat = statSync(DB_PATH)
      const mtime = stat.mtimeMs
      if (mtime !== dbLastMtime) {
        const buffer = readFileSync(DB_PATH)
        if (db) db.close()
        db = new SQL.Database(buffer)
        dbLastMtime = mtime
        migrateExistingDB()
      }
    } else {
      if (db) db.close()
      db = new SQL.Database()
      createAllTables()
      saveDB()
    }
  } catch (err) {
    console.error('Error reloading DB:', err.message)
  }
}

function saveDB() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    writeFileSync(DB_PATH, buffer)
    try { dbLastMtime = statSync(DB_PATH).mtimeMs } catch {}
  }
}

function createAllTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS investigations (
      id INTEGER PRIMARY KEY,
      customer_name TEXT,
      classification TEXT,
      connector_name TEXT,
      product_area TEXT,
      priority TEXT,
      suggested_priority TEXT,
      status TEXT,
      current_checkpoint TEXT,
      auto_proceed INTEGER DEFAULT 0,
      agent_mode TEXT DEFAULT 'team',
      created_at DATETIME,
      updated_at DATETIME,
      resolved_at DATETIME,
      resolution_type TEXT,
      output_path TEXT,
      linear_issue_id TEXT,
      notion_page_id TEXT,
      tags TEXT,
      snapshot TEXT,
      current_version_id INTEGER,
      anchor_version_id INTEGER,
      last_response_check_at DATETIME,
      current_run_number INTEGER DEFAULT 1,
      last_customer_message_at DATETIME,
      debounce_timer_id TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER NOT NULL,
      run_number INTEGER DEFAULT 1,
      type TEXT NOT NULL,
      phase TEXT,
      actor_name TEXT,
      actor_role TEXT,
      content TEXT,
      content_preview TEXT,
      metadata TEXT,
      version_id INTEGER,
      is_collapsed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS investigation_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER NOT NULL,
      run_number INTEGER DEFAULT 1,
      version_number INTEGER NOT NULL,
      label TEXT,
      checkpoint TEXT,
      snapshot_investigation TEXT,
      snapshot_files TEXT,
      diff_summary TEXT,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS investigation_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER NOT NULL,
      run_number INTEGER NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_summary TEXT,
      status TEXT DEFAULT 'running',
      current_checkpoint TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      UNIQUE(investigation_id, run_number)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS ticket_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER NOT NULL,
      pylon_message_id TEXT,
      sequence_number INTEGER,
      actor_role TEXT,
      actor_name TEXT,
      content TEXT,
      created_at DATETIME,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      triggered_reanalysis INTEGER DEFAULT 0
    )
  `)
}

function migrateExistingDB() {
  // Add new columns to investigations if they don't exist
  const investigationCols = {
    'current_version_id': 'INTEGER',
    'anchor_version_id': 'INTEGER',
    'last_response_check_at': 'DATETIME',
    'current_run_number': 'INTEGER DEFAULT 1',
    'last_customer_message_at': 'DATETIME',
    'debounce_timer_id': 'TEXT'
  }
  for (const [col, type] of Object.entries(investigationCols)) {
    try {
      db.run(`ALTER TABLE investigations ADD COLUMN ${col} ${type}`)
    } catch { /* column already exists */ }
  }

  // Add run_number to conversation_items and investigation_versions
  for (const table of ['conversation_items', 'investigation_versions']) {
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN run_number INTEGER DEFAULT 1`)
    } catch { /* column already exists */ }
  }

  // Create new tables (IF NOT EXISTS is safe)
  createAllTables()

  // Bootstrap investigation_runs for existing investigations that don't have runs yet
  try {
    const investigations = db.prepare('SELECT id, status, current_checkpoint, created_at FROM investigations')
    const invs = []
    while (investigations.step()) invs.push(investigations.getAsObject())
    investigations.free()

    for (const inv of invs) {
      const existingRun = db.prepare('SELECT id FROM investigation_runs WHERE investigation_id = ? AND run_number = 1')
      existingRun.bind([inv.id])
      const hasRun = existingRun.step()
      existingRun.free()

      if (!hasRun) {
        db.run(
          `INSERT INTO investigation_runs (investigation_id, run_number, trigger_type, trigger_summary, status, current_checkpoint, created_at)
           VALUES (?, 1, 'manual', 'Initial investigation', ?, ?, ?)`,
          [inv.id, inv.status || 'waiting', inv.current_checkpoint, inv.created_at || new Date().toISOString()]
        )
        console.log(`[Migration] Created run #1 for investigation #${inv.id}`)
      }
    }
  } catch (err) {
    console.error('[Migration] Error bootstrapping runs:', err.message)
  }

  saveDB()
}

function queryAll(sql, params = []) {
  reloadDB()
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const results = []
  while (stmt.step()) results.push(stmt.getAsObject())
  stmt.free()
  return results
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params)
  return results.length > 0 ? results[0] : null
}

function run(sql, params = []) {
  reloadDB()
  db.run(sql, params)
  saveDB()
}

// ============ DB HELPERS for investigation runner ============

const dbHelpers = {
  queryAll,
  queryOne,
  run,
  updateInvestigation(id, fields) {
    const allowedFields = [
      'customer_name', 'classification', 'connector_name', 'product_area',
      'priority', 'suggested_priority', 'status', 'current_checkpoint',
      'auto_proceed', 'agent_mode', 'resolution_type', 'linear_issue_id',
      'notion_page_id', 'tags', 'snapshot', 'updated_at', 'resolved_at',
      'current_version_id', 'anchor_version_id', 'last_response_check_at',
      'current_run_number', 'last_customer_message_at', 'debounce_timer_id'
    ]

    const setClauses = []
    const params = []

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`)
        params.push(value)
      }
    }

    if (setClauses.length === 0) return

    // Always update updated_at if not explicitly set
    if (!fields.updated_at) {
      setClauses.push('updated_at = ?')
      params.push(new Date().toISOString().replace('T', ' ').split('.')[0])
    }

    params.push(id)
    run(`UPDATE investigations SET ${setClauses.join(', ')} WHERE id = ?`, params)
  },

  getInvestigation(id) {
    return queryOne('SELECT * FROM investigations WHERE id = ?', [id])
  }
}

// ============ BOOTSTRAP: Populate existing investigations from ticket-data.json ============

function bootstrapInvestigations() {
  console.log('[Bootstrap] Checking for investigations needing data...')

  let populated = 0
  let created = 0

  // Pass 1: Scan filesystem for investigation directories with ticket-data.json
  // and create DB records if they don't exist
  if (existsSync(INVESTIGATIONS_DIR)) {
    const dirs = readdirSync(INVESTIGATIONS_DIR)
    for (const dir of dirs) {
      const id = parseInt(dir)
      if (isNaN(id)) continue

      const investigationDir = join(INVESTIGATIONS_DIR, dir)
      const tdPath = join(investigationDir, 'ticket-data.json')
      if (!existsSync(tdPath)) continue

      // Check if DB record exists
      const existing = queryOne('SELECT id FROM investigations WHERE id = ?', [id])
      if (!existing) {
        // Create DB record from ticket-data.json
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]
        run(`
          INSERT INTO investigations (
            id, status, agent_mode, current_checkpoint,
            created_at, updated_at, output_path
          ) VALUES (?, 'waiting', 'team', 'checkpoint_1_post_classification', ?, ?, ?)
        `, [id, timestamp, timestamp, investigationDir])
        console.log(`[Bootstrap] Created DB record for investigation #${id}`)
        created++
      }
    }
  }

  // Pass 2: Populate fields for any records with null customer_name
  const investigations = queryAll('SELECT id, customer_name FROM investigations')

  for (const inv of investigations) {
    if (!inv.customer_name) {
      const investigationDir = join(INVESTIGATIONS_DIR, String(inv.id))
      if (populateFromTicketData(inv.id, investigationDir, dbHelpers)) {
        populated++
      }
    }
  }

  if (created > 0 || populated > 0) {
    console.log(`[Bootstrap] Created ${created} record(s), populated ${populated} investigation(s)`)
  } else {
    console.log('[Bootstrap] All investigations already have data')
  }
}

// ============ API ROUTES ============

// GET /api/investigations - List all
app.get('/api/investigations', (req, res) => {
  try {
    const investigations = queryAll('SELECT * FROM investigations ORDER BY updated_at DESC')
    res.json(investigations)
  } catch (error) {
    console.error('Error loading investigations:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/investigations/:id - Get single
app.get('/api/investigations/:id', (req, res) => {
  try {
    const inv = queryOne('SELECT * FROM investigations WHERE id = ?', [parseInt(req.params.id)])
    if (!inv) return res.status(404).json({ error: 'Investigation not found' })
    res.json(inv)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/investigations - Create new investigation
app.post('/api/investigations', (req, res) => {
  try {
    const { ticketId, agentMode } = req.body
    if (!ticketId) return res.status(400).json({ error: 'ticketId is required' })

    const id = parseInt(ticketId)
    const mode = agentMode || 'team'
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]

    // Check existing
    const existing = queryOne('SELECT id, status FROM investigations WHERE id = ?', [id])
    if (existing) {
      return res.status(409).json({
        error: 'Investigation already exists',
        status: existing.status,
        message: `Investigation #${id} already exists with status: ${existing.status}`
      })
    }

    // Create directory
    const investigationDir = join(INVESTIGATIONS_DIR, String(id))
    mkdirSync(investigationDir, { recursive: true })

    // Insert DB record
    run(`
      INSERT INTO investigations (
        id, status, agent_mode, current_checkpoint,
        created_at, updated_at, output_path, current_run_number
      ) VALUES (?, 'running', ?, 'checkpoint_1_post_classification', ?, ?, ?, 1)
    `, [id, mode, timestamp, timestamp, investigationDir])

    // Create initial run record
    run(
      `INSERT INTO investigation_runs (investigation_id, run_number, trigger_type, trigger_summary, status, current_checkpoint, created_at)
       VALUES (?, 1, 'manual', 'Initial investigation', 'running', 'checkpoint_1_post_classification', ?)`,
      [id, timestamp]
    )

    // Respond immediately, then run Phase 0 in background
    res.json({
      success: true,
      id,
      status: 'running',
      message: `Investigation #${id} created. Fetching ticket data...`,
      investigationDir
    })

    // Fire-and-forget: Run Phase 0 to fetch Pylon data and classify
    console.log(`[Server] Launching Phase 0 for investigation #${id}`)
    runPhase0(id, investigationDir, dbHelpers, 1).catch(err => {
      console.error(`[Server] Phase 0 failed for #${id}:`, err.message)
    })

  } catch (error) {
    console.error('Error creating investigation:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/investigations/:id/files - Get investigation files (phase-based)
app.get('/api/investigations/:id/files', async (req, res) => {
  try {
    const id = req.params.id
    const investigationDir = join(INVESTIGATIONS_DIR, id)

    const files = {}

    // Phase 0 output: parsed ticket data
    try {
      const raw = await readFile(join(investigationDir, 'ticket-data.json'), 'utf-8')
      files.ticketData = JSON.parse(raw)
    } catch {
      files.ticketData = null
    }

    // Phase 1 output: context gathering findings
    try {
      files.phase1Findings = await readFile(join(investigationDir, 'phase1-findings.md'), 'utf-8')
    } catch {
      files.phase1Findings = null
    }

    // Phase 2 outputs: investigation documents
    const phase2Files = {
      summary: 'summary.md',
      customerResponse: 'customer-response.md',
      linearDraft: 'linear-draft.md'
    }
    for (const [key, fileName] of Object.entries(phase2Files)) {
      try {
        files[key] = await readFile(join(investigationDir, fileName), 'utf-8')
      } catch {
        files[key] = null
      }
    }

    // Decision history: checkpoint actions
    try {
      const raw = await readFile(join(investigationDir, 'checkpoint-actions.json'), 'utf-8')
      files.checkpointActions = JSON.parse(raw)
    } catch {
      files.checkpointActions = []
    }

    // Additional files
    try {
      files.agentTranscript = await readFile(join(investigationDir, 'agent-transcript.txt'), 'utf-8')
    } catch {
      files.agentTranscript = null
    }
    try {
      const raw = await readFile(join(investigationDir, 'metrics.json'), 'utf-8')
      files.metrics = JSON.parse(raw)
    } catch {
      files.metrics = null
    }

    res.json(files)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/investigations/:id/activity - Get activity log (polling-friendly)
app.get('/api/investigations/:id/activity', async (req, res) => {
  try {
    const id = req.params.id
    const investigationDir = join(INVESTIGATIONS_DIR, id)
    const logPath = join(investigationDir, 'activity-log.jsonl')

    if (!existsSync(logPath)) {
      return res.json([])
    }

    const raw = await readFile(logPath, 'utf-8')
    const activities = raw
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line) }
        catch { return null }
      })
      .filter(Boolean)

    // Optional: filter by ?since=ISO_TIMESTAMP for incremental polling
    const since = req.query.since
    if (since) {
      const sinceDate = new Date(since)
      return res.json(activities.filter(a => new Date(a.ts) > sinceDate))
    }

    res.json(activities)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/investigations/:id/conversation — paginated conversation items
app.get('/api/investigations/:id/conversation', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const since = req.query.since
    let items
    if (since) {
      items = queryAll(
        'SELECT * FROM conversation_items WHERE investigation_id = ? AND created_at > ? ORDER BY created_at ASC',
        [id, since]
      )
    } else {
      items = queryAll(
        'SELECT * FROM conversation_items WHERE investigation_id = ? ORDER BY created_at ASC',
        [id]
      )
    }
    // Parse metadata JSON for each item
    items = items.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null
    }))
    res.json(items)
  } catch (error) {
    console.error('Error loading conversation:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/investigations/:id/versions — list all version snapshots
app.get('/api/investigations/:id/versions', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const dbCtx = { queryAll, queryOne, run }
    const versions = getVersions(dbCtx, id)
    res.json(versions)
  } catch (error) {
    console.error('Error loading versions:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/investigations/:id/versions/restore — restore to a previous version
app.post('/api/investigations/:id/versions/restore', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { versionId, mode } = req.body
    if (!versionId || !mode) {
      return res.status(400).json({ error: 'versionId and mode are required' })
    }
    const dbCtx = { queryAll, queryOne, run }
    const result = restoreToVersion(dbCtx, id, versionId, mode)
    res.json(result)
  } catch (error) {
    console.error('Error restoring version:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/investigations/:id/sync-responses — trigger Pylon response sync
app.post('/api/investigations/:id/sync-responses', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const inv = queryOne('SELECT * FROM investigations WHERE id = ?', [id])
    if (!inv) return res.status(404).json({ error: 'Investigation not found' })

    // Get ticket body from ticket-data.json
    const investigationDir = join(INVESTIGATIONS_DIR, String(id))
    const tdPath = join(investigationDir, 'ticket-data.json')
    let ticketBody = ''
    let customerName = inv.customer_name || 'Unknown'

    if (existsSync(tdPath)) {
      try {
        const td = JSON.parse(readFileSync(tdPath, 'utf-8'))
        ticketBody = td.body || td.description || ''
        customerName = td.customer_name || customerName
      } catch {}
    }

    if (!ticketBody) {
      return res.json({ newCount: 0, totalCount: 0, newResponses: [], message: 'No ticket body available' })
    }

    const dbCtx = { queryAll, queryOne, run }
    const result = syncTicketResponses(dbCtx, id, ticketBody, customerName)

    // Update last_response_check_at
    run('UPDATE investigations SET last_response_check_at = ? WHERE id = ?',
      [new Date().toISOString(), id])

    res.json(result)
  } catch (error) {
    console.error('Error syncing responses:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/investigations/:id/runs — list all runs for this ticket
app.get('/api/investigations/:id/runs', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const runs = queryAll(
      'SELECT * FROM investigation_runs WHERE investigation_id = ? ORDER BY run_number ASC',
      [id]
    )
    res.json(runs)
  } catch (error) {
    console.error('Error loading runs:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/investigations/:id/runs/:runNumber/conversation — conversation items for a specific run
app.get('/api/investigations/:id/runs/:runNumber/conversation', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const runNumber = parseInt(req.params.runNumber)
    const since = req.query.since

    let items
    if (since) {
      items = queryAll(
        'SELECT * FROM conversation_items WHERE investigation_id = ? AND run_number = ? AND created_at > ? ORDER BY created_at ASC',
        [id, runNumber, since]
      )
    } else {
      items = queryAll(
        'SELECT * FROM conversation_items WHERE investigation_id = ? AND run_number = ? ORDER BY created_at ASC',
        [id, runNumber]
      )
    }

    items = items.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null
    }))
    res.json(items)
  } catch (error) {
    console.error('Error loading run conversation:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/investigations/:id/hard-reset — wipe and restart investigation from Phase 0
app.post('/api/investigations/:id/hard-reset', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    console.log(`[HardReset] Received hard reset request for investigation #${id}`)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid investigation ID', message: `Invalid ID: ${req.params.id}` })

    const inv = queryOne('SELECT * FROM investigations WHERE id = ?', [id])
    if (!inv) return res.status(404).json({ error: 'Investigation not found', message: `No investigation with ID ${id}` })

    console.log(`[HardReset] Investigation #${id} found. Status: ${inv.status}, current_run_number: ${inv.current_run_number}`)

    const investigationDir = join(INVESTIGATIONS_DIR, String(id))
    const timestamp = new Date().toISOString()
    const ts = timestamp.replace('T', ' ').split('.')[0]
    const currentRunNumber = inv.current_run_number || 1
    const newRunNumber = currentRunNumber + 1

    // 1. Mark current run as superseded
    run(
      `UPDATE investigation_runs SET status = 'superseded', completed_at = ? WHERE investigation_id = ? AND run_number = ?`,
      [timestamp, id, currentRunNumber]
    )

    // 2. Archive current investigation files to run-{N}/ subdirectory
    const archiveDir = join(investigationDir, `run-${currentRunNumber}`)
    mkdirSync(archiveDir, { recursive: true })

    const filesToArchive = [
      'ticket-data.json', 'phase1-findings.md', 'summary.md',
      'customer-response.md', 'linear-draft.md', 'checkpoint-actions.json',
      'activity-log.jsonl', 'metrics.json', 'agent-transcript.txt',
      'triage-prompt.txt'
    ]

    for (const fname of filesToArchive) {
      const src = join(investigationDir, fname)
      if (existsSync(src)) {
        try {
          cpSync(src, join(archiveDir, fname))
        } catch (e) {
          console.error(`[HardReset] Error archiving ${fname}:`, e.message)
        }
      }
    }

    // Remove old files from root (so new run starts clean)
    for (const fname of filesToArchive) {
      const src = join(investigationDir, fname)
      if (existsSync(src)) {
        try {
          writeFileSync(src, '') // truncate
          // Actually remove by overwriting — we can't use unlinkSync in sandbox
        } catch {}
      }
    }
    // Actually just remove the files we want to clean — the important ones
    for (const fname of ['phase1-findings.md', 'summary.md', 'customer-response.md', 'linear-draft.md', 'checkpoint-actions.json', 'activity-log.jsonl', 'metrics.json', 'agent-transcript.txt', 'triage-prompt.txt']) {
      const src = join(investigationDir, fname)
      if (existsSync(src)) {
        try { writeFileSync(src, '') } catch {}
      }
    }

    // 3. Create new run record
    run(
      `INSERT INTO investigation_runs (investigation_id, run_number, trigger_type, trigger_summary, status, current_checkpoint, created_at)
       VALUES (?, ?, 'hard_reset', 'Manual hard reset', 'running', 'checkpoint_1_post_classification', ?)`,
      [id, newRunNumber, timestamp]
    )

    // 4. Reset investigation state
    run(
      `UPDATE investigations SET
        classification = NULL, connector_name = NULL, product_area = NULL,
        priority = NULL, suggested_priority = NULL,
        status = 'running', current_checkpoint = 'checkpoint_1_post_classification',
        current_run_number = ?, updated_at = ?,
        current_version_id = NULL, anchor_version_id = NULL
       WHERE id = ?`,
      [newRunNumber, ts, id]
    )

    // 5. Insert reset_marker conversation item (on the NEW run)
    run(
      `INSERT INTO conversation_items (investigation_id, run_number, type, actor_name, actor_role, content, content_preview, metadata, created_at)
       VALUES (?, ?, 'reset_marker', 'System', 'system', ?, ?, ?, ?)`,
      [id, newRunNumber,
       `Investigation hard reset — starting fresh as Run #${newRunNumber}`,
       `Hard reset → Run #${newRunNumber}`,
       JSON.stringify({ trigger: 'hard_reset', previous_run: currentRunNumber, new_run: newRunNumber }),
       timestamp]
    )

    // 6. Respond immediately
    res.json({
      success: true,
      previousRunNumber: currentRunNumber,
      newRunNumber,
      message: `Investigation #${id} hard reset. Starting Run #${newRunNumber}.`
    })

    // 7. Fire-and-forget: Re-run Phase 0
    console.log(`[Server] Hard reset → launching Phase 0 for #${id} (Run #${newRunNumber})`)
    runPhase0(id, investigationDir, dbHelpers, newRunNumber).catch(err => {
      console.error(`[Server] Phase 0 failed for #${id} (Run #${newRunNumber}):`, err.message)
    })

  } catch (error) {
    console.error('[HardReset] Error during hard reset:', error)
    res.status(500).json({ error: error.message, message: `Hard reset failed: ${error.message}` })
  }
})

// POST /api/investigations/:id/check-new-responses — poll Pylon for new messages + debounce
app.post('/api/investigations/:id/check-new-responses', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const inv = queryOne('SELECT * FROM investigations WHERE id = ?', [id])
    if (!inv) return res.status(404).json({ error: 'Investigation not found' })

    const investigationDir = join(INVESTIGATIONS_DIR, String(id))
    const tdPath = join(investigationDir, 'ticket-data.json')
    let ticketBody = ''
    let customerName = inv.customer_name || 'Unknown'

    if (existsSync(tdPath)) {
      try {
        const td = JSON.parse(readFileSync(tdPath, 'utf-8'))
        ticketBody = td.body || td.description || ''
        customerName = td.customer_name || customerName
      } catch {}
    }

    if (!ticketBody) {
      return res.json({ hasNew: false, newCount: 0, message: 'No ticket body available' })
    }

    const dbCtx = { queryAll, queryOne, run }
    const checkResult = checkForNewResponses(dbCtx, id, ticketBody, customerName)

    if (checkResult.hasNew) {
      // Sync the new responses into the DB
      const syncResult = syncTicketResponses(dbCtx, id, ticketBody, customerName)

      // Update last_customer_message_at
      run('UPDATE investigations SET last_customer_message_at = ?, last_response_check_at = ? WHERE id = ?',
        [new Date().toISOString(), new Date().toISOString(), id])

      // Start or reset debounce timer (handled by debounce-manager)
      const { startDebounceTimer } = await import('./debounce-manager.js')
      startDebounceTimer(id, dbCtx, dbHelpers, investigationDir)

      res.json({
        hasNew: true,
        newCount: syncResult.newCount,
        message: `${syncResult.newCount} new message(s) detected. Debounce timer started.`,
        debounceMinutes: 20
      })
    } else {
      run('UPDATE investigations SET last_response_check_at = ? WHERE id = ?',
        [new Date().toISOString(), id])
      res.json({ hasNew: false, newCount: 0 })
    }
  } catch (error) {
    console.error('Error checking new responses:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/investigations/:id/checkpoint - Handle checkpoint action
app.post('/api/investigations/:id/checkpoint', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { action, feedback, checkpoint } = req.body
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]
    const investigationDir = join(INVESTIGATIONS_DIR, String(id))

    // Save checkpoint action log
    const actionLog = { timestamp, checkpoint, action, feedback: feedback || null }
    const actionsPath = join(investigationDir, 'checkpoint-actions.json')
    let actions = []
    try { actions = JSON.parse(readFileSync(actionsPath, 'utf-8')) } catch {}
    actions.push(actionLog)
    writeFileSync(actionsPath, JSON.stringify(actions, null, 2))

    // === Version Control: Create snapshot before action ===
    const dbCtx = { queryAll, queryOne, run }
    try {
      const inv = queryOne('SELECT * FROM investigations WHERE id = ?', [id])
      if (inv) {
        createSnapshot(dbCtx, id, checkpoint, `Before: ${action} at ${checkpoint}`)
      }
    } catch (snapErr) {
      console.error(`[Checkpoint] Snapshot error: ${snapErr.message}`)
    }

    // === Conversation Item: Record human decision ===
    try {
      const inv = queryOne('SELECT current_run_number FROM investigations WHERE id = ?', [id])
      const runNum = inv?.current_run_number || 1
      const decisionContent = feedback
        ? `Action: ${action}\nFeedback: ${feedback}`
        : `Action: ${action}`
      const preview = feedback
        ? `${action}: ${feedback.substring(0, 80)}`
        : `${action}`
      run(
        `INSERT INTO conversation_items (investigation_id, run_number, type, phase, actor_name, actor_role, content, content_preview, metadata, created_at)
         VALUES (?, ?, 'human_decision', ?, 'TSE', 'tse', ?, ?, ?, ?)`,
        [id, runNum, checkpoint, decisionContent, preview, JSON.stringify({ checkpoint, action, feedback: feedback || null }), timestamp]
      )
    } catch (ciErr) {
      console.error(`[Checkpoint] Conversation item error: ${ciErr.message}`)
    }

    // Handle action
    if (action === 'abort') {
      run(`UPDATE investigations SET status = 'paused', updated_at = ? WHERE id = ?`, [timestamp, id])
      return res.json({ success: true, action, checkpoint })
    }

    if (['confirm', 'continue', 'approve'].includes(action)) {
      const checkpointOrder = [
        'checkpoint_1_post_classification',
        'checkpoint_2_post_context_gathering',
        'checkpoint_3_investigation_validation',
        'checkpoint_4_solution_check'
      ]
      const currentIdx = checkpointOrder.indexOf(checkpoint)

      if (currentIdx < checkpointOrder.length - 1) {
        const nextCheckpoint = checkpointOrder[currentIdx + 1]

        // Set status to running while phase executes
        run(`UPDATE investigations SET current_checkpoint = ?, status = 'running', updated_at = ? WHERE id = ?`,
          [nextCheckpoint, timestamp, id])

        // Respond immediately
        res.json({ success: true, action, checkpoint, next: nextCheckpoint })

        // Fire-and-forget: Trigger the next phase (pass runNumber)
        const currentInv = queryOne('SELECT current_run_number FROM investigations WHERE id = ?', [id])
        const runNum = currentInv?.current_run_number || 1
        if (checkpoint === 'checkpoint_1_post_classification') {
          console.log(`[Server] Checkpoint 1 confirmed → launching Phase 1 for #${id} (Run #${runNum})`)
          runPhase1(id, investigationDir, dbHelpers, runNum).catch(err => {
            console.error(`[Server] Phase 1 failed for #${id}:`, err.message)
          })
        } else if (checkpoint === 'checkpoint_2_post_context_gathering') {
          console.log(`[Server] Checkpoint 2 confirmed → launching Phase 2 for #${id} (Run #${runNum})`)
          runPhase2(id, investigationDir, dbHelpers, runNum).catch(err => {
            console.error(`[Server] Phase 2 failed for #${id}:`, err.message)
          })
        } else if (checkpoint === 'checkpoint_3_investigation_validation') {
          // After validation, move to checkpoint 4 (solution check) — no phase needed
          console.log(`[Server] Checkpoint 3 approved → moving to solution check for #${id}`)
          run(`UPDATE investigations SET current_checkpoint = 'checkpoint_4_solution_check', status = 'waiting', updated_at = ? WHERE id = ?`,
            [timestamp, id])
        } else if (checkpoint === 'checkpoint_4_solution_check') {
          // Final approval — mark complete
          console.log(`[Server] Checkpoint 4 approved → investigation #${id} complete`)
          run(`UPDATE investigations SET status = 'complete', resolved_at = ?, updated_at = ? WHERE id = ?`,
            [timestamp, timestamp, id])
        }

        return
      } else {
        // Already at last checkpoint — mark complete
        run(`UPDATE investigations SET status = 'complete', resolved_at = ?, updated_at = ? WHERE id = ?`,
          [timestamp, timestamp, id])
        return res.json({ success: true, action, checkpoint, status: 'complete' })
      }
    }

    // Other actions (reclassify, search_deeper, etc.) — keep as waiting
    run(`UPDATE investigations SET status = 'waiting', updated_at = ? WHERE id = ?`, [timestamp, id])
    res.json({ success: true, action, checkpoint })

  } catch (error) {
    console.error('Checkpoint error:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/investigations/:id - Update investigation
app.put('/api/investigations/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    dbHelpers.updateInvestigation(id, req.body)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/investigations/:id/retry - Retry failed phase
app.post('/api/investigations/:id/retry', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const inv = queryOne('SELECT * FROM investigations WHERE id = ?', [id])
    if (!inv) return res.status(404).json({ error: 'Investigation not found' })

    const investigationDir = join(INVESTIGATIONS_DIR, String(id))
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]

    // Reset status to running
    run(`UPDATE investigations SET status = 'running', updated_at = ? WHERE id = ?`, [timestamp, id])

    res.json({ success: true, message: `Retrying investigation #${id}` })

    // Re-run the appropriate phase based on current checkpoint
    const cp = inv.current_checkpoint
    if (cp === 'checkpoint_1_post_classification' || !inv.customer_name) {
      runPhase0(id, investigationDir, dbHelpers).catch(console.error)
    } else if (cp === 'checkpoint_2_post_context_gathering') {
      runPhase1(id, investigationDir, dbHelpers).catch(console.error)
    } else if (cp === 'checkpoint_3_investigation_validation') {
      runPhase2(id, investigationDir, dbHelpers).catch(console.error)
    }

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/settings - Load settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
    res.json(settings)
  } catch (error) {
    res.json({
      checkpoints: {
        checkpoint_1_post_classification: { enabled: true, mandatory: true },
        checkpoint_2_post_context_gathering: { enabled: true, mandatory: true },
        checkpoint_3_investigation_validation: { enabled: true, mandatory: true },
        checkpoint_4_solution_check: { enabled: true, mandatory: true }
      },
      concurrency: { max_active_investigations: 3 },
      agent_mode: { default: 'team' },
      code_review: { default_depth: 2 }
    })
  }
})

// PUT /api/settings - Save settings
app.put('/api/settings', (req, res) => {
  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(req.body, null, 2))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/health/claude - Check Claude CLI authentication (must be before /api/health)
app.get('/api/health/claude', (req, res) => {
  try {
    let responseSent = false

    const timeout = setTimeout(() => {
      if (!responseSent) {
        responseSent = true
        res.json({ authenticated: false, error: 'Health check timed out after 10s' })
      }
    }, 10000)

    const child = spawn('claude', ['-p', '--output-format', 'text'], {
      cwd: TRIAGE_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.on('error', (err) => {
      clearTimeout(timeout)
      if (!responseSent) {
        responseSent = true
        res.json({ authenticated: false, error: `Failed to spawn claude: ${err.message}` })
      }
    })

    child.stdout.on('data', (data) => { stdout += data.toString() })
    child.stderr.on('data', (data) => { stderr += data.toString() })

    child.on('close', (code) => {
      clearTimeout(timeout)

      if (responseSent) return

      const combinedOutput = stdout + stderr

      // Check for auth errors
      if (combinedOutput.includes('Not logged in') || combinedOutput.includes('Please run /login')) {
        responseSent = true
        return res.json({
          authenticated: false,
          message: 'Claude CLI is not authenticated. Run \'claude /login\' to authenticate.'
        })
      }

      // If exit code is 0, authentication is working
      if (code === 0) {
        responseSent = true
        return res.json({ authenticated: true, message: 'Claude CLI is authenticated and ready' })
      }

      // Other errors
      responseSent = true
      res.json({
        authenticated: false,
        error: `Claude exited with code ${code}`,
        message: 'Claude CLI check failed. Please verify your installation.'
      })
    })

    // Send a minimal test prompt
    child.stdin.write('Respond with OK')
    child.stdin.end()
  } catch (error) {
    res.json({ authenticated: false, error: error.message })
  }
})

// GET /api/health/mcp - Check all MCP servers (Pylon, Linear, Slack, Notion)
app.get('/api/health/mcp', async (req, res) => {
  const results = {
    claude: { status: 'unknown', message: '', server: 'Claude CLI' },
    pylon: { status: 'unknown', message: '', server: 'Pylon MCP' },
    linear: { status: 'unknown', message: '', server: 'Linear MCP' },
    slack: { status: 'unknown', message: '', server: 'Slack MCP' },
    notion: { status: 'unknown', message: '', server: 'Notion MCP' }
  }

  // Helper to test an MCP server with a simple query
  async function testMCPServer(serverName, testPrompt, successPattern, errorPatterns = []) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ status: 'error', message: `Timeout after 15s` })
      }, 15000)

      const child = spawn('claude', ['-p', '--output-format', 'text'], {
        cwd: TRIAGE_DIR,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''
      let responseSent = false

      child.on('error', (err) => {
        if (!responseSent) {
          clearTimeout(timeout)
          responseSent = true
          resolve({ status: 'error', message: `Failed to spawn: ${err.message}` })
        }
      })

      child.stdout.on('data', (data) => { stdout += data.toString() })
      child.stderr.on('data', (data) => { stderr += data.toString() })

      child.on('close', (code) => {
        if (responseSent) return
        clearTimeout(timeout)
        responseSent = true

        const output = stdout + stderr

        // Check for Claude auth errors first
        if (output.includes('Not logged in') || output.includes('Please run /login')) {
          return resolve({ status: 'error', message: 'Claude CLI not authenticated' })
        }

        // Check for specific error patterns
        for (const pattern of errorPatterns) {
          if (output.toLowerCase().includes(pattern.toLowerCase())) {
            return resolve({ status: 'error', message: pattern })
          }
        }

        // Check for MCP server not available
        if (output.includes('No MCP servers found') || output.includes('MCP server not found')) {
          return resolve({ status: 'error', message: 'MCP server not configured' })
        }

        // Check for authentication errors
        if (output.includes('authentication') || output.includes('unauthorized') || output.includes('401')) {
          return resolve({ status: 'error', message: 'Authentication failed' })
        }

        // Check for success
        if (code === 0 && successPattern && output.includes(successPattern)) {
          return resolve({ status: 'ok', message: 'Connected and authenticated' })
        }

        // If no specific errors but command succeeded, assume OK
        if (code === 0) {
          return resolve({ status: 'ok', message: 'Connected' })
        }

        // Generic failure
        resolve({ status: 'error', message: `Exit code ${code}` })
      })

      child.stdin.write(testPrompt)
      child.stdin.end()
    })
  }

  // Test each MCP server in parallel
  const tests = [
    // Test Pylon
    testMCPServer(
      'pylon',
      'Using Pylon MCP tools, call pylon_list_issues with limit 1. Just respond with "PYLON_OK" if it works.',
      'PYLON_OK',
      ['pylon', 'api key', 'credentials']
    ).then(result => { results.pylon = { ...results.pylon, ...result } }),

    // Test Linear
    testMCPServer(
      'linear',
      'Using Linear MCP tools, search for issues with query "test" and limit 1. Just respond with "LINEAR_OK" if it works.',
      'LINEAR_OK',
      ['linear', 'api key', 'credentials']
    ).then(result => { results.linear = { ...results.linear, ...result } }),

    // Test Slack
    testMCPServer(
      'slack',
      'Using Slack MCP tools, search for messages with query "test" and limit 1. Just respond with "SLACK_OK" if it works.',
      'SLACK_OK',
      ['slack', 'token', 'credentials']
    ).then(result => { results.slack = { ...results.slack, ...result } }),

    // Test Notion
    testMCPServer(
      'notion',
      'Using Notion MCP tools, search for pages with query "test". Just respond with "NOTION_OK" if it works.',
      'NOTION_OK',
      ['notion', 'api key', 'credentials']
    ).then(result => { results.notion = { ...results.notion, ...result } })
  ]

  // Wait for all tests to complete
  await Promise.all(tests)

  // Overall status
  const allOk = Object.values(results).every(r => r.status === 'ok')
  const anyError = Object.values(results).some(r => r.status === 'error')

  res.json({
    overall: allOk ? 'ok' : anyError ? 'error' : 'warning',
    timestamp: new Date().toISOString(),
    servers: results
  })
})

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: existsSync(DB_PATH) ? 'loaded' : 'new',
    investigations: queryAll('SELECT COUNT(*) as count FROM investigations')[0]?.count || 0,
    timestamp: new Date().toISOString()
  })
})

// GET /api/investigations/:id/debounce-status — check if a debounce timer is active
app.get('/api/investigations/:id/debounce-status', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { hasActiveTimer, getTimerStatus } = await import('./debounce-manager.js')
    if (hasActiveTimer(id)) {
      const status = getTimerStatus(id)
      res.json({ active: true, ...status })
    } else {
      res.json({ active: false })
    }
  } catch (error) {
    res.json({ active: false })
  }
})

// ============ ADMIN PORTAL STATS ============

// GET /api/admin/stats — aggregated stats for admin dashboard
app.get('/api/admin/stats', (req, res) => {
  try {
    reloadDB()
    const totalInvestigations = queryOne('SELECT COUNT(*) as count FROM investigations')?.count || 0
    const activeInvestigations = queryOne("SELECT COUNT(*) as count FROM investigations WHERE status IN ('running', 'waiting')")?.count || 0
    const completedInvestigations = queryOne("SELECT COUNT(*) as count FROM investigations WHERE status = 'complete'")?.count || 0

    // Feature requests stats (table may not exist yet)
    let featureRequestCount = 0
    let featureRequestsByStatus = {}
    let featureRequestsByPriority = {}
    try {
      ensureFeatureRequestsTable()
      featureRequestCount = queryOne('SELECT COUNT(*) as count FROM feature_requests')?.count || 0
      const byStatus = queryAll('SELECT status, COUNT(*) as count FROM feature_requests GROUP BY status')
      byStatus.forEach(row => { featureRequestsByStatus[row.status] = row.count })
      const byPriority = queryAll('SELECT priority, COUNT(*) as count FROM feature_requests GROUP BY priority')
      byPriority.forEach(row => { featureRequestsByPriority[row.priority] = row.count })
    } catch { /* table doesn't exist yet */ }

    // Investigation breakdown
    const byStatus = queryAll('SELECT status, COUNT(*) as count FROM investigations GROUP BY status')
    const investigationsByStatus = {}
    byStatus.forEach(row => { investigationsByStatus[row.status || 'unknown'] = row.count })

    // Recent activity
    const recentInvestigations = queryAll('SELECT id, customer_name, status, classification, priority, updated_at FROM investigations ORDER BY updated_at DESC LIMIT 5')

    res.json({
      investigations: {
        total: totalInvestigations,
        active: activeInvestigations,
        completed: completedInvestigations,
        byStatus: investigationsByStatus
      },
      featureRequests: {
        total: featureRequestCount,
        byStatus: featureRequestsByStatus,
        byPriority: featureRequestsByPriority
      },
      recentInvestigations
    })
  } catch (error) {
    console.error('Error loading admin stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============ FEATURE REQUESTS ============

// Create feature_requests table if needed
function ensureFeatureRequestsTable() {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS feature_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT DEFAULT 'P3',
        status TEXT DEFAULT 'new',
        category TEXT DEFAULT 'Other',
        requester TEXT DEFAULT 'TSE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (err) {
    // Table already exists
  }
}

// GET /api/feature-requests — list all feature requests
app.get('/api/feature-requests', (req, res) => {
  try {
    ensureFeatureRequestsTable()
    const requests = queryAll('SELECT * FROM feature_requests ORDER BY priority ASC, created_at DESC')
    res.json(requests)
  } catch (error) {
    console.error('Error loading feature requests:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/feature-requests/:id — get single feature request
app.get('/api/feature-requests/:id', (req, res) => {
  try {
    ensureFeatureRequestsTable()
    const request = queryOne('SELECT * FROM feature_requests WHERE id = ?', [parseInt(req.params.id)])
    if (!request) return res.status(404).json({ error: 'Feature request not found' })
    res.json(request)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/feature-requests — create new feature request
app.post('/api/feature-requests', (req, res) => {
  try {
    ensureFeatureRequestsTable()
    const { title, description, priority, status, category, requester } = req.body
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' })
    }
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]
    run(
      `INSERT INTO feature_requests (title, description, priority, status, category, requester, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        priority || 'P3',
        status || 'new',
        category || 'Other',
        requester || 'TSE',
        timestamp,
        timestamp
      ]
    )
    const newRequest = queryOne('SELECT * FROM feature_requests ORDER BY id DESC LIMIT 1')
    res.json(newRequest)
  } catch (error) {
    console.error('Error creating feature request:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/feature-requests/:id — update feature request
app.put('/api/feature-requests/:id', (req, res) => {
  try {
    ensureFeatureRequestsTable()
    const id = parseInt(req.params.id)
    const existing = queryOne('SELECT * FROM feature_requests WHERE id = ?', [id])
    if (!existing) return res.status(404).json({ error: 'Feature request not found' })

    const { title, description, priority, status, category, requester } = req.body
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]
    run(
      `UPDATE feature_requests SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        category = COALESCE(?, category),
        requester = COALESCE(?, requester),
        updated_at = ?
       WHERE id = ?`,
      [title, description, priority, status, category, requester, timestamp, id]
    )
    const updated = queryOne('SELECT * FROM feature_requests WHERE id = ?', [id])
    res.json(updated)
  } catch (error) {
    console.error('Error updating feature request:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/feature-requests/:id — delete feature request
app.delete('/api/feature-requests/:id', (req, res) => {
  try {
    ensureFeatureRequestsTable()
    const id = parseInt(req.params.id)
    const existing = queryOne('SELECT * FROM feature_requests WHERE id = ?', [id])
    if (!existing) return res.status(404).json({ error: 'Feature request not found' })

    run('DELETE FROM feature_requests WHERE id = ?', [id])
    res.json({ success: true, message: `Feature request #${id} deleted` })
  } catch (error) {
    console.error('Error deleting feature request:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============ BUG REPORTS (for Claude Code agent) ============

const BUG_REPORTS_DIR = join(TRIAGE_DIR, 'bug-reports')

// GET /api/bug-reports — list all bug reports
app.get('/api/bug-reports', (req, res) => {
  try {
    mkdirSync(BUG_REPORTS_DIR, { recursive: true })
    const files = readdirSync(BUG_REPORTS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
    const reports = files.map(f => {
      const content = readFileSync(join(BUG_REPORTS_DIR, f), 'utf-8')
      const titleMatch = content.match(/^# Bug Report: (.+)$/m)
      const severityMatch = content.match(/\*\*Severity:\*\* (.+)$/m)
      const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m)
      const dateMatch = content.match(/\*\*Filed:\*\* (.+)$/m)
      return {
        filename: f,
        title: titleMatch ? titleMatch[1] : f,
        severity: severityMatch ? severityMatch[1] : 'unknown',
        status: statusMatch ? statusMatch[1] : 'open',
        filed: dateMatch ? dateMatch[1] : '',
        hasScreenshot: existsSync(join(BUG_REPORTS_DIR, f.replace('.md', '.png')))
      }
    })
    res.json(reports)
  } catch (error) {
    console.error('Error listing bug reports:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/bug-reports — create a bug report as a markdown file for Claude Code
app.post('/api/bug-reports', (req, res) => {
  try {
    mkdirSync(BUG_REPORTS_DIR, { recursive: true })

    const { title, description, severity, category, investigationId, screenshot } = req.body
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' })
    }

    const now = new Date()
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
    const filename = `${ts}-${slug}`

    // Gather investigation context if an investigation ID was provided
    let investigationContext = ''
    if (investigationId) {
      const invDir = join(INVESTIGATIONS_DIR, String(investigationId))
      // Ticket data
      const tdPath = join(invDir, 'ticket-data.json')
      if (existsSync(tdPath)) {
        try {
          const td = JSON.parse(readFileSync(tdPath, 'utf-8'))
          investigationContext += `\n### Ticket Data\n`
          investigationContext += `- **Ticket ID:** ${td.ticket_id || investigationId}\n`
          investigationContext += `- **Title:** ${td.title || 'N/A'}\n`
          investigationContext += `- **Customer:** ${td.customer_name || 'N/A'}\n`
          investigationContext += `- **Classification:** ${td.classification || 'N/A'}\n`
          investigationContext += `- **Priority:** ${td.priority || 'N/A'}\n`
          investigationContext += `- **State:** ${td.state || 'N/A'}\n`
        } catch (e) {
          investigationContext += `\n_Could not parse ticket-data.json: ${e.message}_\n`
        }
      }
      // Activity log (last 20 entries)
      const actPath = join(invDir, 'activity-log.jsonl')
      if (existsSync(actPath)) {
        try {
          const lines = readFileSync(actPath, 'utf-8').trim().split('\n').slice(-20)
          investigationContext += `\n### Recent Activity Log (last ${lines.length} entries)\n\`\`\`\n`
          for (const line of lines) {
            try {
              const entry = JSON.parse(line)
              investigationContext += `[${entry.ts}] [${entry.phase}/${entry.type}] ${entry.message}\n`
            } catch { investigationContext += line + '\n' }
          }
          investigationContext += `\`\`\`\n`
        } catch (e) {
          investigationContext += `\n_Could not read activity log: ${e.message}_\n`
        }
      }
      // DB state
      try {
        const inv = queryOne('SELECT * FROM investigations WHERE id = ?', [parseInt(investigationId)])
        if (inv) {
          investigationContext += `\n### DB State\n`
          investigationContext += `- **Status:** ${inv.status}\n`
          investigationContext += `- **Phase:** ${inv.current_phase || 'N/A'}\n`
          investigationContext += `- **Agent Mode:** ${inv.agent_mode || 'N/A'}\n`
          investigationContext += `- **Created:** ${inv.created_at}\n`
          investigationContext += `- **Updated:** ${inv.updated_at}\n`
        }
      } catch (e) { /* ignore */ }
    }

    // Build the markdown report
    const report = `# Bug Report: ${title}

**Filed:** ${now.toISOString()}
**Severity:** ${severity || 'medium'}
**Category:** ${category || 'general'}
**Status:** open
${investigationId ? `**Investigation:** #${investigationId}` : ''}
${screenshot ? `**Screenshot:** ${filename}.png` : ''}

## Description

${description}
${investigationContext ? `\n## Investigation Context\n${investigationContext}` : ''}
## Instructions for Agent

Fix this bug in the Support Triage System codebase. Key files:
- \`ui/server.js\` — Express API server
- \`ui/investigation-runner.js\` — Phase execution and Claude CLI integration
- \`ui/src/components/\` — React UI components

After diagnosing, propose a fix and explain the root cause.
`

    // Write the markdown report
    writeFileSync(join(BUG_REPORTS_DIR, `${filename}.md`), report)

    // Write the screenshot if provided (base64 PNG)
    if (screenshot) {
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '')
      const imgBuffer = Buffer.from(base64Data, 'base64')
      writeFileSync(join(BUG_REPORTS_DIR, `${filename}.png`), imgBuffer)
    }

    console.log(`[BugReport] Created: ${filename}.md`)
    res.json({
      success: true,
      filename: `${filename}.md`,
      path: join(BUG_REPORTS_DIR, `${filename}.md`),
      message: `Bug report saved to bug-reports/${filename}.md`
    })
  } catch (error) {
    console.error('Error creating bug report:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============ AUTO-POLLING FOR NEW RESPONSES ============

const POLL_INTERVAL_MS = 60 * 1000 // 60 seconds
let autoPollingInterval = null

async function pollForNewResponses() {
  try {
    // Find all non-complete investigations
    const activeInvestigations = queryAll(
      "SELECT * FROM investigations WHERE status IN ('waiting', 'complete') AND id > 0"
    )

    if (activeInvestigations.length === 0) return

    const { checkForNewResponses: checkNew } = await import('./response-sync.js')
    const { syncTicketResponses: syncResponses } = await import('./response-sync.js')
    const { startDebounceTimer } = await import('./debounce-manager.js')

    for (const inv of activeInvestigations) {
      try {
        const investigationDir = join(INVESTIGATIONS_DIR, String(inv.id))
        const tdPath = join(investigationDir, 'ticket-data.json')

        if (!existsSync(tdPath)) continue

        let ticketBody = ''
        let customerName = inv.customer_name || 'Unknown'
        try {
          const td = JSON.parse(readFileSync(tdPath, 'utf-8'))
          ticketBody = td.body || td.description || ''
          customerName = td.customer_name || customerName
        } catch { continue }

        if (!ticketBody) continue

        const dbCtx = { queryAll, queryOne, run }
        const checkResult = checkNew(dbCtx, inv.id, ticketBody, customerName)

        if (checkResult.hasNew) {
          console.log(`[AutoPoll] New responses detected for investigation #${inv.id}`)
          const syncResult = syncResponses(dbCtx, inv.id, ticketBody, customerName)

          run('UPDATE investigations SET last_customer_message_at = ?, last_response_check_at = ? WHERE id = ?',
            [new Date().toISOString(), new Date().toISOString(), inv.id])

          startDebounceTimer(inv.id, dbCtx, dbHelpers, investigationDir)
          console.log(`[AutoPoll] Synced ${syncResult.newCount} new message(s) for #${inv.id}, debounce timer started`)
        }
      } catch (invErr) {
        console.error(`[AutoPoll] Error polling investigation #${inv.id}:`, invErr.message)
      }
    }
  } catch (error) {
    console.error('[AutoPoll] Polling error:', error.message)
  }
}

// ============ START SERVER ============

const PORT = 3001

initDB().then(() => {
  // Bootstrap: populate any investigations that have ticket-data.json but null fields
  bootstrapInvestigations()

  app.listen(PORT, () => {
    console.log(`\n  Support Triage API server running on http://localhost:${PORT}`)
    console.log(`  Database: ${DB_PATH}`)
    console.log(`  Investigations: ${INVESTIGATIONS_DIR}`)

    // Start auto-polling for new Pylon responses
    autoPollingInterval = setInterval(pollForNewResponses, POLL_INTERVAL_MS)
    console.log(`  Auto-polling for new responses every ${POLL_INTERVAL_MS / 1000}s\n`)
  })
}).catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})
