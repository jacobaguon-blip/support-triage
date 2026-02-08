import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INVESTIGATIONS_DIR = resolve(__dirname, '..', 'investigations')

/**
 * Create a snapshot of the current investigation state
 * @param {Object} dbCtx - Database context with queryAll, queryOne, run methods
 * @param {string} investigationId - ID of the investigation
 * @param {string} checkpoint - Current checkpoint identifier
 * @param {string} label - Human-readable label for this version
 * @param {number} runNumber - Run number this snapshot belongs to (default 1)
 * @returns {Object} { versionId, versionNumber }
 */
export function createSnapshot(dbCtx, investigationId, checkpoint, label, runNumber = 1) {
  try {
    // Get current investigation row
    const investigation = dbCtx.queryOne(
      'SELECT * FROM investigations WHERE id = ?',
      [investigationId]
    )

    if (!investigation) {
      throw new Error(`Investigation not found: ${investigationId}`)
    }

    // Read investigation files from filesystem
    const invDir = join(INVESTIGATIONS_DIR, String(investigationId))
    const snapshot_files = {}

    const filesToRead = [
      'ticket-data.json',
      'phase1-findings.md',
      'summary.md',
      'customer-response.md',
      'linear-draft.md',
      'checkpoint-actions.json'
    ]

    for (const filename of filesToRead) {
      const filepath = join(invDir, filename)
      try {
        if (!existsSync(filepath)) {
          snapshot_files[filename] = null
          continue
        }

        const content = readFileSync(filepath, 'utf-8')

        // Parse JSON files, keep markdown as strings
        if (filename.endsWith('.json')) {
          snapshot_files[filename] = JSON.parse(content)
        } else {
          snapshot_files[filename] = content
        }
      } catch (err) {
        console.error(`Error reading ${filename} for investigation ${investigationId}:`, err)
        snapshot_files[filename] = null
      }
    }

    // Get current max version_number for this investigation
    const maxVersionResult = dbCtx.queryOne(
      'SELECT MAX(version_number) as max_v FROM investigation_versions WHERE investigation_id = ?',
      [investigationId]
    )

    const newVersionNumber = (maxVersionResult?.max_v ?? 0) + 1

    // Compute diff_summary by comparing to previous version (if any)
    let diff_summary = ''
    if (maxVersionResult?.max_v) {
      const prevVersion = dbCtx.queryOne(
        'SELECT * FROM investigation_versions WHERE investigation_id = ? AND version_number = ?',
        [investigationId, maxVersionResult.max_v]
      )

      if (prevVersion) {
        diff_summary = computeDiff(prevVersion, investigation, snapshot_files)
      }
    } else {
      diff_summary = 'Initial snapshot'
    }

    // INSERT into investigation_versions
    const createdAt = new Date().toISOString()
    const snapshot_investigation = JSON.stringify({
      id: investigation.id,
      ticket_id: investigation.ticket_id,
      customer_name: investigation.customer_name,
      classification: investigation.classification,
      connector_name: investigation.connector_name,
      product_area: investigation.product_area,
      priority: investigation.priority,
      status: investigation.status,
      current_checkpoint: investigation.current_checkpoint,
      anchor_version_id: investigation.anchor_version_id
    })

    dbCtx.run(
      `INSERT INTO investigation_versions
       (investigation_id, version_number, label, checkpoint, snapshot_investigation, snapshot_files, diff_summary, created_by, created_at, run_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'system', ?, ?)`,
      [
        investigationId,
        newVersionNumber,
        label,
        checkpoint,
        snapshot_investigation,
        JSON.stringify(snapshot_files),
        diff_summary,
        createdAt,
        runNumber
      ]
    )

    // Get the ID of the just-inserted row
    const inserted = dbCtx.queryOne(
      'SELECT id FROM investigation_versions WHERE investigation_id = ? AND version_number = ?',
      [investigationId, newVersionNumber]
    )
    const versionId = inserted ? inserted.id : newVersionNumber

    // Update investigations table
    dbCtx.run(
      'UPDATE investigations SET current_version_id = ? WHERE id = ?',
      [versionId, investigationId]
    )

    return {
      versionId,
      versionNumber: newVersionNumber
    }
  } catch (err) {
    console.error(`Error creating snapshot for investigation ${investigationId}:`, err)
    throw err
  }
}

/**
 * Restore investigation to a previous version
 * @param {Object} dbCtx - Database context
 * @param {string} investigationId - ID of the investigation
 * @param {string} versionId - ID of the version to restore to
 * @param {string} mode - 'rollback' or 'refocus'
 * @returns {Object} { success: true, newVersionId, message }
 */
export function restoreToVersion(dbCtx, investigationId, versionId, mode) {
  try {
    if (mode !== 'rollback' && mode !== 'refocus') {
      throw new Error(`Invalid restore mode: ${mode}. Must be 'rollback' or 'refocus'`)
    }

    // Load the target version
    const targetVersion = dbCtx.queryOne(
      'SELECT * FROM investigation_versions WHERE id = ?',
      [versionId]
    )

    if (!targetVersion) {
      throw new Error(`Version not found: ${versionId}`)
    }

    // Create a NEW version snapshot first (non-destructive restore)
    const label = `Restored to v${targetVersion.version_number}`
    const currentInv = dbCtx.queryOne('SELECT current_run_number FROM investigations WHERE id = ?', [investigationId])
    const currentRunNum = currentInv?.current_run_number || targetVersion.run_number || 1
    const { versionId: newVersionId } = createSnapshot(
      dbCtx,
      investigationId,
      targetVersion.checkpoint,
      label,
      currentRunNum
    )

    // Parse the snapshot data
    const snapshotInvestigation = JSON.parse(targetVersion.snapshot_investigation)
    const snapshotFiles = JSON.parse(targetVersion.snapshot_files)
    const invDir = join(INVESTIGATIONS_DIR, String(investigationId))

    if (mode === 'rollback') {
      // Restore the investigation row to snapshot state
      const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
      dbCtx.run(
        `UPDATE investigations
         SET customer_name = ?, classification = ?, connector_name = ?,
             product_area = ?, priority = ?, status = 'waiting',
             current_checkpoint = ?, updated_at = ?
         WHERE id = ?`,
        [
          snapshotInvestigation.customer_name,
          snapshotInvestigation.classification,
          snapshotInvestigation.connector_name,
          snapshotInvestigation.product_area,
          snapshotInvestigation.priority,
          snapshotInvestigation.current_checkpoint,
          ts,
          investigationId
        ]
      )

      // Restore files from snapshot to filesystem
      for (const [filename, content] of Object.entries(snapshotFiles)) {
        if (content === null) continue
        try {
          const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
          writeFileSync(join(invDir, filename), fileContent)
        } catch (err) {
          console.error(`[VersionManager] Error restoring file ${filename}:`, err.message)
        }
      }

      // Insert a reset_marker conversation item
      dbCtx.run(
        `INSERT INTO conversation_items (investigation_id, run_number, type, actor_name, actor_role, content, content_preview, metadata, created_at)
         VALUES (?, ?, 'reset_marker', 'System', 'system', ?, ?, ?, ?)`,
        [
          investigationId,
          currentRunNum,
          `Rolled back to version ${targetVersion.version_number}: ${targetVersion.label || targetVersion.checkpoint}`,
          `Rolled back to v${targetVersion.version_number}`,
          JSON.stringify({ mode: 'rollback', targetVersionId: versionId, targetVersionNumber: targetVersion.version_number }),
          new Date().toISOString()
        ]
      )

      return { success: true, newVersionId, message: `Rolled back to version ${targetVersion.version_number}` }

    } else {
      // refocus: set anchor without changing investigation state
      dbCtx.run(
        'UPDATE investigations SET anchor_version_id = ? WHERE id = ?',
        [versionId, investigationId]
      )

      dbCtx.run(
        `INSERT INTO conversation_items (investigation_id, run_number, type, actor_name, actor_role, content, content_preview, metadata, created_at)
         VALUES (?, ?, 'reset_marker', 'System', 'system', ?, ?, ?, ?)`,
        [
          investigationId,
          currentRunNum,
          `Re-focused investigation to version ${targetVersion.version_number}: ${targetVersion.label || targetVersion.checkpoint}`,
          `Re-focused to v${targetVersion.version_number}`,
          JSON.stringify({ mode: 'refocus', targetVersionId: versionId, targetVersionNumber: targetVersion.version_number }),
          new Date().toISOString()
        ]
      )

      return { success: true, newVersionId, message: `Re-focused to version ${targetVersion.version_number}` }
    }
  } catch (err) {
    console.error(`[VersionManager] Error restoring investigation ${investigationId} to version ${versionId}:`, err)
    throw err
  }
}

/**
 * Get all versions for an investigation
 * @param {Object} dbCtx - Database context
 * @param {string} investigationId - ID of the investigation
 * @returns {Array} Array of version objects
 */
export function getVersions(dbCtx, investigationId) {
  try {
    const versions = dbCtx.queryAll(
      'SELECT * FROM investigation_versions WHERE investigation_id = ? ORDER BY version_number ASC',
      [investigationId]
    )

    return versions || []
  } catch (err) {
    console.error(`Error retrieving versions for investigation ${investigationId}:`, err)
    throw err
  }
}

/**
 * Get diff between two versions
 * @param {Object} dbCtx - Database context
 * @param {string} versionIdA - First version ID
 * @param {string} versionIdB - Second version ID
 * @returns {Object} { changedFields: [...], changedFiles: [...], summary: "..." }
 */
export function getVersionDiff(dbCtx, versionIdA, versionIdB) {
  try {
    const versionA = dbCtx.queryOne(
      'SELECT * FROM investigation_versions WHERE id = ?',
      [versionIdA]
    )

    const versionB = dbCtx.queryOne(
      'SELECT * FROM investigation_versions WHERE id = ?',
      [versionIdB]
    )

    if (!versionA || !versionB) {
      throw new Error('One or both versions not found')
    }

    const investigationA = JSON.parse(versionA.snapshot_investigation)
    const investigationB = JSON.parse(versionB.snapshot_investigation)
    const filesA = JSON.parse(versionA.snapshot_files)
    const filesB = JSON.parse(versionB.snapshot_files)

    // Compare investigation fields
    const changedFields = []
    const investigationKeys = [
      'customer_name',
      'classification',
      'connector_name',
      'product_area',
      'priority',
      'status',
      'current_checkpoint'
    ]

    for (const key of investigationKeys) {
      if (investigationA[key] !== investigationB[key]) {
        changedFields.push({
          field: key,
          oldValue: investigationA[key],
          newValue: investigationB[key]
        })
      }
    }

    // Compare files
    const changedFiles = []
    const allFiles = new Set([...Object.keys(filesA), ...Object.keys(filesB)])

    for (const filename of allFiles) {
      const contentA = filesA[filename]
      const contentB = filesB[filename]

      // Deep compare for objects, simple compare for strings
      const isEqual =
        typeof contentA === 'object' && typeof contentB === 'object'
          ? JSON.stringify(contentA) === JSON.stringify(contentB)
          : contentA === contentB

      if (!isEqual) {
        changedFiles.push(filename)
      }
    }

    const summary = `${changedFields.length} field(s) changed, ${changedFiles.length} file(s) changed`

    return {
      changedFields,
      changedFiles,
      summary
    }
  } catch (err) {
    console.error(`Error computing diff between versions ${versionIdA} and ${versionIdB}:`, err)
    throw err
  }
}

/**
 * Helper function to compute diff summary between versions
 * @private
 */
function computeDiff(prevVersion, currentInvestigation, currentFiles) {
  try {
    const prevInvestigation = JSON.parse(prevVersion.snapshot_investigation)
    const prevFiles = JSON.parse(prevVersion.snapshot_files)

    const changedFields = []
    const changedFiles = []

    // Compare investigation fields
    const fieldKeys = [
      'customer_name',
      'classification',
      'connector_name',
      'product_area',
      'priority',
      'status',
      'current_checkpoint'
    ]

    for (const key of fieldKeys) {
      if (prevInvestigation[key] !== currentInvestigation[key]) {
        changedFields.push(key)
      }
    }

    // Compare files
    for (const [filename, content] of Object.entries(currentFiles)) {
      const prevContent = prevFiles[filename]
      const isEqual =
        typeof content === 'object' && typeof prevContent === 'object'
          ? JSON.stringify(content) === JSON.stringify(prevContent)
          : content === prevContent

      if (!isEqual) {
        changedFiles.push(filename)
      }
    }

    return `Changed fields: [${changedFields.join(', ') || 'none'}]. Changed files: [${changedFiles.join(', ') || 'none'}]`
  } catch (err) {
    console.error('Error computing diff:', err)
    return 'Error computing diff'
  }
}

export default {
  createSnapshot,
  restoreToVersion,
  getVersions,
  getVersionDiff
}
