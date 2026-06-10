// src/netlify/functions/generate-newsletter.js
// Newsletter generator from YouTube scripts and companion blog drafts.
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable" }),
    };
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const {
      title,
      youtubeUrl,
      blog,
      script,
      videoType
    } = JSON.parse(event.body || '{}');

    if (!script && !blog && !title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Script, blog draft, or title is required" }),
      };
    }

    const systemPrompt = `You write Rob Spain's newsletter for school-based BCBAs and special education professionals.

ABOUT ROB:
- Board Certified Behavior Analyst with 20+ years in schools
- Founder of Behavior School
- Voice: practical, warm, direct, systems-focused, evidence-informed
- Audience: school BCBAs, behavior analysts, special education leaders, school psychologists

NEWSLETTER GOAL:
Turn one YouTube video and blog draft into a useful email that can also point readers back to the video and website.

REQUIREMENTS:
- Give 3 subject line options
- Give preview text under 110 characters
- Keep the body under 500 words
- Lead with the practitioner problem, not promotion
- Include 3-5 practical takeaways
- Include one clear CTA to watch/read using [LINK]
- Include a short P.S. pointing to Behavior School when relevant
- Avoid hype and generic productivity advice`;

    const blogContext = blog?.body
      ? `BLOG DRAFT:\n${blog.body.substring(0, 4000)}`
      : '';
    const scriptContext = script
      ? `SCRIPT/CONTENT:\n${typeof script === 'object' ? JSON.stringify(script, null, 2).substring(0, 4000) : String(script).substring(0, 4000)}`
      : '';

    const userPrompt = `Create the newsletter draft for this YouTube-first content item.

TITLE: ${title || blog?.frontmatter?.title || 'Untitled'}
VIDEO TYPE: ${videoType || 'insight'}
YOUTUBE URL: ${youtubeUrl || '[LINK]'}

${blogContext}

${scriptContext}

Return JSON in this exact structure:
{
  "title": "Internal newsletter title",
  "subjectLines": ["subject 1", "subject 2", "subject 3"],
  "previewText": "Preview text under 110 characters",
  "body": "Markdown email body under 500 words. Include [LINK] where the video/blog link belongs.",
  "ps": "Short P.S. with Behavior School CTA",
  "ctaUrl": "${youtubeUrl || '[LINK]'}"
}

Return ONLY valid JSON. No markdown code fences, no commentary.`;

    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will produce a concise newsletter draft in valid JSON.' }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ]);

    const text = result.response.text();
    const cleanedJson = text.replace(/```json|```/gi, '').trim();

    let newsletter;
    try {
      newsletter = JSON.parse(cleanedJson);
    } catch (parseError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to parse generated newsletter",
          raw: cleanedJson.substring(0, 500)
        }),
      };
    }

    if (youtubeUrl) {
      newsletter.body = (newsletter.body || '').replace(/\[LINK\]/g, youtubeUrl);
      newsletter.ctaUrl = newsletter.ctaUrl || youtubeUrl;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        newsletter
      }),
    };
  } catch (error) {
    console.error('Generate newsletter error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
