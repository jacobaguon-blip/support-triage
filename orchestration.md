# Triage Orchestration Guide

This document provides the master orchestration logic for running support ticket investigations. Use this when conducting investigations either through the launcher script or manually.

## Investigation Phases

### Pre-Investigation: Setup
1. Create investigation directory: `~/support-triage/investigations/{ticket-id}/`
2. Initialize database record with status='queued'
3. Determine agent mode (team vs single)
4. Load settings from `settings.json`

### Phase 0: Classification
**Objective:** Determine which team template to use

**Steps:**
1. Fetch ticket from Pylon using `mcp__pylon__pylon_get_issue` with ticket ID
2. Extract `request_type` and `product_area` from ticket fields
3. Apply classification routing table:
   - Check `request_type` first
   - If "Product Request" → **Feature Request**
   - If "Defect" or "Troubleshooting" → check `product_area`
     - If product_area = "Connectors" → **Connector Bug**
     - If product_area in [Platform/UI, Access Profiles, etc.] → **Product Bug**
     - If product_area = "External Ticketing" → read conversation text to disambiguate
     - If product_area = "Other" → NLP fallback on conversation text
   - If request_type = "Other" → NLP fallback on conversation text
4. Document reasoning for classification
5. Update database: `classification`, `product_area`, `connector_name` (if applicable)

**NLP Fallback Rules:**
- Connector names (Okta, Azure, Salesforce, etc.) → Connector Bug
- UI/platform terms (dashboard, workflow, permissions) → Product Bug
- Request language ("Can we...", "Is it possible...") → Feature Request

**Multi-Issue Detection:**
If ticket contains multiple distinct issues:
- Label each as Issue A, Issue B, etc.
- Each issue gets own classification and team
- Document will have separate sections
- Customer response addresses all issues

### Checkpoint 1: Post-Classification Review
**Trigger:** After classification is determined

**Present to human:**
- Ticket ID and customer name
- Full ticket description (summary)
- Classification result (Connector Bug | Product Bug | Feature Request)
- Classification reasoning
- Product area and connector name (if applicable)
- Pylon priority

**Quick actions:**
- ✓ Confirm — proceed with this classification
- ↩ Reclassify as... — choose different classification
- ✂ Split into multiple issues — if multiple distinct issues detected
- ✕ Abort — pause investigation

**Wait for human approval before proceeding**

Update database: `current_checkpoint='checkpoint_1_post_classification'`, `updated_at=timestamp`

---

### Phase 1: Parallel Context Gathering
**Objective:** Three specialist agents research simultaneously

**Load appropriate team template:**
- Connector Bug → `team-templates/connector-bug.json`
- Product Bug → `team-templates/product-bug.json`
- Feature Request → `team-templates/feature-request.json`

**Agent Mode: Team (if Agent Teams available)**

Spawn 3 specialist agents in parallel:

**For Connector Bug:**
1. **connector-code-specialist**
   - Identify connector repo: `~/C1/ConductorOne/baton-{connector-name}/`
   - Grep for error messages
   - Trace code paths to specific files and lines
   - Provide Level 2 error trace analysis
   - Output: File paths with line ranges, code summaries, error trace

2. **issue-historian**
   - Search Linear: connector name + error keywords
   - Search Pylon: similar customer reports
   - Identify patterns across similar issues
   - Output: Linear issue links with relevance, Pylon ticket references, patterns

3. **slack-context-researcher**
   - Search by customer name, connector name, error text
   - Focus on last 3-6 months
   - Note which channels have relevant discussions
   - Output: Channel names, thread summaries with dates, links

**For Product Bug:**
1. **product-code-reviewer**
   - Identify relevant subdirectories in `~/C1/ductone/`
   - Search for component names, API endpoints, error messages
   - Trace code paths to specific files and lines
   - Provide Level 2 error trace analysis
   - Output: File paths with line ranges, code summaries, error trace

2. **issue-historian** (same as connector bug)
3. **slack-context-researcher** (same as connector bug)

**For Feature Request:**
1. **roadmap-researcher**
   - Search Linear for similar features, roadmap projects
   - Check feature labels and initiatives
   - Identify if planned, in progress, or not scheduled
   - Output: Existing/planned work with status, timelines

2. **similar-requests-researcher**
   - Search Pylon for similar requests from other customers
   - Search Linear for duplicate requests
   - Count frequency and identify requesting customers
   - Output: Similar request links, frequency analysis, vote counts

3. **slack-context-researcher**
   - Search for feature discussions, feasibility talks, workarounds
   - Focus on product and engineering channels
   - Output: Internal sentiment, feasibility discussions, workarounds

**Agent Mode: Single (fallback)**

One agent performs all three roles sequentially in the same order.

**All agents must:**
- Cite all sources (Linear #, Slack links, file:line)
- Report findings using structured format from CLAUDE.md
- Note gaps and unknowns
- Never modify files in ~/C1/
- Stop if blocked and report the blocker

Update database: `status='running'`, `updated_at=timestamp`

### Checkpoint 2: Post-Context-Gathering Review
**Trigger:** After all Phase 1 agents complete

**Present to human:**
- Summary from each specialist agent
- Key findings with source citations
- Identified gaps or unknowns
- Patterns across findings
- Recommended next steps

**Quick actions:**
- ✓ Continue investigation — proceed to synthesis
- 🔍 Search deeper in... — direct agents to specific areas (Slack channels, code paths, Linear queries)
- ➡ Redirect focus to... — change investigation focus
- + Add context — human provides additional information
- ✕ Abort — pause investigation

**Wait for human approval before proceeding**

Update database: `current_checkpoint='checkpoint_2_post_context_gathering'`, `updated_at=timestamp`

---

### Phase 2: Synthesis and Document Generation
**Objective:** Lead agent synthesizes findings and generates outputs

**Lead agent tasks:**
1. Collect findings from all specialist agents
2. Identify patterns and connections across findings
3. Assess root cause (Confirmed | Suspected | Unknown)
4. Generate investigation documents

**Document 1: summary.md**
Use template from `templates/summary-template.md`

Fill in all sections:
- Ticket Summary (2-3 sentences)
- Classification (type, product area, connector, priorities)
- Key Findings (with source citations)
- Code Analysis (file paths, error trace, Level 3 prompt)
- Related Issues (Linear links with status/relevance)
- Slack Context (channels, dates, summaries)
- Root Cause Assessment (status + explanation)
- Recommended Actions (prioritized list)
- Open Questions / Escalation Needs
- Investigation Metadata

**Document 2: linear-draft.md** (for bugs only)
Use template from `templates/linear-draft-template.md`

Fill in:
- Title (descriptive, includes connector/product area)
- Team (Engineering, Connectors, Platform)
- Priority (High | Medium | Low based on findings)
- Labels (bug, connector name, product area)
- Description (full context)
- Steps to Reproduce
- Expected vs Actual Behavior
- Related Issues (from investigation)
- Customer Impact
- Investigation Reference (path to investigation dir)
- Pylon Ticket link

**Document 3: customer-response.md**
Use template and style guide from `templates/customer-response-template.md`

Follow style guidelines:
- Friendly-professional tone
- Light formatting (subheadings, bullets)
- Acknowledge their specific issue
- Explain findings in customer-friendly language
- Be direct about bug/expected behavior/need more info
- Provide clear next steps
- Offer follow-up

**For Feature Requests:**
- Skip linear-draft.md unless escalation needed
- Customer response should indicate if feature exists, is planned, or not planned
- Include workarounds if available
- Note similar requests if found

**Additional files:**
- `agent-transcript.txt` — Raw log of agent outputs
- `metrics.json` — Timing data, agents used, sources cited

Update database: `output_path`, `updated_at=timestamp`

### Checkpoint 3: Investigation Validation
**Trigger:** After complete investigation document is generated

**Present to human:**
- Complete summary.md document
- Linear draft (if applicable)
- Customer response draft
- All source citations

**Human performs:**
- Review findings for accuracy
- Manual UI reproduction if needed
- Validate code analysis
- Check customer response quality

**Quick actions:**
- ✓ Findings look correct — proceed to final approval
- ✏ Corrections needed — specify what needs revision
- 🔬 Go to Level 3 analysis — request root cause analysis for code
- ↩ Re-investigate — restart Phase 1 with new direction
- ✕ Abort — pause investigation

**Wait for human approval before proceeding**

Update database: `current_checkpoint='checkpoint_3_investigation_validation'`, `updated_at=timestamp`

---

### Phase 3: Revisions (if needed)
**Objective:** Apply corrections from Checkpoint 3

**If Level 3 analysis requested:**
1. Code specialist agent performs deeper root cause analysis
2. Identifies why code is broken
3. Proposes potential fixes
4. Assesses complexity of resolution
5. Updates Code Analysis section in summary.md

**If corrections requested:**
1. Apply specific corrections to documents
2. Re-generate affected sections
3. Maintain all source citations
4. Document what was changed and why

**If re-investigation requested:**
1. Return to Phase 1 with new direction from human
2. Restart appropriate specialist agents
3. Maintain previous findings as reference

Update documents and database: `updated_at=timestamp`

### Checkpoint 4: Re-Validation / Solution Check
**Trigger:** After revisions applied (if any) or from Checkpoint 3 if no revisions needed

**Present to human:**
- Revised summary.md (or original if no revisions)
- Revised customer-response.md (or original)
- Linear draft (if applicable)
- Change log (if revisions were made)

**Human confirms:**
- This solves the customer's issue
- Customer response is ready to send
- Linear draft is ready to create (if applicable)

**Quick actions:**
- ✓ This solves the customer issue — mark complete
- ✏ Revise response — make final edits to customer response
- ⬆ Escalate to engineering — mark as needs escalation
- 📋 Create Linear issue draft — confirm Linear draft is ready
- ✕ Abort — pause investigation

**Wait for human approval before proceeding**

Update database: `current_checkpoint='checkpoint_4_solution_check'`, `updated_at=timestamp`

---

### Post-Investigation: Completion
**When human approves at Checkpoint 4:**

1. Mark investigation complete:
```sql
UPDATE investigations
SET status='complete',
    resolved_at='timestamp',
    resolution_type='solved',
    updated_at='timestamp'
WHERE id={ticket_id};
```

2. Human performs manual actions (outside agent scope):
   - Reviews and proofreads customer response
   - Clicks "Create in Linear" button (if applicable)
   - Sends customer response via Pylon
   - Clicks "Push to Notion" button (optional)

3. System tracks style guide feedback:
   - If human edited customer response, prompt "What did you change?"
   - Learn from edits to improve future responses
   - Update `style-guide.json` with patterns

**Resolution types:**
- `solved` — Investigation complete, customer response ready
- `escalated` — Needs engineering input, beyond support scope
- `duplicate` — Found existing ticket/issue covering this
- `wontfix` — Not a bug, expected behavior explained

---

## Database Operations

**Create investigation:**
```sql
INSERT INTO investigations (
    id, status, agent_mode, current_checkpoint,
    created_at, updated_at, output_path
) VALUES (
    {ticket_id}, 'queued', '{team|single}', 'checkpoint_1_post_classification',
    datetime('now'), datetime('now'), '{path}'
);
```

**Update classification:**
```sql
UPDATE investigations
SET classification='{type}',
    product_area='{area}',
    connector_name='{name}',
    priority='{P1-P4}',
    updated_at=datetime('now')
WHERE id={ticket_id};
```

**Update checkpoint:**
```sql
UPDATE investigations
SET current_checkpoint='{checkpoint_name}',
    updated_at=datetime('now')
WHERE id={ticket_id};
```

**Mark complete:**
```sql
UPDATE investigations
SET status='complete',
    resolved_at=datetime('now'),
    resolution_type='{type}',
    updated_at=datetime('now')
WHERE id={ticket_id};
```

**Pause (abort):**
```sql
UPDATE investigations
SET status='paused',
    updated_at=datetime('now')
WHERE id={ticket_id};
```

**Resume:**
```sql
UPDATE investigations
SET status='running',
    updated_at=datetime('now')
WHERE id={ticket_id};
```

---

## Error Handling

**If Pylon ticket not found:**
- Report error clearly
- Check ticket ID format (should be numeric)
- Verify Pylon MCP connection
- Abort investigation with clear error message

**If classification is ambiguous:**
- Default to Product Bug
- Flag for human review at Checkpoint 1
- Present reasoning transparently
- Offer reclassification options

**If code cannot be located:**
- Report what was searched
- Suggest alternative search strategies
- Note gap in "Open Questions" section
- Continue with other findings
- Don't fabricate file paths

**If too many Slack results:**
- Prioritize recent (last 3-6 months)
- Focus on engineering channels
- Summarize patterns vs listing all threads
- Note which channels had most relevant content

**If similar issues not found:**
- Explicitly state "No similar issues found"
- Note this is valuable information
- Suggest broader searches if appropriate
- Continue investigation

**If Agent Teams unavailable:**
- Auto-detect and fall back to single-agent mode
- Notify human of fallback
- Continue same workflow, sequential execution
- Same checkpoints and output format

---

## Safety Checks

**Before any investigation:**
- [ ] Verify ~/C1/ is read-only
- [ ] Verify investigation directory is writable
- [ ] Verify all MCP connections are available
- [ ] Verify database is accessible

**During investigation:**
- [ ] Never modify files in ~/C1/
- [ ] Always cite sources
- [ ] Respect all checkpoints
- [ ] Never create Linear issues (only draft)
- [ ] Never send Pylon messages (only draft)
- [ ] Never push to Notion (only prepare content)

**After investigation:**
- [ ] All findings have citations
- [ ] Code analysis is at least Level 2
- [ ] Level 3 prompt included after Level 2
- [ ] Customer response follows style guide
- [ ] All documents generated
- [ ] Database updated
- [ ] No unsafe actions taken

---

## Configuration Reference

**From settings.json:**
- `checkpoints` — Which checkpoints are enabled and mandatory
- `concurrency.max_active_investigations` — How many can run at once
- `agent_mode.default` — Team or single
- `auto_proceed` — Timeout settings for auto-proceeding past checkpoints
- `code_review.default_depth` — Level 2 by default
- `timeouts.investigation_max_duration_seconds` — Max time per investigation
- `safety.*` — All safety constraint toggles

**From CLAUDE.md:**
- Full agent instructions
- Classification routing table
- Code review protocols
- Communication formats
- Customer response style
- Checkpoint procedures

**From team templates:**
- Agent roles and responsibilities
- Search strategies
- Data sources
- Expected outputs
- Phase execution order
