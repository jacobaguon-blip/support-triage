# Phase 4 - Calibration Guide

## Objective
Test the system with real Pylon tickets to validate end-to-end workflow, tune CLAUDE.md instructions, and build customer response style guide through feedback.

## Calibration Plan

### Batch 1: Connector Bugs (5 tickets)
**Goal:** Validate connector bug workflow - most common ticket type

**What to observe:**
- [ ] Connector repo correctly identified (baton-{name} pattern works)
- [ ] Error messages traced to specific code lines
- [ ] Level 2 code analysis depth is appropriate
- [ ] Linear/Pylon history search finds relevant issues
- [ ] Slack search surfaces useful context
- [ ] Customer response tone is appropriate

**Tickets to test:** _(fill in real Pylon ticket IDs)_
1. Ticket #______ - Connector: ______
2. Ticket #______ - Connector: ______
3. Ticket #______ - Connector: ______
4. Ticket #______ - Connector: ______
5. Ticket #______ - Connector: ______

### Batch 2: Product Bugs (3 tickets)
**Goal:** Validate platform bug workflow

**What to observe:**
- [ ] Correct subdirectory in ~/C1/ductone/ identified
- [ ] Product area routing works correctly
- [ ] UI component/API endpoint searches effective
- [ ] Related issues found and linked properly

**Tickets to test:**
1. Ticket #______ - Area: ______
2. Ticket #______ - Area: ______
3. Ticket #______ - Area: ______

### Batch 3: Feature Requests (3 tickets)
**Goal:** Validate feature request workflow

**What to observe:**
- [ ] Roadmap research finds existing/planned work
- [ ] Similar requests aggregated from Pylon
- [ ] Customer response appropriately sets expectations
- [ ] No Linear draft created unless escalation warranted

**Tickets to test:**
1. Ticket #______ - Feature: ______
2. Ticket #______ - Feature: ______
3. Ticket #______ - Feature: ______

---

## Running Your First Investigation

### Step 1: Choose a Ticket
Pick a real Pylon ticket that represents a typical support case. Recommend starting with a connector bug since those are most common.

**Good first tickets:**
- Clear error message in ticket
- Known connector (Okta, Azure, Salesforce, etc.)
- P2 or P3 priority (not critical)
- Customer name you recognize

### Step 2: Start Investigation
```bash
cd ~/support-triage
./triage-launcher.sh TICKET_ID
```

This will:
- Create investigation directory
- Initialize database record
- Generate investigation prompt
- Show you the prompt to provide to Claude Code

### Step 3: Run Investigation
```bash
# In a new terminal or tab
cd ~/support-triage/investigations/TICKET_ID
claude
```

Then paste the content from `triage-prompt.txt` that the launcher created.

### Step 4: Go Through Checkpoints

**Checkpoint 1: Post-Classification**
- Verify classification is correct
- Check connector name/product area
- Confirm or reclassify

**Checkpoint 2: Post-Context-Gathering**
- Review findings from all 3 agents
- Check if code, Linear, and Slack searches found useful info
- Decide if you need deeper searches or can continue

**Checkpoint 3: Investigation Validation**
- Review complete summary.md
- Validate code analysis accuracy
- Check customer response quality
- Request Level 3 if needed

**Checkpoint 4: Solution Check**
- Proofread customer response
- Review Linear draft (if applicable)
- Confirm it solves the customer's issue

### Step 5: Document Observations

After each investigation, note:
- **What worked well:** _______________
- **What needs improvement:** _______________
- **CLAUDE.md changes needed:** _______________
- **Customer response edits made:** _______________

---

## Tuning CLAUDE.md Based on Results

### Common Issues and Fixes

**Issue:** Code searches too broad, finding irrelevant files
**Fix:** Add more specific search patterns to agent role in CLAUDE.md

**Issue:** Classification incorrect
**Fix:** Update routing table with more product area mappings

**Issue:** Customer responses too technical
**Fix:** Add to "never do" list: "Don't use engineering jargon"

**Issue:** Missing context from Slack
**Fix:** Add high-value channels to priority list in settings

**Issue:** Linear searches missing related issues
**Fix:** Improve search keyword strategy in agent instructions

### Iteration Process

1. Run investigation
2. Note what agents did wrong or missed
3. Update CLAUDE.md with clearer instructions
4. Run next investigation
5. Check if improvement occurred
6. Repeat

---

## Building Customer Response Style Guide

After each investigation where you edit the customer response draft:

1. Note what you changed (tone, structure, content)
2. Extract patterns:
   - If you always remove something → add to "never do"
   - If you always add something → add to "always include"
3. Update `style-guide.json` manually or via UI

**Example patterns to capture:**
- "Never use 'unfortunately' more than once"
- "Always mention customer name in opening"
- "Always provide next steps even if escalating"
- "Never promise fix timelines"

---

## Success Metrics

After 11 tickets (5 connector + 3 product + 3 feature), you should see:

### Accuracy Metrics
- [ ] Classification correct >90% of time
- [ ] Connector repos identified 100% correctly
- [ ] Relevant code files found >80% of time
- [ ] Related Linear issues found >70% of time

### Quality Metrics
- [ ] Customer responses need <20% editing
- [ ] Code analysis is accurate at Level 2
- [ ] Linear drafts are ready to create with minimal edits
- [ ] Escalation recommendations are appropriate

### Efficiency Metrics
- [ ] Team mode completes in 10-15 minutes
- [ ] Single mode completes in 20-30 minutes
- [ ] Less than 3 back-and-forths at checkpoints
- [ ] No blocked/errored investigations

---

## Real-World Testing Checklist

### Before Starting Calibration
- [ ] MCP servers are working (Pylon, Linear, Slack)
- [ ] ~/C1/ repos are synced and up to date
- [ ] Database is initialized
- [ ] Launcher script is executable
- [ ] You have 11 suitable tickets identified

### During Calibration
- [ ] Document every observation
- [ ] Track time per investigation
- [ ] Note checkpoint decisions
- [ ] Save edited customer responses
- [ ] Compare agent findings to your own research

### After Each Batch
- [ ] Update CLAUDE.md with lessons learned
- [ ] Add to style-guide.json
- [ ] Test improvements on next batch
- [ ] Note if issues are getting better or worse

---

## Known Limitations to Accept

These are V1 constraints - don't spend time fixing:
- UI doesn't have real-time WebSocket (polls every 2s instead)
- Settings changes require manual JSON editing
- No auto-link between Linear issues and Pylon tickets
- No Notion severity definitions integration
- Slack searches all channels (no filtering yet)
- Priority suggestions are just suggestions (no auto-change)

---

## When to Stop Calibrating

You're ready for production use when:
1. 3+ consecutive investigations complete without major issues
2. Customer response edits are minor (grammar/phrasing only)
3. Classification routing is accurate
4. You trust the findings enough to use them in real responses
5. You have 5+ style guide rules learned

---

## Next Steps After Calibration

Once calibrated:
- Use system for all new support tickets
- Continue building style guide over time
- Track which Slack channels have best signal
- Build channel frequency map organically
- Eventually tackle Phase 5 polish features

---

## Emergency Troubleshooting

**Investigation stuck at checkpoint:**
- Check `investigations/{ticket-id}/agent-transcript.txt` for errors
- Use `--resume` flag to continue from checkpoint
- Use `--single` flag if team mode is erroring

**Classification wrong:**
- Use "Reclassify" at Checkpoint 1
- Note the error pattern to update routing table

**Agents can't find code:**
- Check that ~/C1/ repos exist and are synced
- Verify connector name spelling matches baton-{name}
- May need to manually point to correct directory

**Customer response totally off:**
- Use "Corrections needed" at Checkpoint 3
- Provide specific feedback on what to change
- Multiple rounds OK while calibrating

---

Ready to run your first investigation! 🚀

Pick a Pylon ticket and let's start with:
```bash
./triage-launcher.sh TICKET_ID
```
