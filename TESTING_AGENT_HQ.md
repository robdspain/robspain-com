# Testing Agent HQ Instruction System

## Quick Test (After Netlify Deploy)

### 1. Test the Frontend
1. Visit https://robspain.com/admin/agents/
2. Click any agent (e.g., "Writer")
3. Type an instruction: "Write a test blog post"
4. Click SEND
5. Should see "✓ Sent! Neo will process this instruction."

### 2. Test Viewing Responses
1. Click the same agent again
2. Click "Responses" tab
3. Should see "⏳ Awaiting response from Neo..." with typing animation

### 3. Test Neo Checking Instructions
From Neo's terminal:
```bash
cd /Volumes/Fast\ Storage/neo_code_repos/robspain-com/
./scripts/process-agent-instructions.sh
```

Should output:
```
Found 1 pending instruction(s):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent: Writer
ID: 1707694800000
Time: 2026-02-11T23:50:00.000Z
Instruction:
Write a test blog post
```

### 4. Test Neo Responding
```bash
./scripts/agent-respond.sh "Writer" "Working on your test blog post now!" "1707694800000"
```

Should output:
```
✓ Response sent to Writer (ID: 1707694801000)
```

### 5. Verify Response in Frontend
1. Go back to robspain.com/admin/agents/
2. Click Writer
3. Click Responses tab
4. Should see Neo's message with timestamp

## API Testing (Manual)

### Send Instruction
```bash
curl -X POST https://robspain.com/api/agent-instruct \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b" \
  -d '{
    "agentId": "Writer",
    "instruction": "Test instruction from curl"
  }'
```

### List Pending Instructions
```bash
curl "https://robspain.com/api/agent-instructions-list?token=8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b"
```

### Send Response
```bash
curl -X POST https://robspain.com/api/agent-respond \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b" \
  -d '{
    "agentId": "Writer",
    "message": "This is a test response",
    "from": "Neo"
  }'
```

### Get Responses
```bash
curl "https://robspain.com/api/agent-responses?agentId=Writer&token=8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b"
```

## Troubleshooting

### Frontend Issues

**Modal doesn't open:**
- Check browser console for errors
- Verify the agent click detection is working

**"Failed to send instruction" error:**
- Check Network tab in DevTools
- Verify the API endpoint is deployed on Netlify
- Check token is correct

**Responses tab shows error:**
- Verify `/api/agent-responses` is deployed
- Check Network tab for 401/404 errors

### API Issues

**401 Unauthorized:**
- Token mismatch or not provided
- Check ADMIN_TOKEN constant in function files

**404 Not Found:**
- Functions not deployed yet
- Run: `netlify deploy --prod` or trigger via git push

**500 Internal Server Error:**
- Check Netlify Function logs
- Verify @netlify/blobs is installed

### Script Issues

**"command not found: jq":**
- Install jq: `brew install jq`

**"Error fetching instructions":**
- Check SITE_URL is correct (default: https://robspain.com)
- Verify token is valid
- Check network connectivity

## Netlify Deploy

After pushing to git, Netlify should auto-deploy. Check:
1. https://app.netlify.com/sites/robspain-com/deploys
2. Wait for build to complete
3. Verify functions are listed in Functions tab

Or manually deploy:
```bash
cd /Volumes/Fast\ Storage/neo_code_repos/robspain-com/
netlify deploy --prod
```

## Next Steps for Neo

### Add to HEARTBEAT.md
```markdown
## Agent HQ Check (2x/day)
- [ ] `bash ~/robspain-com/scripts/process-agent-instructions.sh`
- [ ] Spawn sub-agents for any pending instructions
- [ ] Send acknowledgment responses
```

### Integration Ideas
- Add to heartbeat rotation (check every 4-6 hours)
- Notify Rob via Telegram when instructions are processed
- Auto-spawn sub-agents based on agent type
- Log instruction/response activity in daily memory
