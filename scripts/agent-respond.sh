#!/bin/bash
# Send a response to an agent in Agent HQ
# Usage: ./agent-respond.sh <agentId> <message> [instructionId]
# Example: ./agent-respond.sh "Writer" "Started working on the blog post about ABA ethics" "1234567890"

set -e

SITE_URL="${SITE_URL:-https://robspain.com}"
ADMIN_TOKEN="8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b"

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <agentId> <message> [instructionId]"
  echo ""
  echo "Example:"
  echo "  $0 'Writer' 'Working on your request now' '1234567890'"
  exit 1
fi

AGENT_ID="$1"
MESSAGE="$2"
INSTRUCTION_ID="${3:-}"

# Build JSON payload
if [ -n "$INSTRUCTION_ID" ]; then
  PAYLOAD=$(jq -n \
    --arg agentId "$AGENT_ID" \
    --arg message "$MESSAGE" \
    --arg from "Neo" \
    --arg instructionId "$INSTRUCTION_ID" \
    --arg token "$ADMIN_TOKEN" \
    '{agentId: $agentId, message: $message, from: $from, instructionId: $instructionId, token: $token}')
else
  PAYLOAD=$(jq -n \
    --arg agentId "$AGENT_ID" \
    --arg message "$MESSAGE" \
    --arg from "Neo" \
    --arg token "$ADMIN_TOKEN" \
    '{agentId: $agentId, message: $message, from: $from, token: $token}')
fi

# Send to API
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d "$PAYLOAD" \
  "${SITE_URL}/api/agent-respond")

# Check response
if echo "$RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
  RESPONSE_ID=$(echo "$RESPONSE" | jq -r '.responseId')
  echo "✓ Response sent to $AGENT_ID (ID: $RESPONSE_ID)"
  exit 0
else
  echo "✗ Failed to send response:"
  echo "$RESPONSE" | jq -r '.error // .'
  exit 1
fi
