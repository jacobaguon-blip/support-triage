/**
 * debounce-manager.js
 * Manages 20-minute debounce timers for customer message batching.
 * When a customer sends multiple messages quickly, we wait for a quiet period
 * before deciding whether to trigger a new investigation run.
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DEBOUNCE_MINUTES = 20
const DEBOUNCE_MS = DEBOUNCE_MINUTES * 60 * 1000

// In-memory timer map: investigationId → { timerId, messagesSinceLastRun: [] }
const activeTimers = new Map()

/**
 * Start or reset a debounce timer for an investigation.
 * Called when a new customer message is detected.
 */
export function startDebounceTimer(investigationId, dbCtx, dbHelpers, investigationDir) {
  const existing = activeTimers.get(investigationId)

  if (existing) {
    // Reset the timer — customer sent another message
    clearTimeout(existing.timerId)
    console.log(`[Debounce] Timer reset for #${investigationId} (${DEBOUNCE_MINUTES}min)`)
  } else {
    console.log(`[Debounce] Timer started for #${investigationId} (${DEBOUNCE_MINUTES}min)`)
  }

  const entry = existing || { messagesSinceLastRun: [] }
  entry.startedAt = Date.now()
  entry.pendingMessages = (entry.pendingMessages || 0) + 1

  entry.timerId = setTimeout(() => {
    evaluateAndTrigger(investigationId, dbCtx, dbHelpers, investigationDir)
    activeTimers.delete(investigationId)
  }, DEBOUNCE_MS)

  activeTimers.set(investigationId, entry)
}

/**
 * Cancel a pending debounce timer (e.g., when investigation is hard-reset manually).
 */
export function cancelDebounceTimer(investigationId) {
  const existing = activeTimers.get(investigationId)
  if (existing) {
    clearTimeout(existing.timerId)
    activeTimers.delete(investigationId)
    console.log(`[Debounce] Timer cancelled for #${investigationId}`)
  }
}

/**
 * Check if a debounce timer is active for an investigation.
 */
export function hasActiveTimer(investigationId) {
  return activeTimers.has(investigationId)
}

/**
 * Get remaining time on debounce timer.
 */
export function getTimerStatus(investigationId) {
  const entry = activeTimers.get(investigationId)
  if (!entry) return { active: false }

  const elapsed = Date.now() - entry.startedAt
  const remainingMs = Math.max(0, DEBOUNCE_MS - elapsed)

  return {
    active: true,
    debounceMinutes: DEBOUNCE_MINUTES,
    remainingMs,
    pendingMessages: entry.pendingMessages || 0
  }
}

/**
 * After the quiet period expires, evaluate whether new messages contain
 * genuinely new information that warrants a new investigation run.
 */
async function evaluateAndTrigger(investigationId, dbCtx, dbHelpers, investigationDir) {
  try {
    console.log(`[Debounce] Evaluating new info for #${investigationId}...`)

    const inv = dbCtx.queryOne('SELECT * FROM investigations WHERE id = ?', [investigationId])
    if (!inv) {
      console.error(`[Debounce] Investigation #${investigationId} not found`)
      return
    }

    // Get new messages since the last run started
    const currentRunNumber = inv.current_run_number || 1
    const recentMessages = dbCtx.queryAll(
      `SELECT content FROM ticket_responses
       WHERE investigation_id = ? AND triggered_reanalysis = 0
       ORDER BY sequence_number ASC`,
      [investigationId]
    )

    if (recentMessages.length === 0) {
      console.log(`[Debounce] No untriaged messages for #${investigationId} — skipping`)
      return
    }

    // Combine new message content
    const newContent = recentMessages.map(m => m.content || '').join('\n').toLowerCase()

    // Load existing investigation context for comparison
    let existingContext = ''

    // Read ticket body
    const tdPath = join(investigationDir, 'ticket-data.json')
    if (existsSync(tdPath)) {
      try {
        const td = JSON.parse(readFileSync(tdPath, 'utf-8'))
        existingContext += (td.body || '') + '\n'
      } catch {}
    }

    // Read phase 1 findings
    const p1Path = join(investigationDir, 'phase1-findings.md')
    if (existsSync(p1Path)) {
      try {
        existingContext += readFileSync(p1Path, 'utf-8') + '\n'
      } catch {}
    }

    existingContext = existingContext.toLowerCase()

    // Evaluate: does the new content contain genuinely new information?
    const isNewInfo = evaluateNewInformation(newContent, existingContext)

    if (isNewInfo.isNew) {
      console.log(`[Debounce] New information detected for #${investigationId}: ${isNewInfo.reason}`)

      // Mark messages as having triggered reanalysis
      dbCtx.run(
        `UPDATE ticket_responses SET triggered_reanalysis = 1 WHERE investigation_id = ? AND triggered_reanalysis = 0`,
        [investigationId]
      )

      // Flag investigation for TSE decision — do NOT auto-create a new run
      const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
      dbCtx.run(
        `UPDATE investigations SET has_new_reply = 1, new_reply_summary = ?, updated_at = ? WHERE id = ?`,
        [isNewInfo.reason, ts, investigationId]
      )

      console.log(`[Debounce] Flagged #${investigationId} for TSE review (awaiting human decision)`)

    } else {
      console.log(`[Debounce] No new information for #${investigationId}: ${isNewInfo.reason}`)

      // Just add the messages as conversation items on the current run, no new investigation
      for (const msg of recentMessages) {
        dbCtx.run(
          `INSERT INTO conversation_items (investigation_id, run_number, type, actor_name, actor_role, content, content_preview, metadata, created_at)
           VALUES (?, ?, 'customer_message', ?, 'customer', ?, ?, ?, ?)`,
          [investigationId, currentRunNumber, inv.customer_name || 'Customer', msg.content,
           (msg.content || '').substring(0, 120),
           JSON.stringify({ source: 'pylon_followup', no_new_info: true }),
           new Date().toISOString()]
        )
      }

      // Mark messages as processed
      dbCtx.run(
        `UPDATE ticket_responses SET triggered_reanalysis = 1 WHERE investigation_id = ? AND triggered_reanalysis = 0`,
        [investigationId]
      )
    }
  } catch (err) {
    console.error(`[Debounce] Error evaluating #${investigationId}:`, err.message)
  }
}

/**
 * Heuristic evaluation of whether new customer messages contain genuinely new information
 * compared to what's already been investigated.
 *
 * Returns { isNew: boolean, reason: string }
 */
function evaluateNewInformation(newContent, existingContext) {
  if (!newContent || newContent.trim().length < 10) {
    return { isNew: false, reason: 'Message too short to contain new information' }
  }

  // Tokenize both strings
  const newTokens = tokenize(newContent)
  const existingTokens = new Set(tokenize(existingContext))

  if (newTokens.length === 0) {
    return { isNew: false, reason: 'No meaningful content in new messages' }
  }

  // Calculate overlap: what percentage of new tokens already exist in the context?
  let overlapCount = 0
  for (const token of newTokens) {
    if (existingTokens.has(token)) overlapCount++
  }

  const overlapRatio = overlapCount / newTokens.length

  // Check for specific new-information indicators
  const newInfoIndicators = [
    /error\s*(log|message|code|trace)/i,
    /stack\s*trace/i,
    /reproduce|reproduction|repro\s*steps/i,
    /screenshot|screen\s*shot|attached/i,
    /log\s*(file|output|dump)/i,
    /version\s*\d/i,
    /environment|env\s*:/i,
    /workaround|work\s*around/i,
    /actually|correction|update:/i,
    /additional\s*(info|context|detail)/i,
    /forgot\s+to\s+mention/i,
    /also\s+(wanted|need|should)/i,
  ]

  const hasIndicator = newInfoIndicators.some(pattern => pattern.test(newContent))

  // Noise indicators — messages that rarely contain new technical info
  const noiseIndicators = [
    /^(thanks|thank\s+you|ty|thx)\s*[.!]?\s*$/i,
    /^(any\s+update|update\s*\?|bump|following\s+up)/i,
    /^(ok|okay|sure|got\s+it|sounds\s+good)/i,
    /^(hi|hello|hey)\s*[,.]?\s*$/i,
  ]

  const isNoise = noiseIndicators.some(pattern => pattern.test(newContent.trim()))

  if (isNoise) {
    return { isNew: false, reason: 'Message appears to be acknowledgment/follow-up only' }
  }

  if (hasIndicator) {
    return { isNew: true, reason: 'Customer provided new technical details (error logs, reproduction steps, etc.)' }
  }

  // Use overlap threshold: if <70% overlap with existing context, it's new info
  if (overlapRatio < 0.7) {
    return { isNew: true, reason: `Customer provided substantially new content (${Math.round((1 - overlapRatio) * 100)}% new tokens)` }
  }

  return { isNew: false, reason: `Message content overlaps ${Math.round(overlapRatio * 100)}% with existing investigation` }
}

/**
 * Simple tokenizer — split into lowercase words, filter out stopwords and short tokens
 */
function tokenize(text) {
  if (!text) return []

  const stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'and', 'but', 'or', 'not', 'no',
    'if', 'then', 'than', 'too', 'very', 'just', 'so', 'it', 'its',
    'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
    'you', 'your', 'he', 'she', 'they', 'them', 'their', 'what', 'which',
    'who', 'whom', 'when', 'where', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
    'also', 'about', 'up', 'out', 'off', 'over', 'under', 'again', 'here',
    'there', 'once', 'hi', 'hello', 'hey', 'thanks', 'thank'
  ])

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.has(t))
}

export default {
  startDebounceTimer,
  cancelDebounceTimer,
  hasActiveTimer,
  getTimerStatus
}
