const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COOKIE_NAME = 'robspain_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(value) {
  const secret = process.env.ADMIN_AUTH_PASSWORD || process.env.GOOGLE_CLIENT_SECRET || process.env.JWT_SECRET;
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function parseCookies(header) {
  return Object.fromEntries(
    String(header || '').split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf('=');
      if (index === -1) return [part, ''];
      return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    })
  );
}

function isEmailAllowed(email) {
  if (!email) return false;
  const allowedStr = (process.env.ADMIN_ALLOWED_EMAIL || process.env.ADMIN_AUTH_USER || 'robspain@gmail.com').toLowerCase();
  const allowedList = allowedStr.split(',').map((e) => e.trim()).filter(Boolean);
  return allowedList.includes(email.toLowerCase());
}

function allowedEmailsDescription() {
  const allowedStr = (process.env.ADMIN_ALLOWED_EMAIL || process.env.ADMIN_AUTH_USER || 'robspain@gmail.com').toLowerCase();
  const allowedList = allowedStr.split(',').map((e) => e.trim()).filter(Boolean);
  if (allowedList.length === 1) {
    return 'as ' + allowedList[0];
  }
  return 'with an authorized Google account';
}

function createSession(email) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = base64url(JSON.stringify({ email: email.toLowerCase(), exp: expires }));
  return payload + '.' + sign(payload);
}

function readSession(event) {
  const cookie = parseCookies(event.headers.cookie || event.headers.Cookie)[COOKIE_NAME];
  if (!cookie) return null;

  const parts = cookie.split('.');
  const payload = parts[0];
  const signature = parts[1];
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.email || !isEmailAllowed(session.email)) return null;
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

function headers(extra) {
  return Object.assign({
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  }, extra || {});
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function loginPage(error) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const errorHtml = error ? '<p class="error">' + escapeHtml(error) + '</p>' : '';
  return '<!doctype html>' +
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Admin Login</title><script src="https://accounts.google.com/gsi/client" async defer></script>' +
    '<style>' +
    ':root{color-scheme:light}' +
    'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f1e8;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#173b2a}' +
    '.card{width:min(560px,calc(100vw - 32px));padding:42px;border:1px solid rgba(23,59,42,.14);border-radius:18px;background:rgba(255,255,250,.9);box-shadow:0 24px 70px rgba(23,59,42,.12);text-align:center}' +
    'h1{margin:0 0 14px;font-size:clamp(30px,5vw,40px);line-height:1.05;letter-spacing:0;text-align:left}' +
    'p{margin:0 0 28px;color:#46584e;font-size:18px;line-height:1.45;text-align:left}' +
    '.google-wrap{display:flex;justify-content:center}' +
    '.fallback-wrap{display:flex;justify-content:center;margin-top:10px}' +
    '.fallback-btn{display:inline-flex;align-items:center;justify-content:center;gap:12px;width:100%;max-width:280px;height:40px;border:1px solid #dadce0;border-radius:20px;background:#ffffff;color:#3c4043;font-family:inherit;font-size:14px;font-weight:600;text-decoration:none;transition:background .2s,border-color .2s;box-shadow:0 1px 2px 0 rgba(60,64,67,0.3),0 1px 3px 1px rgba(60,64,67,0.15);cursor:pointer}' +
    '.fallback-btn:hover{background:#f8f9fa;border-color:#d2e3fc}' +
    '.google-icon-svg{width:18px;height:18px;background:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="%23EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="%234285F4" d="M46.5 24c0-1.63-.15-3.2-.42-4.73H24v9h12.75c-.55 2.87-2.17 5.3-4.61 6.93l7.2 5.58C43.5 36.42 46.5 30.72 46.5 24z"/><path fill="%23FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/><path fill="%2334A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.2-5.58c-2.12 1.39-4.8 2.29-8.69 2.29-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>\') no-repeat center;background-size:contain}' +
    '.error{margin:0 0 20px;color:#b42318;font-size:15px;text-align:left}' +
    '</style>' +
    '</head><body><main class="card"><h1>Rob Spain Admin</h1><p>Sign in with Google ' + escapeHtml(allowedEmailsDescription()) + ' to continue.</p>' + errorHtml +
    '<div id="g_id_onload" data-client_id="' + escapeHtml(clientId) + '" data-callback="handleCredentialResponse" data-auto_prompt="false"></div>' +
    '<div class="google-wrap"><div class="g_id_signin" data-type="standard" data-size="large" data-theme="outline" data-text="continue_with" data-shape="pill" data-logo_alignment="right"></div></div>' +
    '<div id="fallback-wrap" class="fallback-wrap"><a id="fallback-login-link" href="#" class="fallback-btn"><span class="google-icon-svg"></span><span>Continue with Google</span></a></div>' +
    '</main><script>' +
    'const clientId = "' + escapeHtml(clientId) + '";' +
    'const redirectUri = window.location.origin + window.location.pathname;' +
    'const nonce = Math.random().toString(36).substring(2);' +
    'const oauthUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=" + encodeURIComponent(clientId) + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&response_type=id_token&scope=openid%20email&nonce=" + nonce;' +
    'document.getElementById("fallback-login-link").href = oauthUrl;' +
    'const params = new URLSearchParams(window.location.hash.substring(1));' +
    'const idToken = params.get("id_token");' +
    'if (idToken) {' +
    '  window.location.hash = "";' +
    '  handleCredentialResponse({ credential: idToken });' +
    '}' +
    'setTimeout(() => {' +
    '  const sdkButton = document.querySelector(".g_id_signin iframe");' +
    '  if (sdkButton) {' +
    '    document.getElementById("fallback-wrap").style.display = "none";' +
    '  } else {' +
    '    document.getElementById("fallback-wrap").style.display = "flex";' +
    '  }' +
    '}, 1500);' +
    'async function handleCredentialResponse(response){' +
    '  const result=await fetch(window.location.href,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({credential:response.credential})});' +
    '  if(result.ok){window.location.reload();return;}' +
    '  const message=await result.text();' +
    '  document.body.innerHTML="<main class=\\"card\\"><h1>Admin Login</h1><p class=\\"error\\">"+message.replace(/[&<>\\\"\\\']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","\\\'":"&#39;"}[c];})+"</p><p><a href=\\""+window.location.pathname+"\\">Try again</a></p></main>";' +
    '}' +
    '</script></body></html>';
}

async function verifyCredential(credential) {
  if (!credential) throw new Error('Missing Google credential.');
  const response = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
  const token = await response.json();
  if (!response.ok || token.error) throw new Error(token.error_description || token.error || 'Google rejected the credential.');
  if (token.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('Google credential was issued for a different client.');
  if (!token.email_verified || !isEmailAllowed(token.email)) throw new Error('Access denied for ' + (token.email || 'this Google account') + '.');
  return token.email;
}

function requestedAdminPath(event) {
  const queryPath = event.queryStringParameters && event.queryStringParameters.path;
  if (queryPath) return '/' + queryPath.replace(/^\/+/, '');
  const rawPath = event.path || '/admin';
  if (rawPath.startsWith('/.netlify/functions/admin-gate')) return '/dashboard/';
  return rawPath.replace(/^\/admin/, '') || '/';
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.yml': 'application/x-yaml; charset=utf-8',
    '.yaml': 'application/x-yaml; charset=utf-8',
  }[ext] || 'application/octet-stream';
}

function adminRoots() {
  return [
    path.join(process.cwd(), '_site', 'admin'),
    path.join(__dirname, '..', '..', '..', '_site', 'admin'),
    path.join(__dirname, '_site', 'admin'),
  ];
}

function resolveAdminFile(adminPath) {
  const clean = decodeURIComponent(adminPath.split('?')[0]).replace(/^\/+/, '');
  if (clean.includes('..') || path.isAbsolute(clean)) return null;
  for (const root of adminRoots()) {
    const base = path.resolve(root);
    const candidates = [];
    const exact = path.resolve(base, clean);
    candidates.push(exact);
    candidates.push(path.resolve(base, clean, 'index.html'));
    if (!path.extname(clean)) candidates.push(path.resolve(base, clean + '.html'));
    for (const candidate of candidates) {
      if (!candidate.startsWith(base + path.sep) && candidate !== base) continue;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return null;
}

function serveAdminFile(event) {
  const filePath = resolveAdminFile(requestedAdminPath(event));
  if (!filePath) {
    return { statusCode: 404, headers: headers({ 'Content-Type': 'text/plain; charset=utf-8' }), body: 'Admin file not found.' };
  }
  const body = fs.readFileSync(filePath);
  const type = contentType(filePath);
  const binary = !/^text\/|application\/(javascript|json|x-yaml)/.test(type);
  return { statusCode: 200, headers: headers({ 'Content-Type': type }), body: binary ? body.toString('base64') : body.toString('utf8'), isBase64Encoded: binary };
}

exports.handler = async (event) => {
  if (requestedAdminPath(event).replace(/\/+$/, '') === '/logout') {
    return {
      statusCode: 302,
      headers: headers({
        Location: '/admin/',
        'Set-Cookie': COOKIE_NAME + '=; Path=/admin; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
      }),
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const email = await verifyCredential(body.credential);
      const cookie = COOKIE_NAME + '=' + encodeURIComponent(createSession(email)) + '; Path=/admin; Max-Age=' + SESSION_TTL_SECONDS + '; HttpOnly; Secure; SameSite=Lax';
      return { statusCode: 204, headers: headers({ 'Set-Cookie': cookie }), body: '' };
    } catch (error) {
      return { statusCode: 401, headers: headers({ 'Content-Type': 'text/plain; charset=utf-8' }), body: error.message };
    }
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return { statusCode: 500, headers: headers({ 'Content-Type': 'text/plain; charset=utf-8' }), body: 'Missing GOOGLE_CLIENT_ID.' };
  }
  if (!readSession(event)) {
    return { statusCode: 200, headers: headers({ 'Content-Type': 'text/html; charset=utf-8' }), body: loginPage() };
  }
  return serveAdminFile(event);
};
