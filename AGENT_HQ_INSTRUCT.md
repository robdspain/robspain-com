# Agent HQ Instruction System

A real-time instruction and response system for Agent HQ on robspain.com. Allows Rob to send instructions to specific agents and receive responses via a chat-like interface.

## Architecture

### Frontend (Agent HQ)
- **Location:** `src/admin/agents.njk`
- **Features:**
  - Click any agent to open instruction modal
  - Two tabs: "Instruct" and "Responses"
  - Instruct tab: Send instructions to the agent (max 200 chars)
  - Responses tab: Real-time chat view with 5-second polling
  - "Sent ✓" confirmation with pulse animation
  - Typing indicator while awaiting responses

### Netlify Functions (API)

#### 1. `/api/agent-instruct` (POST)
Receives and stores instructions from Rob.

**Request:**
```json
{
  "agentId": "Writer",
  "instruction": "Write a blog post about ABA ethics",
  "token": "ADMIN_API_TOKEN"
}
```

**Response:**
```json
{
  "ok": true,
  "queued": true,
  "instructionId": "1234567890"
}
```

**Storage:** Netlify Blobs key `agent-instructions-{agentId}` (JSON array)

#### 2. `/api/agent-responses` (GET)
Retrieves responses for a specific agent.

**Request:**
```
GET /api/agent-responses?agentId=Writer&token=ADMIN_API_TOKEN
```

**Response:**
```json
{
  "ok": true,
  "agentId": "Writer",
  "responses": [
    {
      "id": "1234567890",
      "message": "Working on the blog post now. Will have a draft in 2 hours.",
      "from": "Neo",
      "timestamp": "2026-02-11T23:54:00.000Z",
      "instructionId": "1234567890"
    }
  ]
}
```

**Storage:** Netlify Blobs key `agent-responses-{agentId}` (JSON array, max 50)

#### 3. `/api/agent-instructions-list` (GET)
Lists all pending (unprocessed) instructions across all agents.

**Request:**
```
GET /api/agent-instructions-list?token=ADMIN_API_TOKEN
```

**Response:**
```json
{
  "ok": true,
  "count": 2,
  "instructions": [
    {
      "agentId": "Writer",
      "instructionId": "1234567890",
      "instruction": "Write a blog post about ABA ethics",
      "timestamp": "2026-02-11T23:50:00.000Z"
    }
  ]
}
```

#### 4. `/api/agent-respond` (POST)
Allows Neo to post responses back to agents.

**Request:**
```json
{
  "agentId": "Writer",
  "message": "Started working on your request",
  "from": "Neo",
  "instructionId": "1234567890",
  "token": "ADMIN_API_TOKEN"
}
```

**Response:**
```json
{
  "ok": true,
  "responseId": "1234567891"
}
```

**Side effect:** Marks the instruction as `processed: true` if `instructionId` is provided.

### Scripts (for Neo)

#### `scripts/process-agent-instructions.sh`
Check for pending instructions during heartbeats.

**Usage:**
```bash
./scripts/process-agent-instructions.sh
```

**Output:**
```
Found 2 pending instruction(s):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent: Writer
ID: 1234567890
Time: 2026-02-11T23:50:00.000Z
Instruction:
Write a blog post about ABA ethics

# JSON output (one per line):
{"agentId":"Writer","instructionId":"1234567890","instruction":"Write a blog post about ABA ethics","timestamp":"2026-02-11T23:50:00.000Z"}
```

#### `scripts/agent-respond.sh`
Send a response to an agent.

**Usage:**
```bash
./scripts/agent-respond.sh <agentId> <message> [instructionId]
```

**Example:**
```bash
./scripts/agent-respond.sh "Writer" "Working on your blog post now" "1234567890"
```

**Output:**
```
✓ Response sent to Writer (ID: 1234567891)
```

## Neo's Workflow

### 1. During Heartbeats
Add to `HEARTBEAT.md`:
```markdown
- [ ] Check Agent HQ instructions: `bash ~/robspain-com/scripts/process-agent-instructions.sh`
```

### 2. When Instructions Found
- Read the instruction
- Spawn appropriate sub-agent or handle directly
- Send acknowledgment response:
  ```bash
  ./scripts/agent-respond.sh "Writer" "Spawning sub-agent for blog post" "1234567890"
  ```

### 3. When Task Completes
- Send completion response:
  ```bash
  ./scripts/agent-respond.sh "Writer" "Blog post draft complete: https://link-to-draft" "1234567890"
  ```

## Rob's Workflow

### 1. Open Agent HQ
Visit: https://robspain.com/admin/agents/

### 2. Instruct an Agent
1. Click any agent in the office
2. Type instruction in the modal (max 200 chars)
3. Click "SEND"
4. See "Sent ✓" confirmation

### 3. Check Responses
1. Click the agent again
2. Switch to "Responses" tab
3. See real-time chat with Neo (polls every 5 seconds)

## Security

- **Token:** All API endpoints require `ADMIN_API_TOKEN` via:
  - `Authorization: Bearer {token}` header, OR
  - `?token=` query param, OR
  - `token` field in JSON body
- **CORS:** Allows requests from any origin (adjust in production if needed)
- **Storage:** Netlify Blobs store `agent-data` (private, not public)

## Data Storage

### Netlify Blobs Keys
- `agent-instructions-{agentId}` — JSON array of instructions
- `agent-responses-{agentId}` — JSON array of responses (max 50, auto-trimmed)

### Instruction Format
```json
{
  "id": "1234567890",
  "instruction": "Do the thing",
  "timestamp": "2026-02-11T23:50:00.000Z",
  "processed": false
}
```

### Response Format
```json
{
  "id": "1234567891",
  "message": "Working on it",
  "from": "Neo",
  "timestamp": "2026-02-11T23:54:00.000Z",
  "instructionId": "1234567890"
}
```

## Design

- **Aesthetic:** Pixel art + dark theme (matches existing Agent HQ)
- **Modal:** Press Start 2P font for headers, system font for chat
- **Colors:**
  - Primary: `#10b981` (emerald green)
  - Background: `#1a1a2e` (dark blue-gray)
  - Text: `#e2e8f0` (light gray)
  - Accents: `#334155` (borders)
- **Animations:**
  - "Sent ✓" pulses green
  - Typing indicator fades in/out

## Future Enhancements

- [ ] Mark instructions as "in progress" vs "completed"
- [ ] Add instruction priority levels
- [ ] File attachments support
- [ ] Multi-agent group instructions
- [ ] Instruction history/archive view
- [ ] Notification badge when responses arrive
