const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COOKIE_NAME = 'court_compliance_auth';
const COOKIE_MAX_AGE = 60 * 60 * 12;
const COOKIE_PATH = '/admin';

function secret() {
  return process.env.COURT_COMPLIANCE_PASSWORD || process.env.ADMIN_API_TOKEN || '';
}

function tokenFor(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function parseCookies(header) {
  return String(header || '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf('=');
      if (index === -1) return cookies;
      cookies[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      return cookies;
    }, {});
}

function isAuthorized(event) {
  const configured = secret();
  if (!configured) return false;
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);
  const expected = tokenFor('authorized');
  const received = cookies[COOKIE_NAME] || '';
  return received.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

function loginPage(error = '') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Court Compliance Login</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f6f2ea; color: #17221d; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { width: min(92vw, 420px); background: #fffdf8; border: 1px solid #d9d1c4; border-radius: 18px; box-shadow: 0 18px 45px rgba(18,54,40,.12); padding: 2rem; }
    h1 { color: #123628; font-size: 1.65rem; line-height: 1.15; margin: 0 0 .5rem; }
    p { color: #526158; line-height: 1.5; margin: 0 0 1.25rem; }
    label { color: #334139; display: grid; font-size: .9rem; font-weight: 700; gap: .45rem; }
    input { border: 1px solid #d9d1c4; border-radius: 12px; font: inherit; padding: .85rem; }
    button { background: #1f4d3f; border: 0; border-radius: 999px; color: white; cursor: pointer; font: inherit; font-weight: 750; margin-top: 1rem; padding: .85rem 1rem; width: 100%; }
    .error { background: #fee2e2; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; margin-bottom: 1rem; padding: .75rem; }
  </style>
</head>
<body>
  <main>
    <h1>Court Compliance Tracker</h1>
    <p>This page is private. Enter the admin password to continue.</p>
    ${error ? `<div class="error">${error}</div>` : ''}
    <form method="post" action="/admin/court-compliance/">
      <label>Password
        <input name="password" type="password" autocomplete="current-password" required autofocus>
      </label>
      <button type="submit">Open tracker</button>
    </form>
  </main>
</body>
</html>`;
}

function pageHtml() {
  const candidates = [
    path.join(process.cwd(), '_site/admin/court-compliance/index.html'),
    path.join(__dirname, '../../../_site/admin/court-compliance/index.html'),
    path.join(__dirname, 'index.html')
  ];
  const file = candidates.find(candidate => fs.existsSync(candidate));
  if (!file) {
    throw new Error('Court compliance page was not bundled with the function.');
  }
  return fs.readFileSync(file, 'utf8');
}

exports.handler = async (event) => {
  const configured = secret();
  if (!configured) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      body: loginPage('Authentication is not configured. Set COURT_COMPLIANCE_PASSWORD or ADMIN_API_TOKEN in Netlify.')
    };
  }

  if (event.path.endsWith('/logout')) {
    return {
      statusCode: 302,
      headers: {
        Location: '/admin/court-compliance/',
        'Cache-Control': 'no-store'
      },
      multiValueHeaders: {
        'Set-Cookie': [
          `${COOKIE_NAME}=; Path=/admin; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
          `${COOKIE_NAME}=; Path=/admin/court-compliance; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
        ]
      },
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    const params = new URLSearchParams(event.body || '');
    const password = params.get('password') || '';
    if (password === configured) {
      return {
        statusCode: 302,
        headers: {
          Location: '/admin/court-compliance/',
          'Set-Cookie': `${COOKIE_NAME}=${encodeURIComponent(tokenFor('authorized'))}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store'
        },
        body: ''
      };
    }
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      body: loginPage('That password did not work.')
    };
  }

  if (!isAuthorized(event)) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      body: loginPage()
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'Set-Cookie': `${COOKIE_NAME}=${encodeURIComponent(tokenFor('authorized'))}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
    },
    body: pageHtml()
  };
};
