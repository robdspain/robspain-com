// src/netlify/functions/generate-seo.js
const { OpenAI } = require("openai");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { OPENAI_API_KEY } = process.env;
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing OPENAI_API_KEY environment variable" }),
    };
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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
      Post Content: ${body.substring(0, 2000)} // Limiting to first 2000 chars

      Return the result ONLY as a JSON object with the keys: metaTitle, metaDesc, keywords (as an array), and excerpt.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: response.choices[0].message.content,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
