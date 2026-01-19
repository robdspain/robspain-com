// src/netlify/functions/generate-image.js
const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable" }),
    };
  }

  try {
    const { title, keywords, body } = JSON.parse(event.body || '{}');

    if (!title) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Title is required" }),
      };
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Build a descriptive prompt for the image
    const keywordList = Array.isArray(keywords) ? keywords.join(', ') : '';
    const contentSummary = body ? body.substring(0, 500) : '';

    const imagePrompt = `Create a professional, modern blog featured image for an article about school-based behavior analysis and BCBAs.

Title: "${title}"
${keywordList ? `Topics: ${keywordList}` : ''}
${contentSummary ? `Context: ${contentSummary}` : ''}

Style requirements:
- Clean, professional, corporate-educational aesthetic
- Soft, warm lighting with a calming color palette (blues, greens, warm neutrals)
- Abstract or symbolic representation (no specific faces or identifiable people)
- Could include: school setting elements, collaboration imagery, data/charts symbols, supportive interactions
- Modern flat design or soft 3D illustration style
- 16:9 aspect ratio suitable for blog headers
- No text, logos, or watermarks`;

    // Use Imagen 3 for image generation
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: imagePrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/png'
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No image was generated. Try a different title or content.");
    }

    const generatedImage = response.generatedImages[0];
    const base64Image = generatedImage.image.imageBytes;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        base64: base64Image,
        contentType: 'image/png',
        filename: `featured-${Date.now()}.png`
      }),
    };
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Image generation failed' }),
    };
  }
};