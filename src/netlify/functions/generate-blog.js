// src/netlify/functions/generate-blog.js
// Blog Post Generator from YouTube Scripts
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
      youtubeId,
      script,
      videoType,
      tags
    } = JSON.parse(event.body || '{}');

    if (!script) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Script content is required" }),
      };
    }

    // Extract YouTube ID if URL provided but ID missing
    let videoId = youtubeId;
    if (!videoId && youtubeUrl) {
      const urlMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
      if (urlMatch) {
        videoId = urlMatch[1];
      }
    }

    const systemPrompt = `You are an expert blog content writer for Rob Spain, a Board Certified Behavior Analyst (BCBA) with 20+ years experience.

ABOUT ROB:
- 20+ years as a school-based BCBA
- Founder of Behavior School (behaviorschool.com)
- Known for practical, systems-based approach to behavior support
- Focus on sustainable practices that prevent burnout

BRAND VOICE:
- Warm, expert, relatable tone - like talking to a trusted colleague
- Fellow practitioner sharing hard-won insights (never lecturing)
- Evidence-based but always practical and implementable
- Anti-burnout, pro-sustainability, pro-systems thinking
- Accessible language - explains jargon naturally when used

BLOG POST REQUIREMENTS:
1. Transform video script into engaging blog post format
2. Add depth and nuance that text allows (vs spoken delivery)
3. Include proper heading structure (H2, H3)
4. Use bullet points and numbered lists for scannability
5. Keep the practical, actionable focus
6. Include a clear call-to-action section
7. Write 1000-1500 words (more depth than script)

LINKING GUIDELINES (CRITICAL):
- Include 1-2 contextual links to Behavior School resources
- Use descriptive anchor text, never "click here"
- Link to most relevant page based on topic:
  - BCBA exam prep → https://behaviorschool.com/study
  - Supervision topics → https://behaviorschool.com/supervision-tools
  - PBIS/resources → https://behaviorschool.com/resources
  - IEP goals → https://behaviorschool.com/iep-goals
  - Behavior plans → https://behaviorschool.com/behavior-plans
  - General transformation → https://behaviorschool.com/transformation-program`;

    const userPrompt = `Transform this YouTube video script into a polished blog post:

VIDEO TITLE: ${title || 'Untitled Video'}
VIDEO TYPE: ${videoType || 'insight'}
${videoId ? `YOUTUBE VIDEO ID: ${videoId}` : ''}

SCRIPT CONTENT:
${typeof script === 'object' ? JSON.stringify(script, null, 2) : script}

Generate the blog post in the following JSON structure:
{
  "title": "Blog post title (can differ slightly from video)",
  "description": "2-3 sentence excerpt for previews and SEO (max 160 chars)",
  "body": "Full markdown blog post content",
  "tags": ["tag1", "tag2", "tag3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "seo": {
    "metaTitle": "SEO title (max 60 chars)",
    "metaDesc": "Meta description (max 155 chars)"
  }
}

IMPORTANT:
- The body should be markdown formatted
- ${videoId ? `Include the YouTube embed at the start using: <lite-youtube videoid="${videoId}"></lite-youtube>` : 'YouTube embed will be added later when URL is available'}
- Add a note inviting readers to watch the video for visual examples
- Transform spoken language into written prose (remove [PAUSE], [SHOW GRAPHIC], etc.)
- Expand on points where written format allows more detail

Return ONLY valid JSON (no markdown code blocks, no backticks).`;

    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will transform YouTube scripts into polished blog posts following the brand voice and formatting guidelines.' }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ]);

    const text = result.response.text();
    const cleanedJson = text.replace(/```json|```/gi, '').trim();

    let blogData;
    try {
      blogData = JSON.parse(cleanedJson);
    } catch (parseError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to parse generated blog content",
          raw: cleanedJson.substring(0, 500)
        }),
      };
    }

    // Generate frontmatter for the markdown file
    const today = new Date().toISOString().split('T')[0];
    const slug = generateSlug(blogData.title);
    const filename = `${today}-${slug}.md`;

    const frontmatter = {
      layout: 'post.njk',
      draft: true,
      title: blogData.title,
      date: new Date().toISOString(),
      youtubeUrl: youtubeUrl || '',
      image: '/public/images/blog-default.png',
      description: blogData.description,
      tags: blogData.tags || ['post'],
      keywords: blogData.keywords || [],
      featured: false,
      seo: blogData.seo || {}
    };

    // Generate full markdown content
    const markdownContent = generateMarkdown(frontmatter, blogData.body);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        filename: filename,
        frontmatter: frontmatter,
        body: blogData.body,
        fullMarkdown: markdownContent,
        wordCount: blogData.body.split(/\s+/).length
      }),
    };

  } catch (error) {
    console.error('Generate blog error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
    .replace(/-$/, '');
}

function generateMarkdown(frontmatter, body) {
  const yaml = [
    '---',
    `layout: ${frontmatter.layout}`,
    `draft: ${frontmatter.draft}`,
    `title: "${frontmatter.title.replace(/"/g, '\\"')}"`,
    `date: ${frontmatter.date}`,
    frontmatter.youtubeUrl ? `youtubeUrl: "${frontmatter.youtubeUrl}"` : null,
    `image: ${frontmatter.image}`,
    `description: >-`,
    `  ${frontmatter.description}`,
    `tags:`,
    ...frontmatter.tags.map(tag => `  - ${tag}`),
    frontmatter.keywords.length > 0 ? `keywords:` : null,
    ...frontmatter.keywords.map(kw => `  - ${kw}`),
    `featured: ${frontmatter.featured}`,
    frontmatter.seo ? `seo:` : null,
    frontmatter.seo?.metaTitle ? `  metaTitle: "${frontmatter.seo.metaTitle}"` : null,
    frontmatter.seo?.metaDesc ? `  metaDesc: "${frontmatter.seo.metaDesc}"` : null,
    '---'
  ].filter(Boolean).join('\n');

  return `${yaml}\n${body}`;
}
