import { spawn } from 'child_process'
import { writeFileSync, readFileSync, existsSync, appendFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TRIAGE_DIR = resolve(__dirname, '..')
const INVESTIGATIONS_DIR = join(TRIAGE_DIR, 'investigations')
const CLAUDE_MD = join(TRIAGE_DIR, 'CLAUDE.md')

/**
 * Write an activity log entry (JSONL format)
 */
function writeActivity(investigationDir, phase, type, message) {
  const entry = {
    ts: new Date().toISOString(),
    phase,
    type,
    message
  }
  try {
    appendFileSync(
      join(investigationDir, 'activity-log.jsonl'),
      JSON.stringify(entry) + '\n'
    )
  } catch (err) {
    // Don't let activity logging break the pipeline
    console.error(`[Activity] Write error: ${err.message}`)
  }
}

/**
 * Write a conversation item to the DB via the dbHelpers context
 * @param {Object} dbCtx - Must have a `run` method for SQL inserts
 * @param {number} investigationId
 * @param {Object} item - { type, phase, actor_name, actor_role, content, content_preview, metadata }
 */
function writeConversationItem(dbCtx, investigationId, item, runNumber = 1) {
  if (!dbCtx || !dbCtx.run) return
  try {
    const now = new Date().toISOString()
    dbCtx.run(
      `INSERT INTO conversation_items (investigation_id, run_number, type, phase, actor_name, actor_role, content, content_preview, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        investigationId,
        runNumber,
        item.type || 'system_phase',
        item.phase || null,
        item.actor_name || 'System',
        item.actor_role || 'system',
        item.content || '',
        item.content_preview || (item.content || '').substring(0, 120),
        item.metadata ? JSON.stringify(item.metadata) : null,
        now
      ]
    )
  } catch (err) {
    console.error(`[ConversationItem] Write error: ${err.message}`)
  }
}

// Known connector names
const KNOWN_CONNECTORS = [
  'okta', 'azure', 'azure-ad', 'salesforce', 'google-workspace', 'aws',
  'jira', 'github', 'slack', 'servicenow', 'zendesk', 'crowdstrike',
  'duo', 'jumpcloud', 'bamboohr', 'workday', 'pagerduty', 'datadog',
  'onelogin', 'pingidentity', 'cyberark', 'google workspace'
]

const UI_PLATFORM_KEYWORDS = [
  'dashboard', 'workflow', 'permissions', 'policy', 'blank', 'display',
  'page', 'screen', 'ui', 'interface', 'review', 'portal'
]

const FEATURE_REQUEST_KEYWORDS = [
  'can we', 'is it possible', 'would like', 'would love',
  'trying to setup', 'trying to set up', 'feature request',
  'ability to', 'request a feature', 'like to have', 'like there to be'
]

/**
 * Classify ticket based on Pylon fields + NLP fallback
 */
export function classifyTicket(requestType, productArea, bodyText) {
  const rt = (requestType || '').toLowerCase()
  const pa = (productArea || '').toLowerCase()
  const body = (bodyText || '').toLowerCase()

  // Step 1: Check Request Type
  if (rt.includes('product request')) return 'feature_request'
  if (rt.includes('documentation')) return 'documentation'
  if (rt.includes('general question')) return 'general_question'
  if (['meeting scheduling', 'account management', 'product incident'].some(s => rt.includes(s))) return 'skip'

  // Step 2: Defect/Troubleshooting → check Product Area
  if (rt.includes('defect') || rt.includes('troubleshooting')) {
    if (pa.includes('connector')) return 'connector_bug'
    const productBugAreas = [
      'platform', 'ui', 'access profile', 'access request', 'access review',
      'api', 'terraform', 'automation', 'notification', 'polic', 'rbac', 'thomas'
    ]
    if (productBugAreas.some(a => pa.includes(a))) return 'product_bug'
  }

  // NLP Fallback for Other/empty fields
  if (FEATURE_REQUEST_KEYWORDS.some(kw => body.includes(kw))) return 'feature_request'
  if (KNOWN_CONNECTORS.some(c => body.includes(c))) {
    if (FEATURE_REQUEST_KEYWORDS.some(kw => body.includes(kw))) return 'feature_request'
    return 'connector_bug'
  }
  if (UI_PLATFORM_KEYWORDS.some(kw => body.includes(kw))) return 'product_bug'

  return 'product_bug'
}

/**
 * Extract connector name from text
 */
export function extractConnectorName(text) {
  if (!text) return null
  const lower = text.toLowerCase()
  for (const c of KNOWN_CONNECTORS) {
    if (lower.includes(c)) return c.replace('google workspace', 'google-workspace')
  }
  return null
}

/**
 * Suggest priority
 */
export function suggestPriority(classification, bodyText, tags = []) {
  const text = ((bodyText || '') + ' ' + (tags || []).join(' ')).toLowerCase()
  if (['urgent', 'critical', 'down', 'outage', 'blocking'].some(kw => text.includes(kw))) return 'P1'
  if (['regression', 'broken', 'error', 'failing', 'crash'].some(kw => text.includes(kw))) return 'P2'
  if (classification === 'feature_request') return 'P4'
  return 'P3'
}

/**
 * Infer product area from context
 */
export function inferProductArea(classification, bodyText, connectorName) {
  if (connectorName) return 'Connectors'
  const body = (bodyText || '').toLowerCase()
  if (body.includes('policy') || body.includes('review policy')) return 'Policies'
  if (body.includes('access request') || body.includes('request flow')) return 'Access Requests'
  if (body.includes('access review')) return 'Access Reviews'
  if (body.includes('access profile')) return 'Access Profiles'
  if (body.includes('automation') || body.includes('workflow')) return 'Automations'
  if (body.includes('notification')) return 'Notifications'
  if (body.includes('api') || body.includes('terraform') || body.includes('sdk')) return 'API / Terraform'
  if (body.includes('rbac') || body.includes('role')) return 'RBAC'
  if (body.includes('thomas') || body.includes('ai agent')) return 'Thomas - AI Agent'
  if (classification === 'product_bug') return 'Platform / UI'
  return 'Other'
}

/**
 * Run claude -p with a prompt, streaming output to activity log
 * @param {string} prompt
 * @param {string} cwd
 * @param {object} opts - { investigationDir, phase } for activity logging
 */
function runClaude(prompt, cwd, opts = {}) {
  return new Promise((resolve, reject) => {
    const { investigationDir, phase } = opts
    let child
    const timeoutMs = 300000 // 5 minutes — MCP tool calls can take a while
    const timeout = setTimeout(() => {
      if (child) child.kill()
      if (investigationDir && phase) writeActivity(investigationDir, phase, 'error', `Claude command timed out after ${timeoutMs/1000}s`)
      reject(new Error(`Claude command timed out after ${timeoutMs/1000}s`))
    }, timeoutMs)

    if (investigationDir && phase) {
      writeActivity(investigationDir, phase, 'command', `claude -p --output-format text`)
    }

    try {
      child = spawn('claude', ['-p', '--output-format', 'text'], {
        cwd: cwd || TRIAGE_DIR,
        stdio: ['pipe', 'pipe', 'pipe']
      })
    } catch (err) {
      clearTimeout(timeout)
      if (investigationDir && phase) writeActivity(investigationDir, phase, 'error', `Failed to spawn claude: ${err.message}`)
      reject(new Error(`Failed to spawn claude: ${err.message}`))
      return
    }

    let stdout = ''
    let stderr = ''
    let lineBuffer = ''

    child.on('error', (err) => {
      clearTimeout(timeout)
      if (investigationDir && phase) writeActivity(investigationDir, phase, 'error', `Claude spawn error: ${err.message}`)
      reject(new Error(`Claude spawn error: ${err.message}`))
    })

    child.stdout.on('data', (data) => {
      const chunk = data.toString()
      stdout += chunk

      // Stream output lines to activity log
      if (investigationDir && phase) {
        lineBuffer += chunk
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop() // Keep incomplete line in buffer
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed) {
            writeActivity(investigationDir, phase, 'output', trimmed)
          }
        }
      }
    })

    child.stderr.on('data', (data) => { stderr += data.toString() })

    child.on('close', (code) => {
      clearTimeout(timeout)
      // Flush remaining buffer
      if (investigationDir && phase && lineBuffer.trim()) {
        writeActivity(investigationDir, phase, 'output', lineBuffer.trim())
      }
      if (code !== 0) {
        // Check for authentication errors
        const combinedOutput = stdout + stderr
        if (combinedOutput.includes('Not logged in') || combinedOutput.includes('Please run /login')) {
          const authError = new Error('CLAUDE_AUTH_ERROR: Claude CLI is not authenticated. Run \'claude /login\' in your terminal to re-authenticate.')
          if (investigationDir && phase) {
            writeActivity(investigationDir, phase, 'error', 'Claude CLI authentication expired. Run \'claude /login\' in your terminal, then reset this investigation.')
          }
          reject(authError)
        } else {
          if (investigationDir && phase) writeActivity(investigationDir, phase, 'error', `Claude exited with code ${code}`)
          reject(new Error(`Claude exited with code ${code}: ${stderr.slice(0, 500)}`))
        }
      } else {
        resolve(stdout)
      }
    })

    child.stdin.write(prompt)
    child.stdin.end()
  })
}

/**
 * Phase 0: Fetch Pylon ticket, classify, populate DB
 */
export async function runPhase0(ticketId, investigationDir, dbHelpers, runNumber = 1) {
  const startTime = Date.now()
  console.log(`[Phase0] Starting for ticket #${ticketId}`)
  writeActivity(investigationDir, 'phase0', 'start', `Starting Phase 0: Classification for ticket #${ticketId}`)

  try {
    let ticketData = null
    const ticketDataPath = join(investigationDir, 'ticket-data.json')

    // Strategy 1: Use existing ticket-data.json
    if (existsSync(ticketDataPath)) {
      try {
        ticketData = JSON.parse(readFileSync(ticketDataPath, 'utf-8'))
        console.log(`[Phase0] Loaded existing ticket-data.json`)
        writeActivity(investigationDir, 'phase0', 'info', 'Loaded existing ticket-data.json from disk')
      } catch (e) {
        console.log(`[Phase0] Failed to parse ticket-data.json: ${e.message}`)
        writeActivity(investigationDir, 'phase0', 'error', `Failed to parse ticket-data.json: ${e.message}`)
      }
    }

    // Strategy 2: Fetch via claude -p
    if (!ticketData) {
      try {
        console.log(`[Phase0] Fetching from Pylon via claude...`)
        writeActivity(investigationDir, 'phase0', 'tool_call', `pylon_get_issue(id: "${ticketId}")`)
        writeActivity(investigationDir, 'phase0', 'info', 'Fetching ticket data from Pylon via Claude agent...')
        const prompt = `You are a data extraction tool. Using the Pylon MCP tools:
1. Call pylon_get_issue with id "${ticketId}"
2. Call pylon_get_account with the account_id from step 1

Return ONLY a raw JSON object (no markdown, no code blocks):
{"ticket_id":${ticketId},"pylon_id":"<id>","title":"<title>","customer_name":"<account name>","account_id":"<acct id>","pylon_link":"<link>","source":"<source>","state":"<state>","created_at":"<created>","body":"<body text, max 500 chars>","tags":[],"fetched_at":"${new Date().toISOString()}"}`

        const output = await runClaude(prompt, TRIAGE_DIR, { investigationDir, phase: 'phase0' })
        const jsonMatch = output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          ticketData = JSON.parse(jsonMatch[0])
          console.log(`[Phase0] Fetched from Pylon`)
          writeActivity(investigationDir, 'phase0', 'result', `Ticket fetched: "${ticketData.title}" — ${ticketData.customer_name}`)
        }
      } catch (err) {
        console.log(`[Phase0] Claude failed: ${err.message}`)
        writeActivity(investigationDir, 'phase0', 'error', `Claude agent failed: ${err.message}`)
      }
    }

    if (!ticketData) {
      throw new Error('No ticket data available — place ticket-data.json or ensure claude CLI is in PATH')
    }

    // Classify
    writeActivity(investigationDir, 'phase0', 'info', 'Running classification engine...')
    const bodyText = ticketData.body || ticketData.description || ''
    const fullText = (ticketData.title || '') + ' ' + bodyText

    const classification = ticketData.classification ||
      classifyTicket(ticketData.request_type || '', ticketData.product_area || '', fullText)
    const connectorName = ticketData.connector_name || extractConnectorName(fullText)
    const productArea = ticketData.product_area ||
      inferProductArea(classification, fullText, connectorName)
    const priority = ticketData.priority || suggestPriority(classification, fullText, ticketData.tags)
    const suggestedPriority = ticketData.suggested_priority || priority
    const customerName = ticketData.customer_name || 'Unknown'

    console.log(`[Phase0] Customer: ${customerName}, Classification: ${classification}, Area: ${productArea}`)
    writeActivity(investigationDir, 'phase0', 'result', `Customer: ${customerName}`)
    writeActivity(investigationDir, 'phase0', 'result', `Classification: ${classification.replace(/_/g, ' ')}`)
    writeActivity(investigationDir, 'phase0', 'result', `Product Area: ${productArea}`)
    if (connectorName) writeActivity(investigationDir, 'phase0', 'result', `Connector: ${connectorName}`)
    writeActivity(investigationDir, 'phase0', 'result', `Priority: ${priority}${suggestedPriority !== priority ? ` (suggested: ${suggestedPriority})` : ''}`)

    // Enrich and save
    const enriched = { ...ticketData, classification, connector_name: connectorName, product_area: productArea, priority, suggested_priority: suggestedPriority, customer_name: customerName }
    writeFileSync(ticketDataPath, JSON.stringify(enriched, null, 2))
    writeActivity(investigationDir, 'phase0', 'info', 'Wrote enriched ticket-data.json')

    // Update DB
    const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
    dbHelpers.updateInvestigation(ticketId, {
      customer_name: customerName,
      classification,
      connector_name: connectorName,
      product_area: productArea,
      priority,
      suggested_priority: suggestedPriority,
      status: 'waiting',
      current_checkpoint: 'checkpoint_1_post_classification',
      snapshot: JSON.stringify(enriched),
      updated_at: ts
    })

    // Write conversation items for Phase 0
    writeConversationItem(dbHelpers, ticketId, {
      type: 'customer_message',
      phase: 'phase0',
      actor_name: customerName,
      actor_role: 'customer',
      content: `**${ticketData.title || 'Support Request'}**\n\n${bodyText}`,
      content_preview: (ticketData.title || 'Support Request').substring(0, 120),
      metadata: {
        source: 'pylon',
        ticket_id: ticketId,
        sources: [
          { type: 'pylon', id: String(ticketId), label: `Pylon #${ticketId}`, url: ticketData.pylon_link || null }
        ]
      }
    }, runNumber)

    writeConversationItem(dbHelpers, ticketId, {
      type: 'system_result',
      phase: 'phase0',
      actor_name: 'System',
      actor_role: 'system',
      content: `## Classification Complete\n\n- **Customer:** ${customerName}\n- **Classification:** ${classification.replace(/_/g, ' ')}\n- **Product Area:** ${productArea}\n${connectorName ? `- **Connector:** ${connectorName}\n` : ''}- **Priority:** ${priority}`,
      content_preview: `Classified as ${classification.replace(/_/g, ' ')} — ${productArea}`,
      metadata: {
        classification,
        product_area: productArea,
        connector_name: connectorName,
        priority,
        sources: [
          { type: 'pylon', id: String(ticketId), label: `Pylon #${ticketId}`, url: ticketData.pylon_link || null },
          { type: 'classifier', id: 'local', label: 'Built-in classifier engine' }
        ]
      }
    }, runNumber)

    writeMetrics(investigationDir, { phase0_duration_ms: Date.now() - startTime })
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[Phase0] Complete in ${Date.now() - startTime}ms`)
    writeActivity(investigationDir, 'phase0', 'complete', `Phase 0 complete (${elapsed}s) — awaiting classification review`)

  } catch (err) {
    console.error(`[Phase0] ERROR: ${err.message}`)

    // Check if this is an auth error
    const isAuthError = err.message && err.message.includes('CLAUDE_AUTH_ERROR')

    if (isAuthError) {
      // Auth error already logged in runClaude, just update DB status
      writeActivity(investigationDir, 'phase0', 'error', 'Investigation paused — authentication required')
    } else {
      writeActivity(investigationDir, 'phase0', 'error', `Phase 0 failed: ${err.message}`)
    }

    try {
      const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
      const errorMessage = isAuthError
        ? 'Claude CLI authentication expired. Run \'claude /login\' in your terminal, then reset this investigation.'
        : err.message

      dbHelpers.updateInvestigation(ticketId, {
        status: 'error',
        updated_at: ts,
        snapshot: JSON.stringify({ error: errorMessage, error_type: isAuthError ? 'auth' : 'general' })
      })
    } catch {}
  }
}

/**
 * Phase 1: Context gathering
 */
export async function runPhase1(ticketId, investigationDir, dbHelpers, runNumber = 1) {
  const startTime = Date.now()
  console.log(`[Phase1] Starting for ticket #${ticketId}`)
  writeActivity(investigationDir, 'phase1', 'start', `Starting Phase 1: Context Gathering for ticket #${ticketId}`)

  try {
    const tdPath = join(investigationDir, 'ticket-data.json')
    if (!existsSync(tdPath)) throw new Error('ticket-data.json not found')
    const td = JSON.parse(readFileSync(tdPath, 'utf-8'))

    writeActivity(investigationDir, 'phase1', 'info', `Loaded ticket: "${td.title}" (${td.classification})`)

    // === Read local investigation folder for existing context ===
    let localContext = ''
    const localSources = []
    try {
      const dirFiles = readdirSync(investigationDir)
      for (const f of dirFiles) {
        if (f === 'activity-log.jsonl' || f === 'metrics.json') continue
        const fpath = join(investigationDir, f)
        try {
          const stat = statSync(fpath)
          if (!stat.isFile() || stat.size > 50000) continue
          const content = readFileSync(fpath, 'utf-8')
          localContext += `\n--- ${f} ---\n${content}\n`
          localSources.push({ type: 'file', id: f, label: `Investigation file: ${f}`, path: fpath })
        } catch {}
      }
    } catch (e) {
      writeActivity(investigationDir, 'phase1', 'warn', `Could not read investigation folder: ${e.message}`)
    }

    if (localContext) {
      writeActivity(investigationDir, 'phase1', 'info', `Loaded ${localSources.length} files from investigation folder as local context`)
    }

    writeActivity(investigationDir, 'phase1', 'tool_call', `Searching Linear for issues related to: "${td.title}"`)
    writeActivity(investigationDir, 'phase1', 'tool_call', `Searching Slack for discussions about ${td.customer_name}`)

    const prompt = `You are a ConductorOne support investigator. Research this ticket using available MCP tools.

TICKET #${ticketId}
Customer: ${td.customer_name}
Title: ${td.title}
Classification: ${td.classification}
Product Area: ${td.product_area}
${td.connector_name ? `Connector: ${td.connector_name}` : ''}
Body: ${td.body}

${localContext ? `LOCAL INVESTIGATION FILES (from working folder):\n${localContext}\n` : ''}

RESEARCH INSTRUCTIONS — follow these steps in order:

Step 1: Search Pylon for related issues
- Use pylon_search_issues to find similar tickets. Try filtering by tags or account_id if available.
- If a filter returns an error, try a different filter or use pylon_list_issues with a recent time range.
- Limit: max 3 tool calls for Pylon.

Step 2: Search Slack for context
- Use slack_list_channels (limit 5) to find relevant channels.
- Then use slack_get_channel_history on at most 2 promising channels (limit 10 messages each).
- Do NOT iterate through all channels. Pick the most relevant ones by name.
- Limit: max 4 tool calls for Slack.

Step 3: Summarize local investigation files
- Review the local files provided above (if any) and summarize key findings.

CONSTRAINTS:
- Make at most 10 MCP tool calls total. Do not loop or retry failed calls.
- If a tool is unavailable or returns an error, note it and move on immediately.
- Do not search for messages by iterating through every channel.
- Finish within a reasonable time — prefer breadth over depth.

CITATION FORMAT: For EVERY finding, cite the source:
  [Source: Pylon #1234] or [Source: Slack #channel-name] or [Source: local/filename.ext]

Write structured markdown findings:
## Pylon Issues Found
(List related tickets with ID, title, status, relevance. Cite [Source: Pylon #ID] for each.)

## Slack Discussions
(Summarize relevant threads from at most 2 channels. Cite [Source: Slack #channel-name] for each.)

## Local Investigation Context
(Summarize what was found in the working folder files. Cite [Source: local/filename] for each.)

## Related Context
(Cross-reference across all sources.)

## Gaps / Unknowns
(What is still missing? What tools were unavailable?)`

    console.log(`[Phase1] Running context gathering via claude...`)
    writeActivity(investigationDir, 'phase1', 'command', 'Running Claude agent with Linear + Slack MCP tools...')
    const findings = await runClaude(prompt, investigationDir, { investigationDir, phase: 'phase1' })
    writeFileSync(join(investigationDir, 'phase1-findings.md'), findings)
    writeActivity(investigationDir, 'phase1', 'result', `Context gathered — wrote phase1-findings.md (${findings.length} chars)`)

    // Write conversation item for Phase 1 results
    // Parse source citations from findings text
    const sourceCitations = []
    const linearMatches = [...findings.matchAll(/\[Source:\s*Linear\s+([A-Z]+-\d+)\]/gi)]
    for (const m of linearMatches) {
      if (!sourceCitations.find(s => s.id === m[1])) {
        sourceCitations.push({ type: 'linear', id: m[1], label: `Linear ${m[1]}` })
      }
    }
    const pylonMatches = [...findings.matchAll(/\[Source:\s*Pylon\s+#?(\d+)\]/gi)]
    for (const m of pylonMatches) {
      if (!sourceCitations.find(s => s.id === m[1])) {
        sourceCitations.push({ type: 'pylon', id: m[1], label: `Pylon #${m[1]}` })
      }
    }
    const slackMatches = [...findings.matchAll(/\[Source:\s*Slack\s+#([^\],]+?)(?:,\s*[^\]]+)?\]/gi)]
    for (const m of slackMatches) {
      if (!sourceCitations.find(s => s.id === m[1])) {
        sourceCitations.push({ type: 'slack', id: m[1], label: `Slack #${m[1]}` })
      }
    }
    const localMatches = [...findings.matchAll(/\[Source:\s*local\/([^\]]+)\]/gi)]
    for (const m of localMatches) {
      if (!sourceCitations.find(s => s.id === m[1])) {
        sourceCitations.push({ type: 'file', id: m[1], label: `Local: ${m[1]}` })
      }
    }
    // Add the local investigation folder sources
    sourceCitations.push(...localSources)

    writeConversationItem(dbHelpers, ticketId, {
      type: 'system_result',
      phase: 'phase1',
      actor_name: 'System',
      actor_role: 'system',
      content: findings,
      content_preview: `Context gathered — ${findings.length} chars of findings`,
      metadata: { file: 'phase1-findings.md', findings_length: findings.length, sources: sourceCitations }
    }, runNumber)

    const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
    dbHelpers.updateInvestigation(ticketId, {
      status: 'waiting',
      current_checkpoint: 'checkpoint_2_post_context_gathering',
      updated_at: ts
    })

    writeMetrics(investigationDir, { phase1_duration_ms: Date.now() - startTime })
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[Phase1] Complete in ${Date.now() - startTime}ms`)
    writeActivity(investigationDir, 'phase1', 'complete', `Phase 1 complete (${elapsed}s) — awaiting context review`)
  } catch (err) {
    console.error(`[Phase1] ERROR: ${err.message}`)
    writeActivity(investigationDir, 'phase1', 'error', `Phase 1 failed: ${err.message}`)
    try {
      const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
      dbHelpers.updateInvestigation(ticketId, { status: 'error', updated_at: ts })
    } catch {}
  }
}

/**
 * Phase 2: Document synthesis
 */
export async function runPhase2(ticketId, investigationDir, dbHelpers, runNumber = 1) {
  const startTime = Date.now()
  console.log(`[Phase2] Starting for ticket #${ticketId}`)
  writeActivity(investigationDir, 'phase2', 'start', `Starting Phase 2: Document Synthesis for ticket #${ticketId}`)

  try {
    const tdPath = join(investigationDir, 'ticket-data.json')
    const td = JSON.parse(readFileSync(tdPath, 'utf-8'))

    let findings = ''
    const fp = join(investigationDir, 'phase1-findings.md')
    if (existsSync(fp)) {
      findings = readFileSync(fp, 'utf-8')
      writeActivity(investigationDir, 'phase2', 'info', `Loaded phase1-findings.md (${findings.length} chars)`)
    } else {
      writeActivity(investigationDir, 'phase2', 'info', 'No phase 1 findings available — synthesizing from ticket data only')
    }

    const isBug = ['connector_bug', 'product_bug'].includes(td.classification)
    const docs = ['summary.md', 'customer-response.md']
    if (isBug) docs.push('linear-draft.md')
    writeActivity(investigationDir, 'phase2', 'info', `Generating ${docs.length} documents: ${docs.join(', ')}`)

    const prompt = `Generate investigation documents for ConductorOne support ticket #${ticketId}.

TICKET:
Customer: ${td.customer_name} | Title: ${td.title}
Classification: ${td.classification} | Area: ${td.product_area}
${td.connector_name ? `Connector: ${td.connector_name}` : ''}
Priority: ${td.priority} | Body: ${td.body}

FINDINGS:
${findings || '(No prior findings)'}

IMPORTANT: In all generated documents, cite sources inline using [Source: ...] format.
For claims from the ticket, use [Source: Pylon #${ticketId}].
For claims from findings, cite the original source (Linear issue IDs, Slack channels).
For analysis/recommendations, note [Source: TSE analysis].
Every factual statement must have an attribution.

Generate each document using === filename === delimiters:

=== summary.md ===
Full investigation summary following ConductorOne's template.

=== customer-response.md ===
Customer-facing response — friendly-professional tone, light formatting.

${isBug ? '=== linear-draft.md ===\nLinear issue draft with title, team, priority, labels, description, steps to reproduce.' : ''}

Write complete documents.`

    console.log(`[Phase2] Generating documents via claude...`)
    writeActivity(investigationDir, 'phase2', 'command', 'Running Claude agent for document synthesis...')
    const output = await runClaude(prompt, investigationDir, { investigationDir, phase: 'phase2' })
    const sections = parseDelimitedOutput(output)

    for (const [fname, content] of Object.entries(sections)) {
      if (['summary.md', 'customer-response.md', 'linear-draft.md'].includes(fname)) {
        writeFileSync(join(investigationDir, fname), content)
        console.log(`[Phase2] Wrote ${fname}`)
        writeActivity(investigationDir, 'phase2', 'result', `Wrote ${fname} (${content.length} chars)`)
      }
    }

    // Write conversation items for Phase 2 document outputs
    if (sections['summary.md']) {
      writeConversationItem(dbHelpers, ticketId, {
        type: 'system_result',
        phase: 'phase2',
        actor_name: 'System',
        actor_role: 'system',
        content: sections['summary.md'],
        content_preview: 'Investigation summary generated',
        metadata: {
          file: 'summary.md',
          doc_type: 'summary',
          sources: [
            { type: 'file', id: 'ticket-data.json', label: 'Pylon ticket data' },
            { type: 'file', id: 'phase1-findings.md', label: 'Phase 1 findings' }
          ]
        }
      }, runNumber)
    }
    if (sections['customer-response.md']) {
      writeConversationItem(dbHelpers, ticketId, {
        type: 'system_result',
        phase: 'phase2',
        actor_name: 'System',
        actor_role: 'system',
        content: sections['customer-response.md'],
        content_preview: 'Customer response drafted',
        metadata: {
          file: 'customer-response.md',
          doc_type: 'customer_response',
          sources: [
            { type: 'file', id: 'ticket-data.json', label: 'Pylon ticket data' },
            { type: 'file', id: 'summary.md', label: 'Investigation summary' }
          ]
        }
      }, runNumber)
    }
    if (sections['linear-draft.md']) {
      writeConversationItem(dbHelpers, ticketId, {
        type: 'system_result',
        phase: 'phase2',
        actor_name: 'System',
        actor_role: 'system',
        content: sections['linear-draft.md'],
        content_preview: 'Linear issue draft created',
        metadata: {
          file: 'linear-draft.md',
          doc_type: 'linear_draft',
          sources: [
            { type: 'file', id: 'ticket-data.json', label: 'Pylon ticket data' },
            { type: 'file', id: 'phase1-findings.md', label: 'Phase 1 findings' },
            { type: 'file', id: 'summary.md', label: 'Investigation summary' }
          ]
        }
      }, runNumber)
    }

    const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
    dbHelpers.updateInvestigation(ticketId, {
      status: 'waiting',
      current_checkpoint: 'checkpoint_3_investigation_validation',
      updated_at: ts
    })

    writeMetrics(investigationDir, { phase2_duration_ms: Date.now() - startTime })
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[Phase2] Complete in ${Date.now() - startTime}ms`)
    writeActivity(investigationDir, 'phase2', 'complete', `Phase 2 complete (${elapsed}s) — ${Object.keys(sections).length} documents generated`)
  } catch (err) {
    console.error(`[Phase2] ERROR: ${err.message}`)
    writeActivity(investigationDir, 'phase2', 'error', `Phase 2 failed: ${err.message}`)
    try {
      const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
      dbHelpers.updateInvestigation(ticketId, { status: 'error', updated_at: ts })
    } catch {}
  }
}

function parseDelimitedOutput(output) {
  const sections = {}
  const parts = output.split(/===\s*([\w.-]+)\s*===/)
  for (let i = 1; i < parts.length; i += 2) {
    const filename = parts[i].trim()
    const content = (parts[i + 1] || '').trim()
    if (filename && content) sections[filename] = content
  }
  return sections
}

function writeMetrics(dir, data) {
  const p = join(dir, 'metrics.json')
  let m = {}
  try { if (existsSync(p)) m = JSON.parse(readFileSync(p, 'utf-8')) } catch {}
  Object.assign(m, data, { last_updated: new Date().toISOString() })
  writeFileSync(p, JSON.stringify(m, null, 2))
}

/**
 * Populate investigation from ticket-data.json (bootstrap helper)
 */
export function populateFromTicketData(ticketId, investigationDir, dbHelpers) {
  const p = join(investigationDir, 'ticket-data.json')
  if (!existsSync(p)) return false
  try {
    const data = JSON.parse(readFileSync(p, 'utf-8'))
    const ts = new Date().toISOString().replace('T', ' ').split('.')[0]
    const fields = {
      customer_name: data.customer_name || null,
      classification: data.classification || null,
      connector_name: data.connector_name || null,
      product_area: data.product_area || null,
      priority: data.priority || null,
      suggested_priority: data.suggested_priority || null,
      snapshot: JSON.stringify(data),
      updated_at: ts
    }
    const filtered = Object.fromEntries(Object.entries(fields).filter(([_, v]) => v != null))
    if (Object.keys(filtered).length > 0) {
      dbHelpers.updateInvestigation(ticketId, filtered)
      console.log(`[Bootstrap] Populated #${ticketId} from ticket-data.json`)
      return true
    }
  } catch (err) {
    console.error(`[Bootstrap] Error for #${ticketId}: ${err.message}`)
  }
  return false
}
