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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const { title, body } = JSON.parse(event.body || '{}');

    if (!title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Title is required" }),
      };
    }

    const prompt = `You are a social media and SEO expert for a School BCBA (Board Certified Behavior Analyst) blog focused on behavior analysis in schools, PBIS, supervision, and professional development.

Based on the following blog post, generate optimized content for SEO and each social media platform:

Post Title: ${title}
Post Content: ${(body || '').substring(0, 4000)}

Generate ALL of the following (return as JSON):

1. **tags**: Array of 3-6 tags from: school-bcba, burnout-prevention, systems-thinking, behavior-analysis, pbis, supervision, data-collection, iep-goals, professional-development, classroom-management, staff-training, compliance

2. **keywords**: Array of 5-8 SEO keywords/phrases

3. **metaTitle**: Google title (max 60 chars) with primary keyword

4. **metaDesc**: Google description (max 155 chars) with call-to-action

5. **excerpt**: 2-3 sentence blog summary that hooks readers

6. **twitter**: Object with:
   - "text": Engaging tweet (max 200 chars to leave room for link). Use conversational tone, ask questions or share insights. Include 1-2 emojis.
   - "hashtags": String of 3-4 hashtags like "#BCBA #SchoolBehavior #Education"

7. **facebook**: Object with:
   - "text": Engaging post (80-150 chars). Start with hook/question. Conversational, relatable tone. Can include emojis.

8. **linkedin**: Object with:
   - "text": Professional post (150-250 chars). Share key insight or statistic. Thought-leadership tone.
   - "hashtags": String of 3-5 professional hashtags like "#BehaviorAnalysis #Education #Leadership"

9. **instagram**: Object with:
   - "text": Engaging caption (200-300 chars). Start with hook, include emojis, end with call-to-action.
   - "hashtags": String of 15-20 relevant hashtags for maximum reach (mix of popular and niche)

Return ONLY raw JSON (no markdown, no backticks) with keys: tags, keywords, metaTitle, metaDesc, excerpt, twitter, facebook, linkedin, instagram`;

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