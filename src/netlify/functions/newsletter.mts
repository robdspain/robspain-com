import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface NewsletterRequest {
  email: string;
  name?: string;
  source?: string;
}

const DEFAULT_CONVEX_URL = "https://quixotic-fox-157.convex.cloud";

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

    const { email, name, source } = request;

    if (!email || !email.includes("@")) {
      return json(400, { error: "Valid email required" });
    }

    const convexUrl = (
      process.env.NEWSLETTER_CONVEX_URL ||
      process.env.CONVEX_URL ||
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      DEFAULT_CONVEX_URL
    ).replace(/\/$/, "");

    const convexResponse = await fetch(`${convexUrl}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "newsletter:subscribeToNewsletter",
        args: {
          email: email.toLowerCase().trim(),
          source: source || "robspain-blog",
          name: name || undefined,
          tags: ["robspain.com", "school-bcba-systems-letter"],
        },
      }),
    });

    if (!convexResponse.ok) {
      const errorText = await convexResponse.text();
      console.error("Convex error:", errorText);
      return json(convexResponse.status, { error: "Failed to subscribe" });
    }

    const result = await convexResponse.json().catch(() => ({}));

    return json(200, {
      success: true,
      isNew: result?.value?.isNew ?? true,
      message: "Successfully subscribed",
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    return json(500, { error: "Failed to subscribe" });
  }
};

export { handler };
