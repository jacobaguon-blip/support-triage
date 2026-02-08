/**
 * Seed script: Populate conversation_items and investigation_versions
 * for existing investigations that were created before the conversation system.
 * Run once: node seed-conversation-data.js
 */
import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRIAGE_DIR = resolve(__dirname, '..')
const DB_PATH = join(TRIAGE_DIR, 'triage.db')
const INVESTIGATIONS_DIR = join(TRIAGE_DIR, 'investigations')

async function main() {
  console.log('=== Seeding Conversation Data ===\n')

  if (!existsSync(DB_PATH)) {
    console.error('Database not found at', DB_PATH)
    process.exit(1)
  }

  const SQL = await initSqlJs()
  const buffer = readFileSync(DB_PATH)
  const db = new SQL.Database(buffer)

  // Helper functions
  function queryAll(sql, params = []) {
    const stmt = db.prepare(sql)
    if (params.length) stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    return results
  }

  function queryOne(sql, params = []) {
    const r = queryAll(sql, params)
    return r.length > 0 ? r[0] : null
  }

  function run(sql, params = []) {
    db.run(sql, params)
  }

  // Ensure tables exist
  run(`CREATE TABLE IF NOT EXISTS conversation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investigation_id INTEGER NOT NULL,
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
  )`)

  run(`CREATE TABLE IF NOT EXISTS investigation_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investigation_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    label TEXT,
    checkpoint TEXT,
    snapshot_investigation TEXT,
    snapshot_files TEXT,
    diff_summary TEXT,
    created_by TEXT DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  run(`CREATE TABLE IF NOT EXISTS ticket_responses (
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
  )`)

  // Migrate investigations table columns
  for (const col of ['current_version_id', 'anchor_version_id', 'last_response_check_at',
                      'current_run_number', 'last_customer_message_at', 'debounce_timer_id']) {
    try {
      const colType = col.includes('_at') ? 'DATETIME' : col === 'current_run_number' ? 'INTEGER DEFAULT 1' : col === 'debounce_timer_id' ? 'TEXT' : 'INTEGER'
      run(`ALTER TABLE investigations ADD COLUMN ${col} ${colType}`)
      console.log(`  Added column: ${col}`)
    } catch { /* column already exists */ }
  }

  // Add run_number to conversation_items and investigation_versions if missing
  for (const table of ['conversation_items', 'investigation_versions']) {
    try {
      run(`ALTER TABLE ${table} ADD COLUMN run_number INTEGER DEFAULT 1`)
      console.log(`  Added run_number to ${table}`)
    } catch { /* column already exists */ }
  }

  // Ensure investigation_runs table exists
  run(`CREATE TABLE IF NOT EXISTS investigation_runs (
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
  )`)

  // Get all investigations
  const investigations = queryAll('SELECT * FROM investigations')
  console.log(`Found ${investigations.length} investigation(s)\n`)

  for (const inv of investigations) {
    const id = inv.id
    const invDir = join(INVESTIGATIONS_DIR, String(id))
    console.log(`--- Investigation #${id} (${inv.customer_name || 'Unknown'}) ---`)

    // Check if conversation items already exist
    const existingItems = queryOne(
      'SELECT COUNT(*) as count FROM conversation_items WHERE investigation_id = ?', [id]
    )
    if (existingItems && existingItems.count > 0) {
      console.log(`  Already has ${existingItems.count} conversation items — skipping`)
      continue
    }

    // Load ticket-data.json
    let ticketData = null
    const tdPath = join(invDir, 'ticket-data.json')
    if (existsSync(tdPath)) {
      try {
        ticketData = JSON.parse(readFileSync(tdPath, 'utf-8'))
      } catch (e) {
        console.log(`  Failed to read ticket-data.json: ${e.message}`)
      }
    }

    if (!ticketData) {
      console.log('  No ticket-data.json — skipping')
      continue
    }

    const customerName = ticketData.customer_name || inv.customer_name || 'Unknown'
    const baseTime = inv.created_at || new Date().toISOString()
    let seqTime = new Date(baseTime)

    function nextTime() {
      seqTime = new Date(seqTime.getTime() + 5000) // 5 sec increments
      return seqTime.toISOString()
    }

    // === Seed customer message (original ticket) ===
    const bodyText = ticketData.body || ticketData.description || ''
    const title = ticketData.title || 'Support Request'

    const pylonUrl = ticketData.pylon_link || null
    run(
      `INSERT INTO conversation_items (investigation_id, run_number, type, phase, actor_name, actor_role, content, content_preview, metadata, created_at)
       VALUES (?, 1, 'customer_message', 'phase0', ?, 'customer', ?, ?, ?, ?)`,
      [id, customerName, `**${title}**\n\n${bodyText}`, title.substring(0, 120),
       JSON.stringify({ source: 'pylon', ticket_id: id, sources: [
         { type: 'pylon', id: String(id), label: `Pylon #${id}`, url: pylonUrl }
       ]}), nextTime()]
    )
    console.log(`  + Customer message: "${title.substring(0, 60)}..."`)

    // === Seed classification result ===
    const classification = inv.classification || ticketData.classification || 'unknown'
    const productArea = inv.product_area || ticketData.product_area || 'Unknown'
    const connectorName = inv.connector_name || ticketData.connector_name || null
    const priority = inv.priority || ticketData.priority || 'P3'

    run(
      `INSERT INTO conversation_items (investigation_id, run_number, type, phase, actor_name, actor_role, content, content_preview, metadata, created_at)
       VALUES (?, 1, 'system_result', 'phase0', 'System', 'system', ?, ?, ?, ?)`,
      [id,
       `## Classification Complete\n\n- **Customer:** ${customerName} [Source: Pylon #${id}]\n- **Classification:** ${classification.replace(/_/g, ' ')} [Source: Built-in classifier]\n- **Product Area:** ${productArea}\n${connectorName ? `- **Connector:** ${connectorName}\n` : ''}- **Priority:** ${priority}`,
       `Classified as ${classification.replace(/_/g, ' ')} — ${productArea}`,
       JSON.stringify({ classification, product_area: productArea, connector_name: connectorName, priority, sources: [
         { type: 'pylon', id: String(id), label: `Pylon #${id}`, url: pylonUrl },
         { type: 'classifier', id: 'local', label: 'Built-in classifier engine' }
       ]}),
       nextTime()]
    )
    console.log(`  + Classification: ${classification} / ${productArea}`)

    // === Seed checkpoint 1 decision (if they got past it) ===
    const checkpointOrder = [
      'checkpoint_1_post_classification',
      'checkpoint_2_post_context_gathering',
      'checkpoint_3_investigation_validation',
      'checkpoint_4_solution_check'
    ]
    const currentCpIdx = checkpointOrder.indexOf(inv.current_checkpoint)

    if (currentCpIdx >= 1 || inv.status === 'complete') {
      run(
        `INSERT INTO conversation_items (investigation_id, run_number, type, phase, actor_name, actor_role, content, content_preview, metadata, created_at)
         VALUES (?, 1, 'human_decision', 'checkpoint_1_post_classification', 'TSE', 'tse', 'Action: confirm', 'confirm', ?, ?)`,
        [id, JSON.stringify({ checkpoint: 'checkpoint_1_post_classification', action: 'confirm' }), nextTime()]
      )
      console.log('  + Decision: confirm classification')
    }

    // === Seed phase 1 findings ===
    const p1Path = join(invDir, 'phase1-findings.md')
    if (existsSync(p1Path)) {
      try {
        const findings = readFileSync(p1Path, 'utf-8')
        // Build local file sources for context gathering
        const localFileSources = []
        try {
          const dirFiles = ['ticket-data.json', 'triage-prompt.txt', 'checkpoint-actions.json']
          for (const f of dirFiles) {
            if (existsSync(join(invDir, f))) {
              localFileSources.push({ type: 'file', id: f, label: `Investigation file: ${f}` })
            }
          }
        } catch {}
        run(
          `INSERT INTO conversation_items (investigation_id, run_number, type, phase, actor_name, actor_role, content, content_preview, metadata, created_at)
           VALUES (?, 1, 'system_result', 'phase1', 'System', 'system', ?, ?, ?, ?)`,
          [id, findings, `Context gathered — ${findings.length} chars of findings`,
           JSON.stringify({ file: 'phase1-findings.md', findings_length: findings.length, sources: [
             { type: 'pylon', id: String(id), label: `Pylon #${id}` },
             ...localFileSources
           ]}),
           nextTime()]
        )
        console.log(`  + Phase 1 findings (${findings.length} chars)`)
      } catch {}
    }

    // === Seed checkpoint 2 decision ===
    if (currentCpIdx >= 2 || inv.status === 'complete') {
      run(
        `INSERT INTO conversation_items (investigation_id, run_number, type, phase, actor_name, actor_role, content, content_preview, metadata, created_at)
         VALUES (?, 1, 'human_decision', 'checkpoint_2_post_context_gathering', 'TSE', 'tse', 'Action: confirm', 'confirm', ?, ?)`,
        [id, JSON.stringify({ checkpoint: 'checkpoint_2_post_context_gathering', action: 'confirm' }), nextTime()]
      )
      console.log('  + Decision: confirm context gathering')
    }

    // === Seed phase 2 documents ===
    const phase2Sources = {
      'summary': [
        { type: 'file', id: 'ticket-data.json', label: 'Pylon ticket data' },
        { type: 'file', id: 'phase1-findings.md', label: 'Phase 1 findings' }
      ],
      'customer_response': [
        { type: 'file', id: 'ticket-data.json', label: 'Pylon ticket data' },
        { type: 'file', id: 'summary.md', label: 'Investigation summary' }
      ],
      'linear_draft': [
        { type: 'file', id: 'ticket-data.json', label: 'Pylon ticket data' },
        { type: 'file', id: 'phase1-findings.md', label: 'Phase 1 findings' },
        { type: 'file', id: 'summary.md', label: 'Investigation summary' }
      ]
    }

    for (const [fname, label, docType] of [
      ['summary.md', 'Investigation Summary', 'summary'],
      ['customer-response.md', 'Customer Response Draft', 'customer_response'],
      ['linear-draft.md', 'Linear Issue Draft', 'linear_draft']
    ]) {
      const fpath = join(invDir, fname)
      if (existsSync(fpath)) {
        try {
          const content = readFileSync(fpath, 'utf-8')
          run(
            `INSERT INTO conversation_items (investigation_id, run_number, type, phase, actor_name, actor_role, content, content_preview, metadata, created_at)
             VALUES (?, 1, 'system_result', 'phase2', 'System', 'system', ?, ?, ?, ?)`,
            [id, content, label, JSON.stringify({ file: fname, doc_type: docType, sources: phase2Sources[docType] || [] }), nextTime()]
          )
          console.log(`  + ${label} (${content.length} chars)`)
        } catch {}
      }
    }

    // === Seed version snapshot (v1) ===
    const existingVersions = queryOne(
      'SELECT COUNT(*) as count FROM investigation_versions WHERE investigation_id = ?', [id]
    )

    if (!existingVersions || existingVersions.count === 0) {
      // Read all files for snapshot
      const snapshotFiles = {}
      for (const fname of ['ticket-data.json', 'phase1-findings.md', 'summary.md', 'customer-response.md', 'linear-draft.md', 'checkpoint-actions.json']) {
        const fp = join(invDir, fname)
        try {
          if (existsSync(fp)) {
            const raw = readFileSync(fp, 'utf-8')
            snapshotFiles[fname] = fname.endsWith('.json') ? JSON.parse(raw) : raw
          } else {
            snapshotFiles[fname] = null
          }
        } catch {
          snapshotFiles[fname] = null
        }
      }

      const snapshotInvestigation = JSON.stringify({
        id: inv.id,
        ticket_id: inv.id,
        customer_name: inv.customer_name,
        classification: inv.classification,
        connector_name: inv.connector_name,
        product_area: inv.product_area,
        priority: inv.priority,
        status: inv.status,
        current_checkpoint: inv.current_checkpoint,
        anchor_version_id: null
      })

      run(
        `INSERT INTO investigation_versions (investigation_id, version_number, run_number, label, checkpoint, snapshot_investigation, snapshot_files, diff_summary, created_by, created_at)
         VALUES (?, 1, 1, 'Initial state', ?, ?, ?, 'Initial snapshot', 'seed', ?)`,
        [id, inv.current_checkpoint || 'checkpoint_1_post_classification',
         snapshotInvestigation, JSON.stringify(snapshotFiles), nextTime()]
      )

      // Update investigation with version ID
      const insertedVersion = queryOne(
        'SELECT id FROM investigation_versions WHERE investigation_id = ? AND version_number = 1', [id]
      )
      if (insertedVersion) {
        run('UPDATE investigations SET current_version_id = ? WHERE id = ?', [insertedVersion.id, id])
      }

      console.log('  + Version snapshot v1 created')
    }

    // === Seed investigation_runs record (Run #1) ===
    const existingRuns = queryOne(
      'SELECT COUNT(*) as count FROM investigation_runs WHERE investigation_id = ?', [id]
    )
    if (!existingRuns || existingRuns.count === 0) {
      run(
        `INSERT INTO investigation_runs (investigation_id, run_number, trigger_type, trigger_summary, status, current_checkpoint, created_at)
         VALUES (?, 1, 'manual', 'Initial investigation', ?, ?, ?)`,
        [id, inv.status === 'complete' ? 'complete' : inv.status,
         inv.current_checkpoint, inv.created_at || new Date().toISOString()]
      )
      // Set current_run_number on investigation
      run('UPDATE investigations SET current_run_number = 1 WHERE id = ?', [id])
      console.log('  + Investigation run #1 seeded')
    }

    console.log('')
  }

  // Save database
  const data = db.export()
  writeFileSync(DB_PATH, Buffer.from(data))
  console.log('=== Database saved ===')
  console.log(`Path: ${DB_PATH}`)

  // Verify
  const totalItems = queryOne('SELECT COUNT(*) as count FROM conversation_items')
  const totalVersions = queryOne('SELECT COUNT(*) as count FROM investigation_versions')
  const totalRuns = queryOne('SELECT COUNT(*) as count FROM investigation_runs')
  console.log(`\nTotal conversation items: ${totalItems?.count || 0}`)
  console.log(`Total version snapshots: ${totalVersions?.count || 0}`)
  console.log(`Total investigation runs: ${totalRuns?.count || 0}`)

  db.close()
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
