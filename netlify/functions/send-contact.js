// Netlify Function: send-contact
// Sends contact form submissions through Mailgun using environment variables.

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_TO_EMAIL } = process.env;

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_TO_EMAIL) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured. Missing Mailgun env vars.' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const subject = String(payload.subject || '').trim() || 'New Contact Form Submission';
  const message = String(payload.message || '').trim();

  if (!name || !email || !message) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields: name, email, message' }),
    };
  }

  const fromAddress = `Website Contact <postmaster@${MAILGUN_DOMAIN}>`;
  const textBody = `New message from robspain.com\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`;
  const htmlBody = `
    <p><strong>New message from robspain.com</strong></p>
    <p><strong>Name:</strong> ${escapeHtml(name)}<br>
    <strong>Email:</strong> ${escapeHtml(email)}<br>
    <strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
  `;

  const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
  const body = new URLSearchParams({
    from: fromAddress,
    to: MAILGUN_TO_EMAIL,
    subject,
    text: textBody,
    html: htmlBody,
    'h:Reply-To': email,
  });

  try {
    const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Mailgun error', details: data }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unexpected error', details: String(err) }),
    };
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

