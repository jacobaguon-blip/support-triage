#!/bin/bash
# Support Ticket Triage System — Launcher Script
# Usage:
#   ./triage-launcher.sh 8314                 # Start new investigation
#   ./triage-launcher.sh 8314 --resume        # Resume paused investigation
#   ./triage-launcher.sh 8314 --single        # Force single-agent mode

set -e

# Configuration
TRIAGE_DIR="$HOME/support-triage"
DB_PATH="$TRIAGE_DIR/triage.db"
INVESTIGATIONS_DIR="$TRIAGE_DIR/investigations"
CLAUDE_MD="$TRIAGE_DIR/CLAUDE.md"
SETTINGS_FILE="$TRIAGE_DIR/settings.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
TICKET_ID="$1"
MODE="new"
AGENT_MODE="team"

if [ -z "$TICKET_ID" ]; then
    echo -e "${RED}Error: Ticket ID required${NC}"
    echo "Usage: $0 <ticket_id> [--resume] [--single]"
    exit 1
fi

# Check for flags
for arg in "$@"; do
    case $arg in
        --resume)
            MODE="resume"
            ;;
        --single)
            AGENT_MODE="single"
            ;;
    esac
done

# Verify triage directory exists
if [ ! -d "$TRIAGE_DIR" ]; then
    echo -e "${RED}Error: Triage directory not found at $TRIAGE_DIR${NC}"
    echo "Run initialization script first"
    exit 1
fi

# Verify database exists
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}Error: Database not found at $DB_PATH${NC}"
    exit 1
fi

# Create investigation directory if it doesn't exist
INVESTIGATION_DIR="$INVESTIGATIONS_DIR/$TICKET_ID"
mkdir -p "$INVESTIGATION_DIR"

# Check if investigation already exists in database
EXISTING=$(sqlite3 "$DB_PATH" "SELECT id FROM investigations WHERE id = $TICKET_ID;")

if [ "$MODE" = "resume" ]; then
    if [ -z "$EXISTING" ]; then
        echo -e "${RED}Error: No existing investigation found for ticket $TICKET_ID${NC}"
        exit 1
    fi
    echo -e "${BLUE}Resuming investigation for ticket #$TICKET_ID${NC}"

    # Check for snapshot file
    SNAPSHOT_FILE="$INVESTIGATION_DIR/snapshot.json"
    if [ ! -f "$SNAPSHOT_FILE" ]; then
        echo -e "${YELLOW}Warning: No snapshot file found. Starting fresh investigation.${NC}"
        MODE="new"
    fi
else
    # New investigation
    if [ -n "$EXISTING" ]; then
        echo -e "${YELLOW}Warning: Investigation for ticket $TICKET_ID already exists${NC}"
        echo "Use --resume to continue, or delete the existing investigation first"
        read -p "Overwrite existing investigation? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Initialize database record
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S")
    sqlite3 "$DB_PATH" <<EOF
INSERT OR REPLACE INTO investigations (
    id,
    status,
    agent_mode,
    current_checkpoint,
    created_at,
    updated_at,
    output_path
) VALUES (
    $TICKET_ID,
    'queued',
    '$AGENT_MODE',
    'checkpoint_1_post_classification',
    '$TIMESTAMP',
    '$TIMESTAMP',
    '$INVESTIGATION_DIR'
);
EOF
    echo -e "${GREEN}Initialized investigation record in database${NC}"
fi

# Create investigation prompt
PROMPT_FILE="$INVESTIGATION_DIR/triage-prompt.txt"
cat > "$PROMPT_FILE" <<EOF
# Support Ticket Triage — Investigation #$TICKET_ID

## Mode
- Agent Mode: $AGENT_MODE
- Execution Mode: $MODE

## Instructions
You are conducting a support ticket investigation using the Support Ticket Triage System.

Read the following files for complete context:
1. $CLAUDE_MD — Full agent instructions and protocols
2. $SETTINGS_FILE — System configuration

## Your Task

EOF

if [ "$MODE" = "resume" ]; then
    cat >> "$PROMPT_FILE" <<EOF
**RESUME PAUSED INVESTIGATION**

1. Read the snapshot file: $INVESTIGATION_DIR/snapshot.json
2. Review all existing findings in: $INVESTIGATION_DIR/
3. Continue from the last checkpoint: [checkpoint will be loaded from snapshot]
4. Follow the instructions from the human's last feedback
EOF
else
    cat >> "$PROMPT_FILE" <<EOF
**START NEW INVESTIGATION**

1. Fetch Pylon ticket #$TICKET_ID using Pylon MCP
2. Read the request_type and product_area fields
3. Apply the classification routing table from CLAUDE.md
4. Present classification at Checkpoint 1 and wait for human approval
5. Spawn the appropriate agent team (or run single-agent mode if --single)
6. Execute Phase 1: Parallel context gathering
   - connector-code-specialist OR product-code-reviewer (based on classification)
   - issue-historian
   - slack-context-researcher
7. Present findings at Checkpoint 2 and wait for human approval
8. Execute Phase 2: Synthesis
   - Generate summary.md
   - Generate linear-draft.md (for bugs)
   - Generate customer-response.md
9. Present complete investigation at Checkpoint 3 and wait for validation
10. Apply any revisions requested by human
11. Present final outputs at Checkpoint 4 for solution check

## Output Location
All files should be written to: $INVESTIGATION_DIR/

Required outputs:
- summary.md
- customer-response.md
- linear-draft.md (for bugs only)
- agent-transcript.txt
- metrics.json

## Remember
- Read CLAUDE.md for full protocols and safety guardrails
- All checkpoints are mandatory unless auto-proceed is enabled
- Always cite sources (Linear #, Slack links, file:line)
- ~/C1/ is READ-ONLY
- Never create Linear issues or send Pylon messages
- Default to Level 2 code analysis, prompt for Level 3
EOF
fi

cat >> "$PROMPT_FILE" <<EOF

## Database Update
After completing each checkpoint, update the database:
\`\`\`bash
sqlite3 $DB_PATH "UPDATE investigations SET current_checkpoint='checkpoint_name', updated_at='timestamp' WHERE id=$TICKET_ID;"
\`\`\`

When investigation is complete:
\`\`\`bash
sqlite3 $DB_PATH "UPDATE investigations SET status='complete', resolved_at='timestamp' WHERE id=$TICKET_ID;"
\`\`\`

---

Begin investigation now.
EOF

echo -e "${GREEN}Created investigation prompt at: $PROMPT_FILE${NC}"

# Update status to running
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S")
sqlite3 "$DB_PATH" "UPDATE investigations SET status='running', updated_at='$TIMESTAMP' WHERE id=$TICKET_ID;"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Starting investigation for ticket #$TICKET_ID${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Mode: ${YELLOW}$MODE${NC}"
echo -e "Agent Mode: ${YELLOW}$AGENT_MODE${NC}"
echo -e "Investigation Directory: ${YELLOW}$INVESTIGATION_DIR${NC}"
echo -e "Database: ${YELLOW}$DB_PATH${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Claude Code is available
if ! command -v claude &> /dev/null; then
    echo -e "${YELLOW}Warning: 'claude' command not found${NC}"
    echo "Make sure Claude Code CLI is installed and in your PATH"
    echo ""
    echo -e "${BLUE}Manual start:${NC}"
    echo "cd $INVESTIGATION_DIR && claude"
    echo "Then provide the content of: $PROMPT_FILE"
    exit 1
fi

# Launch Claude Code with the prompt
echo -e "${GREEN}Launching Claude Code...${NC}"
echo ""

# Change to investigation directory and launch
cd "$INVESTIGATION_DIR"

# Display the prompt and launch Claude
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$PROMPT_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Investigation prompt created. Ready to begin.${NC}"
echo ""
echo "To start the investigation, run:"
echo -e "${GREEN}cd $INVESTIGATION_DIR && claude${NC}"
echo ""
echo "Then copy and paste the content from:"
echo -e "${GREEN}$PROMPT_FILE${NC}"
