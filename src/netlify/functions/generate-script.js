// src/netlify/functions/generate-script.js
// YouTube Script Generator - Final Version
const { GoogleGenerativeAI } = require("@google/generative-ai");

const VIDEO_TYPES = {
  'research_review': {
    name: 'Research Review',
    guidance: 'Break down the research methodology, key findings, and practical implications. Cite the study properly. Help viewers understand why this matters for their daily practice.'
  },
  'project_update': {
    name: 'Project Update',
    guidance: 'Share what\'s new at Behavior School, why it was built, how it helps BCBAs. Be enthusiastic but genuine. Show, don\'t just tell.'
  },
  'news': {
    name: 'News Commentary',
    guidance: 'Provide context on the news, share your expert perspective, and discuss implications for school BCBAs. Be balanced but opinionated.'
  },
  'tutorial': {
    name: 'Tutorial/How-To',
    guidance: 'Step-by-step instruction with clear examples. Anticipate common mistakes. Provide downloadable resources when relevant.'
  },
  'insight': {
    name: 'Insight/Opinion',
    guidance: 'Share a perspective or lesson learned. Use personal stories and examples. Be vulnerable about past mistakes when relevant.'
  }
};

const CTA_OPTIONS = {
  'transformation-program': {
    url: 'https://behaviorschool.com/transformation-program',
    description: 'the 8-Week Transformation Program for school BCBAs'
  },
  'study': {
    url: 'https://behaviorschool.com/study',
    description: 'BCBA exam prep resources at Behavior School'
  },
  'supervision-tools': {
    url: 'https://behaviorschool.com/supervision-tools',
    description: 'supervision tracking tools from Behavior School'
  },
  'resources': {
    url: 'https://behaviorschool.com/resources',
    description: 'free behavior analysis resources at Behavior School'
  },
  'iep-goals': {
    url: 'https://behaviorschool.com/iep-goals',
    description: 'IEP goal resources at Behavior School'
  },
  'behavior-plans': {
    url: 'https://behaviorschool.com/behavior-plans',
    description: 'behavior intervention plan templates at Behavior School'
  }
};

const VIDEO_LENGTHS = {
  'short': { minutes: '5-7', words: '750-1050', sections: 2 },
  'standard': { minutes: '10-15', words: '1500-2250', sections: 3 },
  'deep_dive': { minutes: '20-25', words: '3000-3750', sections: 5 }
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
      idea,
      sourceContent,
      videoType,
      targetLength,
      primaryCta,
      secondaryCta
    } = JSON.parse(event.body || '{}');

    if (!idea) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Content idea is required" }),
      };
    }

    const lengthConfig = VIDEO_LENGTHS[targetLength] || VIDEO_LENGTHS['standard'];
    const ctaInfo = CTA_OPTIONS[primaryCta] || CTA_OPTIONS['transformation-program'];
    const secondaryCtaInfo = secondaryCta ? CTA_OPTIONS[secondaryCta] : null;

    const systemPrompt = `You are an expert YouTube scriptwriter for Rob Spain, a Board Certified Behavior Analyst (BCBA) with 20+ years experience who creates educational content for school-based behavior analysts.

ABOUT ROB:
- 20+ years as a school-based BCBA
- Founder of Behavior School (behaviorschool.com)
- Known for practical, systems-based approach to behavior support
- Focus on sustainable practices that prevent burnout

BRAND VOICE:
- Warm, expert, relatable tone - like talking to a trusted colleague
- Fellow practitioner sharing hard-won insights (never lecturing)
- Evidence-based but always practical and implementable
- Occasionally uses dry humor and self-deprecating stories
- Anti-burnout, pro-sustainability, pro-systems thinking
- Accessible language - explains jargon naturally when used
- Empathetic to the struggles of school BCBAs

SCRIPT STRUCTURE FOR ${lengthConfig.minutes} MINUTE VIDEO:
1. HOOK (0:00-0:30): Pattern interrupt, surprising fact, relatable pain point, or bold contrarian claim
2. INTRO (0:30-1:30): Context, Rob's credibility on this topic, and clear promise of value
3. CONTENT SECTIONS: ${lengthConfig.sections} main sections, each with:
   - Clear teaching point
   - Real-world example or story
   - Practical application
   - Retention hook (open loop or teaser)
4. ACTIONABLE TAKEAWAY: One SPECIFIC thing viewers can implement THIS WEEK
5. CTA: Natural, value-first mention of ${ctaInfo.description}
6. OUTRO: Subscribe prompt with reason, and teaser for related content

RETENTION STRATEGIES TO INCLUDE:
- Open loops: "In a moment, I'll share the one thing that changed everything..."
- Pattern interrupts: [CHANGE ANGLE], [SHOW GRAPHIC], visual/tonal shifts
- Curiosity gaps: Tease information before revealing
- Engagement prompts: "You might be thinking..." or "Drop a comment if..."
- Mini-summaries: Brief recap before transitioning

FORMATTING:
- [PAUSE] for dramatic effect or emphasis
- [SHOW GRAPHIC: description] for visual aids
- [B-ROLL: description] for cutaway footage
- [CHANGE ANGLE] for visual variety
- **bold** for words to emphasize vocally
- Write for SPOKEN delivery: contractions, short sentences, conversational rhythm
- Include realistic timestamp markers
- Target approximately ${lengthConfig.words} words total`;

    const videoTypeConfig = VIDEO_TYPES[videoType] || VIDEO_TYPES['insight'];

    const userPrompt = `Create a complete YouTube script for the following:

VIDEO TYPE: ${videoTypeConfig.name}
TYPE-SPECIFIC GUIDANCE: ${videoTypeConfig.guidance}

TARGET LENGTH: ${lengthConfig.minutes} minutes (${lengthConfig.sections} main sections)
TOPIC/IDEA: ${idea}

${sourceContent ? `SOURCE MATERIAL TO REFERENCE:\n${sourceContent.substring(0, 6000)}` : 'No source material provided - use general knowledge and Rob\'s expertise.'}

PRIMARY CTA: ${ctaInfo.description} (${ctaInfo.url})
${secondaryCtaInfo ? `SECONDARY CTA: ${secondaryCtaInfo.description} (${secondaryCtaInfo.url})` : ''}

Generate a complete script with the following JSON structure:
{
  "title": "Compelling YouTube title (max 60 chars)",
  "hook": "Full hook script text with timestamp [0:00-0:30]",
  "intro": "Full intro script text with timestamp [0:30-1:30]",
  "sections": [
    {
      "heading": "Section title",
      "timestamp": "2:00-5:00",
      "content": "Full section script text",
      "retentionHook": "Open loop or teaser for next section"
    }
  ],
  "actionableTakeaway": "The one specific thing viewers should do",
  "cta": "Natural CTA script mentioning the resource",
  "outro": "Subscribe and next video teaser",
  "metadata": {
    "youtubeTitle": "SEO-optimized title (max 60 chars)",
    "youtubeDescription": "Full description with timestamps and links",
    "tags": ["tag1", "tag2", "tag3"],
    "chapters": [
      { "time": "0:00", "title": "Chapter title" }
    ],
    "thumbnailTextOptions": ["Option 1", "Option 2", "Option 3"],
    "shortsHook": "15-second hook for YouTube Shorts"
  }
}

Return ONLY valid JSON (no markdown, no backticks).`;

    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will generate YouTube scripts following the brand voice and structure guidelines you provided.' }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ]);

    const text = result.response.text();

    // Clean any markdown formatting
    const cleanedJson = text.replace(/```json|```/gi, '').trim();

    // Validate it's parseable JSON
    let scriptData;
    try {
      scriptData = JSON.parse(cleanedJson);
    } catch (parseError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to parse generated script",
          raw: cleanedJson.substring(0, 500)
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(scriptData),
    };

  } catch (error) {
    console.error('Generate script error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
