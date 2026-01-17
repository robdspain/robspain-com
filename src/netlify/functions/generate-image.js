// src/netlify/functions/generate-image.js
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
    const { title, keywords } = JSON.parse(event.body || '{}');

    // Step 1: Use Gemini to write a high-quality Image Generation Prompt
    const promptRequest = `
      You are a professional creative director. Write a highly detailed, photorealistic image generation prompt for a blog post featured image.
      The blog is about: ${title}
      Keywords: ${keywords.join(', ')}
      
      Style: Modern, professional, clean, soft natural lighting, high-quality photography. 
      Avoid: Text, words, blurry faces, or cartoonish styles.
      Focus on: Educational settings, behavioral science concepts, or professional consultation metaphors.

      Return ONLY the descriptive prompt text, no other conversation.
    `;

    const result = await model.generateContent(promptRequest);
    const imagePrompt = (await result.response).text().trim();

    // Step 2: Return the Pollinations.ai URL with the generated prompt
    // We encode the prompt to make it URL safe
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(imagePrompt)}?width=1200&height=630&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, prompt: imagePrompt }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
