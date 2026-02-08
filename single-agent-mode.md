# Single-Agent Mode — Fallback Execution Guide

This document describes how to run the complete investigation workflow with a single agent instead of an agent team. Use this when Agent Teams feature is unavailable or when manually selected for simpler tickets.

## When to Use Single-Agent Mode

**Automatic fallback:**
- Agent Teams feature is not enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS != 1`)
- Agent Teams encounters errors during spawn
- System detects Agent Teams is unavailable

**Manual selection:**
- User starts investigation with `--single` flag
- User toggles single-agent mode in UI for specific ticket
- Investigation is deemed simple enough to not need parallelization

**Notification:**
When falling back automatically, inform the user: "Agent Teams unavailable, using single-agent mode. Same investigation depth, just sequential execution."

---

## Single-Agent Workflow

Same phases, same checkpoints, same output format — just one agent doing everything sequentially instead of three in parallel.

### Phase 0: Classification
**Same as team mode** — no difference

1. Fetch ticket from Pylon
2. Extract request_type and product_area
3. Apply classification routing table
4. Document reasoning

**Checkpoint 1: Post-Classification Review**
Wait for human approval

---

### Phase 1: Sequential Context Gathering
**One agent performs all three specialist roles in sequence**

#### Step 1: Code Review
**For Connector Bug, act as connector-code-specialist:**
- Identify connector repo: `~/C1/ConductorOne/baton-{connector-name}/`
- Grep for error messages
- Trace code paths to files and lines
- Provide Level 2 error trace analysis
- Output findings: file paths, code summaries, error trace

**For Product Bug, act as product-code-reviewer:**
- Identify relevant subdirectories in `~/C1/ductone/`
- Search for component names, API endpoints, errors
- Trace code paths to files and lines
- Provide Level 2 error trace analysis
- Output findings: file paths, code summaries, error trace

**For Feature Request, skip code review** (not applicable)

#### Step 2: History Search
**Act as issue-historian:**
- Search Linear: relevant keywords + product area/connector
- Search Pylon: similar customer reports
- Identify patterns across similar issues
- Check status of related engineering work
- Output findings: Linear issue links with relevance, Pylon references, patterns

**For Feature Request, act as roadmap-researcher:**
- Search Linear for similar features, roadmap projects
- Check feature labels and initiatives
- Identify if planned, in progress, or not scheduled
- Output findings: existing/planned work with status and timelines

**Then act as similar-requests-researcher:**
- Search Pylon for similar requests from other customers
- Search Linear for duplicate requests
- Count frequency, identify requesting customers
- Output findings: similar request links, frequency analysis

#### Step 3: Slack Search
**Act as slack-context-researcher:**
- Search by customer name, connector/product area, error text
- Focus on last 3-6 months
- Prioritize channels with engineering participation
- Note which channels have relevant discussions
- Output findings: channel names, thread summaries with dates, links

**For Feature Request:**
- Search for feature discussions, feasibility talks
- Focus on product and engineering channels
- Look for workaround suggestions
- Output findings: internal sentiment, feasibility, workarounds

**Checkpoint 2: Post-Context-Gathering Review**
Present all findings from Steps 1-3
Wait for human approval

---

### Phase 2: Synthesis and Document Generation
**Same as team mode** — no difference

1. Synthesize findings from all three roles
2. Identify patterns and connections
3. Assess root cause
4. Generate documents:
   - summary.md (use template)
   - linear-draft.md (for bugs)
   - customer-response.md
   - agent-transcript.txt
   - metrics.json

**Checkpoint 3: Investigation Validation**
Present complete investigation
Wait for human approval

---

### Phase 3: Revisions (if needed)
**Same as team mode**

Apply corrections, perform Level 3 analysis if requested, or re-investigate.

**Checkpoint 4: Re-Validation / Solution Check**
Present revised documents
Wait for human approval

---

### Post-Investigation: Completion
**Same as team mode**

Mark complete, human performs manual actions.

---

## Execution Time Comparison

**Team Mode (parallel):**
- Phase 1: ~5-10 minutes (3 agents simultaneously)
- Phase 2: ~3-5 minutes
- **Total: ~8-15 minutes**

**Single-Agent Mode (sequential):**
- Phase 1: ~15-25 minutes (one agent, three roles)
- Phase 2: ~3-5 minutes
- **Total: ~18-30 minutes**

Single-agent mode takes roughly 2x as long but produces the same quality output.

---

## Implementation Notes

### For Agent Teams → Single Agent Conversion

When translating a team template to single-agent execution:

**Connector Bug Team:**
```
connector-code-specialist    → Step 1: Code Review
issue-historian              → Step 2: History Search
slack-context-researcher     → Step 3: Slack Search
```

**Product Bug Team:**
```
product-code-reviewer        → Step 1: Code Review
issue-historian              → Step 2: History Search
slack-context-researcher     → Step 3: Slack Search
```

**Feature Request Team:**
```
roadmap-researcher           → Step 2a: Roadmap Search (skip Step 1)
similar-requests-researcher  → Step 2b: Similar Requests Search
slack-context-researcher     → Step 3: Slack Search
```

### Context Preservation

In single-agent mode, the agent builds context incrementally:
- Findings from Step 1 inform searches in Step 2
- Findings from Steps 1-2 inform searches in Step 3
- All context is available during synthesis in Phase 2

This sequential context building can sometimes surface insights that parallel agents might miss.

### Checkpoints Remain the Same

All 4 checkpoints trigger at the same points:
1. After classification
2. After context gathering (after Step 3)
3. After document generation
4. After any revisions

Human approval process is identical to team mode.

---

## Advantages of Single-Agent Mode

**Simpler tickets:**
- No agent coordination overhead
- More straightforward for simple investigations
- Easier to debug if issues arise

**Context continuity:**
- Single agent builds context progressively
- Can make connections across all three research areas
- No need to synthesize separate agent outputs

**Resource efficiency:**
- Lower computational overhead
- Only one Claude Code instance running
- Easier to run locally

**Fallback reliability:**
- Always available even if Agent Teams has issues
- Proven, simpler execution path
- Same output quality

---

## Disadvantages of Single-Agent Mode

**Slower:**
- Sequential execution takes ~2x as long
- No parallelization benefits

**Concurrency limits:**
- Fewer investigations can run simultaneously
- Agent is single-threaded across all research tasks

**Scale limitations:**
- Team mode can handle 10 concurrent tickets more easily
- Single-agent mode may bottleneck with high volume

---

## Configuration

### Enable single-agent as default
In `settings.json`:
```json
{
  "agent_mode": {
    "default": "single",
    "fallback_to_single": true
  }
}
```

### Force single-agent for specific ticket
Via launcher:
```bash
./triage-launcher.sh 8314 --single
```

Via database:
```sql
UPDATE investigations SET agent_mode='single' WHERE id=8314;
```

### Timeout adjustments for single-agent
Since single-agent takes longer, may need higher timeout:
```json
{
  "timeouts": {
    "investigation_max_duration_seconds": 1800,
    "agent_idle_timeout_seconds": 600
  }
}
```

---

## Metrics to Track

When running in single-agent mode, track:
- Total execution time
- Time per phase
- Time per specialist role
- Number of sources found
- Quality of final output (compare to team mode)

Store in `metrics.json`:
```json
{
  "agent_mode": "single",
  "total_duration_seconds": 1234,
  "phase_1_duration_seconds": 890,
  "phase_2_duration_seconds": 234,
  "step_timings": {
    "code_review": 345,
    "history_search": 290,
    "slack_search": 255
  },
  "sources_found": {
    "linear_issues": 5,
    "pylon_tickets": 3,
    "slack_threads": 8,
    "code_files": 4
  }
}
```

Over time, compare metrics between team mode and single-agent mode to optimize.

---

## Error Recovery in Single-Agent Mode

**If Step 1 (code review) fails:**
- Document the failure
- Note what was attempted
- Continue to Steps 2 and 3
- Flag code analysis gap in summary.md

**If Step 2 (history search) fails:**
- Document the failure
- Continue to Step 3 with code findings from Step 1
- Note the gap in Related Issues section

**If Step 3 (Slack search) fails:**
- Document the failure
- Proceed to synthesis with findings from Steps 1-2
- Note the gap in Slack Context section

**Never abort entire investigation due to one step failing.** Work with available data and note gaps transparently.

---

## Quality Assurance

Single-agent investigations should meet the same quality standards as team mode:

- [ ] All findings have source citations
- [ ] Code analysis is at least Level 2
- [ ] Level 3 prompt included after Level 2
- [ ] Related Linear issues found and linked
- [ ] Slack context captured with dates and channels
- [ ] Customer response follows style guide
- [ ] All documents generated
- [ ] No unsafe actions taken
- [ ] All checkpoints respected

If quality drops in single-agent mode, investigate why and adjust protocols.

---

## Future Optimizations

**Potential improvements for single-agent mode:**

1. **Smarter ordering:** Order specialist roles based on ticket type
   - For connector bugs with clear errors: code review first
   - For vague issues: Slack/history first to understand context

2. **Early termination:** If Step 1 finds definitive answer, optionally skip Steps 2-3
   - Requires human approval at checkpoint

3. **Parallel-lite:** Use concurrent tool calls within single agent
   - E.g., search Linear and Pylon simultaneously in Step 2

4. **Caching:** Cache common searches (connector docs, common errors)
   - Speed up future single-agent investigations

5. **Adaptive depth:** Adjust depth per step based on findings
   - If code review is definitive, lighter history search
   - If history shows pattern, deeper Slack search

These are V2 features — V1 keeps single-agent mode simple and predictable.

---

## Summary

Single-agent mode is a **full-featured fallback** that:
- Produces the same quality output as team mode
- Uses the same checkpoints and workflows
- Takes approximately 2x as long
- Is simpler and always available
- Works well for lower-complexity tickets

Use it when Agent Teams is unavailable or when investigation is straightforward enough to not need parallelization.
