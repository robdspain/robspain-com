/**
 * Agent Webhook — Receives real-time events from OpenClaw
 * 
 * POST /api/agent-webhook
 * Headers: Authorization: Bearer <AGENT_WEBHOOK_TOKEN>
 * Body: { event: string, agent?: string, data?: object }
 * 
 * Events:
 * - task_start: Agent started a task
 * - task_complete: Agent completed a task
 * - task_blocked: Agent hit a blocker
 * - handoff: Agent passed work to another
 * - meeting: Agents in a sync meeting
 * - coffee: Agent taking a break
 * - idle: Agent waiting for work
 */

const { getStore, connectLambda } = require('@netlify/blobs');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'POST only' }) };
  }

  // Auth check
  const token = process.env.AGENT_WEBHOOK_TOKEN;
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!token || auth !== `Bearer ${token}`) {
    return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Parse payload
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { event: eventType, agent, data } = payload;
  if (!eventType) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing event type' }) };
  }

  // Initialize Blobs context for Lambda-compatible functions
  connectLambda(event);

  // Get store
  const store = getStore('agent-activity');

  try {
    // Load current activity
    let activityRaw = await store.get('agent-activity');
    let activity = activityRaw ? JSON.parse(activityRaw) : getDefaultActivity();

    // Update based on event
    const timestamp = new Date().toISOString();
    const timeShort = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    switch (eventType) {
      case 'task_start':
        if (agent && activity.agents[agent]) {
          activity.agents[agent].status = 'working';
          activity.agents[agent].task = data?.task || 'Working on task';
          activity.agents[agent].blocker = null;
          activity.agents[agent].lastRun = timeShort;
        }
        break;

      case 'task_complete':
        if (agent && activity.agents[agent]) {
          activity.agents[agent].status = 'idle';
          activity.agents[agent].task = null;
          activity.agents[agent].lastRun = timeShort;
        }
        activity.recentActivity.unshift({
          time: timeShort,
          agent: agent || 'System',
          action: `✅ Completed: ${data?.task || 'task'}`,
        });
        break;

      case 'task_blocked':
        if (agent && activity.agents[agent]) {
          activity.agents[agent].status = 'blocked';
          activity.agents[agent].blocker = data?.reason || 'Unknown blocker';
          activity.agents[agent].blockedBy = data?.blockedBy || null;
        }
        // Add to blocked queue
        activity.blockedQueue = activity.blockedQueue || [];
        activity.blockedQueue.unshift({
          id: `blocked-${Date.now()}`,
          priority: data?.priority || 'MEDIUM',
          text: data?.reason || 'Blocker',
          type: 'blocker',
          agent: agent,
          sla: data?.sla || null,
        });
        break;

      case 'waiting_human':
        if (agent && activity.agents[agent]) {
          activity.agents[agent].status = 'waiting';
          activity.agents[agent].task = data?.question || 'Waiting for human input';
        }
        // Add to blocked queue as decision
        activity.blockedQueue = activity.blockedQueue || [];
        activity.blockedQueue.unshift({
          id: `decision-${Date.now()}`,
          priority: data?.priority || 'HIGH',
          text: data?.question || 'Needs decision',
          type: 'decision',
          agent: agent,
        });
        break;

      case 'handoff':
        if (data?.from && data?.to) {
          activity.handoffs = activity.handoffs || [];
          activity.handoffs.push({
            agents: [data.from, data.to],
            topic: data?.topic || 'Task handoff',
            status: 'passing',
            timestamp,
          });
          // Update agent statuses
          if (activity.agents[data.from]) {
            activity.agents[data.from].status = 'idle';
          }
          if (activity.agents[data.to]) {
            activity.agents[data.to].status = 'working';
            activity.agents[data.to].task = data?.topic || 'Received handoff';
          }
        }
        break;

      case 'meeting':
        activity.handoffs = activity.handoffs || [];
        activity.handoffs.push({
          agents: data?.agents || [],
          topic: data?.topic || 'Sync meeting',
          status: 'meeting',
          timestamp,
        });
        break;

      case 'deployed':
        if (agent && activity.agents[agent]) {
          activity.agents[agent].status = 'deployed';
          activity.agents[agent].task = data?.deployment || 'Deployed to production';
        }
        activity.recentActivity.unshift({
          time: timeShort,
          agent: agent || 'System',
          action: `🚀 Deployed: ${data?.deployment || 'changes'}`,
        });
        break;

      case 'error':
        activity.recentActivity.unshift({
          time: timeShort,
          agent: agent || 'System',
          action: `❌ Error: ${data?.message || 'Unknown error'}`,
        });
        break;

      default:
        // Generic activity log
        activity.recentActivity.unshift({
          time: timeShort,
          agent: agent || 'System',
          action: data?.message || eventType,
        });
    }

    // Trim activity log to last 50 items
    activity.recentActivity = (activity.recentActivity || []).slice(0, 50);
    // Trim handoffs to last 10
    activity.handoffs = (activity.handoffs || []).slice(0, 10);
    // Trim blocked queue to last 20
    activity.blockedQueue = (activity.blockedQueue || []).slice(0, 20);

    // Save updated activity
    await store.set('agent-activity', JSON.stringify(activity));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, event: eventType, agent }),
    };
  } catch (e) {
    console.error('Webhook error:', e);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: String(e) }),
    };
  }
};

function getDefaultActivity() {
  return {
    agents: {
      Neo: { status: 'idle', task: null, blocker: null, lastRun: null, queueDepth: 0 },
      Scout: { status: 'idle', task: null, blocker: null, lastRun: null, queueDepth: 0 },
      Pixel: { status: 'idle', task: null, blocker: null, lastRun: null, queueDepth: 0 },
      Scribe: { status: 'idle', task: null, blocker: null, lastRun: null, queueDepth: 0 },
      Archie: { status: 'idle', task: null, blocker: null, lastRun: null, queueDepth: 0 },
      DataDog: { status: 'idle', task: null, blocker: null, lastRun: null, queueDepth: 0 },
    },
    recentActivity: [],
    handoffs: [],
    blockedQueue: [],
  };
}
