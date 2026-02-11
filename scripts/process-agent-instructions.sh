#!/bin/bash
# Process pending agent instructions
# Called by Neo during heartbeats to check for new instructions from Agent HQ
# Usage: ./process-agent-instructions.sh [--mark-processed instructionId]

set -e

SITE_URL="${SITE_URL:-https://robspain.com}"
ADMIN_TOKEN="8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b"

# Check for --mark-processed flag
if [ "$1" = "--mark-processed" ] && [ -n "$2" ]; then
  echo "Marking instruction $2 as processed (not yet implemented)"
  # TODO: Create a Netlify Function to mark instructions as processed
  exit 0
fi

# Fetch pending instructions from API
RESPONSE=$(curl -s "${SITE_URL}/api/agent-instructions-list?token=${ADMIN_TOKEN}")

# Check if request was successful
if ! echo "$RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
  echo "Error fetching instructions: $RESPONSE" >&2
  exit 1
fi

# Get count of pending instructions
COUNT=$(echo "$RESPONSE" | jq -r '.count')

if [ "$COUNT" = "0" ]; then
  echo "No pending instructions."
  exit 0
fi

# Output pending instructions in a format Neo can parse
echo "Found $COUNT pending instruction(s):"
echo ""

echo "$RESPONSE" | jq -r '.instructions[] | "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent: \(.agentId)
ID: \(.instructionId)
Time: \(.timestamp)
Instruction:
\(.instruction)
"'

# Output JSON for programmatic parsing (one per line)
echo ""
echo "# JSON output (one per line):"
echo "$RESPONSE" | jq -c '.instructions[]'
