// Netlify Function: send-contact
// Sends contact form submissions through Mailgun using environment variables.

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_TO_EMAIL } = process.env;

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_TO_EMAIL) {
    const missing = [];
    if (!MAILGUN_API_KEY) missing.push('MAILGUN_API_KEY');
    if (!MAILGUN_DOMAIN) missing.push('MAILGUN_DOMAIN');
    if (!MAILGUN_TO_EMAIL) missing.push('MAILGUN_TO_EMAIL');
    
    console.error('Missing env vars:', missing.join(', '));
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Server not configured', 
        missing: missing,
        context: process.env.NODE_ENV || 'unknown'
      }),
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

    const responseText = await res.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    if (!res.ok) {
      console.error('Mailgun error response:', responseText);
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Mailgun error', 
          status: res.status,
          details: data 
        }),
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
