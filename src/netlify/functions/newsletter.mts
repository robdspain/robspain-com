import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface NewsletterRequest {
  email: string;
  source?: string;
}

const CONVEX_URL = "https://third-loris-453.convex.cloud";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
};

function json(statusCode: number, payload: Record<string, unknown>) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  };
}

function parseNewsletterRequest(body: string | null): NewsletterRequest | null {
  if (!body) return {} as NewsletterRequest;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed as NewsletterRequest : null;
  } catch {
    return null;
  }
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: jsonHeaders, body: "" };
  }

  if (event.httpMethod === "GET") {
    return json(200, {
      success: true,
      status: "ok",
      service: "newsletter",
      analytics: {
        configured: false,
        message: "Newsletter analytics are not connected to a live provider yet.",
      },
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const request = parseNewsletterRequest(event.body);
    if (!request) {
      return json(400, { error: "Invalid JSON body" });
    }

    const { email, source } = request;

    if (!email || !email.includes("@")) {
      return json(400, { error: "Valid email required" });
    }

    const convexResponse = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "newsletter:subscribe",
        args: {
          email: email.toLowerCase().trim(),
          source: source || "robspain-blog",
          firstName: null,
        },
      }),
    });

    if (!convexResponse.ok) {
      console.error("Convex error:", await convexResponse.text());
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Rob Spain <rob@robspain.com>",
            to: email,
            subject: "Welcome to the newsletter!",
            text: `Hi,

Thanks for subscribing to my newsletter!

You'll receive weekly tips on evidence-based behavior analysis for school settings. No fluff, just practical strategies you can use immediately.

If you have questions or topics you'd like me to cover, just reply to this email.

— Rob Spain, BCBA
https://robspain.com`,
          }),
        });
      } catch (e) {
        console.error("Resend error:", e);
      }
    }

    return json(200, { success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return json(500, { error: "Failed to subscribe" });
  }
};

export { handler };
