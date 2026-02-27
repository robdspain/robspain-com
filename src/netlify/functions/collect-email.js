/**
 * collect-email.js
 * Handles video funnel email opt-ins.
 * Sends a welcome email via Resend and optionally pings Telegram.
 */

const ipToHits = new Map();
const RATE_LIMIT_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipToHits.get(ip);
  if (!entry) { ipToHits.set(ip, { count: 1, windowStart: now }); return false; }
  if (now - entry.windowStart > RATE_LIMIT_MS) { ipToHits.set(ip, { count: 1, windowStart: now }); return false; }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

async function sendWelcomeEmail(email, name) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const firstName = name ? name.split(' ')[0] : 'there';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: 'Rob Spain <rob@robspain.com>',
      to: email,
      subject: "Your free training is unlocked",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
          <p>Hi ${firstName},</p>
          <p>I'm glad you're in. The rest of the video series is now unlocked for you — including the 10-Minute Staff Script from Video 4.</p>
          <p><strong>Go back and keep watching:</strong><br>
          <a href="https://robspain.com/free-training/" style="color:#10B981;">robspain.com/free-training</a></p>
          <p>The system I walk through in Videos 5–10 is the same one I've used to help school BCBAs cut their "crisis call" volume by 40% or more. Start with Video 5 — it's the map for everything.</p>
          <p>If you have questions, just reply to this email.</p>
          <p>— Rob Spain, BCBA, IBA</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:2rem 0;">
          <p style="font-size:0.75rem;color:#94a3b8;">You opted in at robspain.com/free-training. <a href="https://robspain.com/unsubscribe" style="color:#94a3b8;">Unsubscribe</a>.</p>
        </div>
      `,
    }),
  });
}

async function notifyTelegram(email, source) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || '8181098703';
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `New video funnel opt-in\nEmail: ${email}\nSource: ${source}`,
    }),
  }).catch(() => {});
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'Too many requests.' }) };
  }

  let email, source, name;
  try {
    ({ email, source = 'unknown', name = '' } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid email address' }) };
  }

  try {
    // Fire welcome email + Telegram notification in parallel (non-blocking)
    await Promise.allSettled([
      sendWelcomeEmail(email, name),
      notifyTelegram(email, source),
    ]);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, message: 'Subscribed!' }),
    };
  } catch (err) {
    console.error('collect-email error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server error' }) };
  }
};
