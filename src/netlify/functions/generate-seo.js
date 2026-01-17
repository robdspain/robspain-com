// src/netlify/functions/generate-seo.js
const { GoogleGenAI } = require("@google/genai");

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

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  // Using the latest Gemini 2.0 Flash model
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const { title, body } = JSON.parse(event.body || '{}');

    const prompt = `
      You are an SEO expert for a School BCBA and Behavior Specialist. 
      Based on the following blog post title and content, generate:
      1. A highly optimized Meta Title (max 60 chars)
      2. A compelling Meta Description (max 160 chars)
      3. A list of 5-8 relevant SEO keywords.
      4. A short 2-sentence excerpt for the blog list.

      Post Title: ${title}
      Post Content: ${body.substring(0, 4000)}

      Return the result ONLY as a raw JSON object string (no markdown formatting, no backticks) with the keys: metaTitle, metaDesc, keywords (as an array), and excerpt.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const cleanedJson = text.replace(/```json|```/gi, '').trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: cleanedJson,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};