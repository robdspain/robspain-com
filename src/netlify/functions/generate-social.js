// src/netlify/functions/generate-social.js
// Social Media Content Generator from YouTube Scripts
const { GoogleGenerativeAI } = require("@google/generative-ai");

const PLATFORM_CONFIGS = {
  twitter: {
    name: 'Twitter/X',
    maxLength: 280,
    hashtagLimit: 3,
    style: 'Punchy, conversational, direct. Include hook and link. Use line breaks sparingly.'
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    optimalLength: '150-300',
    hashtagLimit: 5,
    style: 'Professional but warm. Start with a hook, share insight, end with question or CTA. Line breaks for readability.'
  },
  facebook: {
    name: 'Facebook',
    maxLength: 500,
    optimalLength: '40-80',
    style: 'Conversational, engaging. Ask a question or share relatable moment. Emojis optional but sparingly.'
  },
  instagram: {
    name: 'Instagram',
    maxLength: 2200,
    hashtagLimit: 30,
    style: 'Engaging caption with hook. Emojis encouraged. Story-driven. Hashtags in separate block at end.'
  }
};

exports.handler = async (event) => {
  // CORS preflight
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
      script,
      videoType,
      platforms = ['twitter', 'linkedin']
    } = JSON.parse(event.body || '{}');

    if (!script && !title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Script or title is required" }),
      };
    }

    const systemPrompt = `You are a social media content expert for Rob Spain, a Board Certified Behavior Analyst (BCBA) with 20+ years experience.

ABOUT ROB:
- 20+ years as a school-based BCBA
- Founder of Behavior School (behaviorschool.com)
- Focus on practical, sustainable behavior support
- Target audience: School BCBAs, behavior analysts, special education professionals

BRAND VOICE BY PLATFORM:
- Twitter/X: Direct, insightful, occasionally witty. Thread-worthy hooks.
- LinkedIn: Professional thought leadership. Share insights, ask questions.
- Facebook: Community-focused, relatable. Encourage discussion.
- Instagram: Visual-first thinking. Engaging captions. Hashtag-rich.

GENERAL GUIDELINES:
- Always provide value, not just promotion
- Lead with the insight or hook, not "New video!"
- Make people want to watch/read more
- Include relevant hashtags for discoverability
- Behavior analysis community hashtags: #BCBA #BehaviorAnalysis #ABA #SchoolPsychology #SpecialEducation #PBIS`;

    const requestedPlatforms = platforms.filter(p => PLATFORM_CONFIGS[p]);
    const platformInstructions = requestedPlatforms.map(p => {
      const config = PLATFORM_CONFIGS[p];
      return `
${config.name.toUpperCase()}:
- Max length: ${config.maxLength} characters
${config.optimalLength ? `- Optimal length: ${config.optimalLength} characters` : ''}
- Hashtag limit: ${config.hashtagLimit || 'N/A'}
- Style: ${config.style}`;
    }).join('\n');

    const userPrompt = `Create social media posts for this YouTube video:

VIDEO TITLE: ${title}
VIDEO TYPE: ${videoType || 'insight'}
YOUTUBE URL: ${youtubeUrl || '[URL will be added]'}

${script ? `SCRIPT/CONTENT SUMMARY:\n${typeof script === 'object' ? JSON.stringify(script, null, 2).substring(0, 3000) : script.substring(0, 3000)}` : ''}

Generate content only for these requested platforms with these requirements:
${platformInstructions}

Return JSON in this exact structure:
{
  "twitter": {
    "text": "Tweet text (include link placeholder [LINK])",
    "hashtags": "#tag1 #tag2 #tag3",
    "characterCount": 123,
    "threadOption": "Optional: If content warrants a thread, provide 2-3 tweet thread here"
  },
  "linkedin": {
    "text": "Full LinkedIn post (include link placeholder [LINK])",
    "hashtags": "#tag1 #tag2",
    "characterCount": 456
  }
}

IMPORTANT:
- Use [LINK] as placeholder for the YouTube URL
- Provide accurate character counts
- Each platform post should be unique (not copy-paste)
- Lead with value/hook, not "check out my new video"
- Only include the requested platform keys: ${requestedPlatforms.join(', ')}

Return ONLY valid JSON (no markdown code blocks, no backticks).`;

    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will create platform-optimized social media content following brand voice guidelines.' }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ]);

    const text = result.response.text();
    const cleanedJson = text.replace(/```json|```/gi, '').trim();

    let socialData;
    try {
      socialData = JSON.parse(cleanedJson);
    } catch (parseError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to parse generated social content",
          raw: cleanedJson.substring(0, 500)
        }),
      };
    }

    // Replace [LINK] placeholder with actual URL if provided
    if (youtubeUrl) {
      if (socialData.twitter?.text) {
        socialData.twitter.text = socialData.twitter.text.replace('[LINK]', youtubeUrl);
      }
      if (socialData.linkedin?.text) {
        socialData.linkedin.text = socialData.linkedin.text.replace('[LINK]', youtubeUrl);
      }
      if (socialData.facebook?.text) {
        socialData.facebook.text = socialData.facebook.text.replace('[LINK]', youtubeUrl);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        youtubeUrl: youtubeUrl,
        platforms: socialData
      }),
    };

  } catch (error) {
    console.error('Generate social error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
