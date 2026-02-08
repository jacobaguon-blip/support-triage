# Support Triage System - Quick Start

## 🚀 You're Ready to Go!

The system is fully built and ready for Phase 4 calibration with real tickets.

## Start Your First Investigation

### Option 1: Quick Start (Recommended)
```bash
cd ~/support-triage
./start-calibration.sh
```

This interactive script will:
- Check prerequisites
- Prompt for a ticket ID
- Launch the investigation
- Show you next steps

### Option 2: Manual Start
```bash
cd ~/support-triage
./triage-launcher.sh TICKET_ID

# Then in a new terminal:
cd ~/support-triage/investigations/TICKET_ID
claude
# Paste the content from triage-prompt.txt
```

### Option 3: Start the UI
```bash
cd ~/support-triage/ui
npm run dev
# Open http://localhost:3000
```

The UI shows investigation status but investigations are launched via command line.

---

## What Happens During an Investigation

### 1. Classification (Phase 0)
- Fetches ticket from Pylon
- Reads request_type and product_area fields
- Routes to appropriate team

**⏸ Checkpoint 1:** Review classification, confirm or reclassify

### 2. Context Gathering (Phase 1)
Three agents run in parallel:
- **Code specialist** searches ~/C1/ repos
- **Issue historian** searches Linear and Pylon
- **Slack researcher** searches Slack channels

**⏸ Checkpoint 2:** Review findings, continue or search deeper

### 3. Synthesis (Phase 2)
Lead agent generates:
- Complete investigation summary
- Linear issue draft (for bugs)
- Customer response draft

**⏸ Checkpoint 3:** Validate findings, request corrections if needed

### 4. Final Review
Present revised documents

**⏸ Checkpoint 4:** Confirm solution, create Linear issue, send response

---

## Your Investigation Checklist

### Before Starting
- [ ] Pick a suitable ticket (connector bug recommended for first run)
- [ ] Verify MCP servers are working (Pylon, Linear, Slack)
- [ ] Ensure ~/C1/ repos are synced
- [ ] Have 15-20 minutes available

### During Investigation
- [ ] Review classification carefully at Checkpoint 1
- [ ] Check agent findings for accuracy at Checkpoint 2
- [ ] Validate code analysis at Checkpoint 3
- [ ] Proofread customer response before approval

### After Investigation
- [ ] Document what worked well
- [ ] Note what needs improvement
- [ ] Update PHASE-4-CALIBRATION.md with observations
- [ ] Save any customer response edits for style guide

---

## File Locations

**Investigation outputs:**
```
~/support-triage/investigations/{ticket-id}/
├── summary.md              # Complete findings
├── customer-response.md    # Draft reply to customer
├── linear-draft.md        # Linear issue draft (bugs only)
├── agent-transcript.txt   # Raw agent logs
└── metrics.json          # Timing and metadata
```

**Configuration:**
- `~/support-triage/settings.json` - System settings
- `~/support-triage/CLAUDE.md` - Agent instructions
- `~/support-triage/triage.db` - Investigation database

---

## Recommended First Tickets

**Good characteristics for first run:**
- P2 or P3 priority (not urgent)
- Clear error message in description
- Known connector (Okta, Azure, Salesforce, Google Workspace)
- Customer you recognize
- Not multi-issue (keep it simple)

**Avoid for first run:**
- P1 critical issues (too much pressure)
- Vague "something isn't working" tickets
- Multi-issue tickets (complex)
- Brand new connectors (may not have baton-{name} repo yet)

---

## Success Indicators

Your first investigation is successful if:
- ✓ Classification is correct
- ✓ Relevant code files are found
- ✓ Related Linear issues are surfaced
- ✓ Customer response is 80% ready to send
- ✓ You learned something useful from the findings

Don't expect perfection on run #1! The system improves as you calibrate.

---

## Troubleshooting

**"Pylon ticket not found"**
- Verify ticket ID is correct (numeric only)
- Check Pylon MCP connection
- Ensure you have access to the ticket

**"Can't find connector repo"**
- Check spelling: "Okta" → `baton-okta`
- Verify ~/C1/ConductorOne/baton-{name}/ exists
- May need to sync repos if newly added

**"No similar issues found"**
- This is OK! Not every issue has precedent
- Agent should note "appears to be new/unique issue"

**"Investigation stuck"**
- Check agent-transcript.txt for errors
- Use Ctrl+C and `--resume` to continue
- Try `--single` mode if team mode erroring

---

## After Your First Investigation

1. **Document observations** in PHASE-4-CALIBRATION.md
2. **Update CLAUDE.md** if instructions need tuning
3. **Save response edits** to build style guide
4. **Run investigation #2** with lessons applied

Target: 11 investigations for full calibration
- 5 connector bugs
- 3 product bugs
- 3 feature requests

---

## Questions While Running?

Refer to:
- `CLAUDE.md` - Agent instructions and protocols
- `orchestration.md` - Complete workflow details
- `PHASE-4-CALIBRATION.md` - Calibration guide
- `README.md` - Project overview

---

**Ready to start?**

```bash
cd ~/support-triage
./start-calibration.sh
```

Let's triage some tickets! 🎯
