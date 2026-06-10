import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface NewsletterRequest {
  email: string;
  source?: string;
}

const CONVEX_URL = "https://third-loris-453.convex.cloud";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { email, source } = JSON.parse(event.body || "{}") as NewsletterRequest;

    if (!email || !email.includes("@")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Valid email required" }),
      };
    }

    // Add to Convex CRM
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
      // Don't fail - still try Resend
    }

    // Also send welcome via Resend if configured
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

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Newsletter error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to subscribe" }),
    };
  }
};

export { handler };
