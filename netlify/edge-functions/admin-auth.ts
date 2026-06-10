const REALM = "Rob Spain Admin";

function unauthorized(message = "Authentication required") {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login Required</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{max-width:420px;padding:32px;border:1px solid rgba(148,163,184,.25);border-radius:24px;background:rgba(15,23,42,.86);box-shadow:0 24px 80px rgba(0,0,0,.35)}h1{margin:0 0 10px;font-size:28px;color:white}.dot{color:#10b981}.muted{color:#94a3b8;line-height:1.6}.small{font-size:13px;color:#64748b;margin-top:18px}</style></head>
<body><main class="card"><h1><span class="dot">●</span> Rob Spain Admin</h1><p class="muted">${message}</p><p class="small">Use the browser login prompt to continue. If you were trying to log out, close this tab after the prompt appears.</p></main></body></html>`, {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export default async (request: Request, context: any) => {
  const url = new URL(request.url);

  if (url.pathname === "/admin/logout" || url.pathname === "/admin/logout/") {
    return unauthorized("Logged out of the admin area. Your browser may ask for credentials again if you reopen an admin page.");
  }

  const expectedUser = Deno.env.get("ADMIN_AUTH_USER");
  const expectedPassword = Deno.env.get("ADMIN_AUTH_PASSWORD");

  if (!expectedUser || !expectedPassword) {
    return new Response("Admin auth is not configured. Set ADMIN_AUTH_USER and ADMIN_AUTH_PASSWORD in Netlify environment variables.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return unauthorized();

  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch (_err) {
    return unauthorized("Invalid credentials format.");
  }

  const separator = decoded.indexOf(":");
  if (separator < 0) return unauthorized();

  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  if (!timingSafeEqual(username, expectedUser) || !timingSafeEqual(password, expectedPassword)) {
    return unauthorized("Invalid admin credentials.");
  }

  const response = await context.next();
  const guarded = new Response(response.body, response);
  guarded.headers.set("Cache-Control", "private, no-store");
  guarded.headers.set("X-RobSpain-Admin-Auth", "basic");
  return guarded;
};
