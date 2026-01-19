// src/netlify/functions/generate-seo.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable" }),
    };
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const { title, body } = JSON.parse(event.body || '{}');

    if (!title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Title is required" }),
      };
    }

    const prompt = `You are an SEO expert for a School BCBA (Board Certified Behavior Analyst) and Behavior Specialist blog focused on behavior analysis in schools, PBIS, supervision, and professional development.

Based on the following blog post title and content, generate ALL of the following:

1. **tags**: An array of 3-6 relevant category tags. Choose from these preferred tags when applicable: school-bcba, burnout-prevention, systems-thinking, behavior-analysis, pbis, supervision, data-collection, iep-goals, professional-development, classroom-management, staff-training, compliance. Only add custom tags if none of the preferred tags fit.

2. **keywords**: An array of 5-8 specific SEO keywords/phrases that people would search for.

3. **metaTitle**: A highly optimized title for Google (max 60 characters). Should be compelling and include primary keyword.

4. **metaDesc**: A compelling meta description for Google results (max 155 characters). Should include a call-to-action or value proposition.

5. **excerpt**: A 2-3 sentence summary for the blog listing page that hooks the reader.

6. **socialCaption**: A ready-to-post Twitter/LinkedIn caption (max 280 characters) with 2-3 relevant hashtags. Make it engaging and shareable.

Post Title: ${title}
Post Content: ${(body || '').substring(0, 4000)}

Return ONLY a raw JSON object (no markdown, no backticks, no explanation) with these exact keys: tags, keywords, metaTitle, metaDesc, excerpt, socialCaption`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean any markdown formatting that might slip through
    const cleanedJson = text.replace(/```json|```/gi, '').trim();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: cleanedJson,
    };
  } catch (error) {
    console.error('Generate SEO error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};