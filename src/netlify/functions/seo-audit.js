const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Find blog posts directory
    const postsDir = path.join(__dirname, '../../posts');
    
    if (!fs.existsSync(postsDir)) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Posts directory not found', path: postsDir })
      };
    }

    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
    const posts = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const post = parsePost(content, file);
      if (post) posts.push(post);
    }

    // Calculate summary stats
    const summary = {
      totalPosts: posts.length,
      postsWithFAQ: posts.filter(p => p.hasFAQ).length,
      postsWithImage: posts.filter(p => p.hasImage).length,
      avgMetaDescLength: posts.length > 0 
        ? posts.reduce((sum, p) => sum + p.metaDescLength, 0) / posts.length 
        : 0
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ posts, summary })
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: String(e), stack: e.stack })
    };
  }
};

function parsePost(content, filename) {
  try {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = parseFrontmatter(frontmatterMatch[1]);
    const body = content.slice(frontmatterMatch[0].length);

    // Extract data
    const title = frontmatter.title || filename.replace('.md', '');
    const metaTitle = frontmatter.meta_title || frontmatter.title || '';
    const metaDesc = frontmatter.description || frontmatter.meta_description || '';
    const status = frontmatter.draft === true || frontmatter.draft === 'true' ? 'draft' : 'published';
    const featuredImage = frontmatter.image || frontmatter.featured_image || null;
    const date = frontmatter.date || null;

    // Check for FAQ section
    const hasFAQ = /#{1,3}\s*Frequently Asked Questions/i.test(body);

    // Count words (exclude frontmatter, code blocks, and HTML)
    const plainText = body
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

    // Count internal links
    const internalLinkMatches = body.match(/\[([^\]]+)\]\(\/[^)]+\)/g) || [];
    const internalLinks = internalLinkMatches.length;

    // Check for newsletter signup (common patterns)
    const hasNewsletter = /newsletter|subscribe|email signup/i.test(body);

    // Generate URL from filename
    const slug = filename.replace('.md', '');
    const url = `/blog/${slug}/`;

    return {
      title,
      url,
      status,
      hasFAQ,
      hasImage: !!featuredImage,
      metaTitleLength: metaTitle.length,
      metaDescLength: metaDesc.length,
      hasNewsletter,
      wordCount,
      internalLinks,
      date
    };

  } catch (e) {
    console.error('Error parsing post:', filename, e);
    return null;
  }
}

function parseFrontmatter(text) {
  const lines = text.split('\n');
  const result = {};
  let currentKey = null;
  let currentValue = [];
  let inArray = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;

    // Check for key-value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    
    if (kvMatch) {
      // Save previous key if exists
      if (currentKey) {
        result[currentKey] = inArray ? currentValue : currentValue.join('\n').trim();
      }

      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === '') {
        // Might be start of array or multiline
        currentValue = [];
        inArray = false;
      } else if (value === 'true' || value === 'false') {
        result[currentKey] = value === 'true';
        currentKey = null;
        currentValue = [];
      } else if (value.startsWith('"') || value.startsWith("'")) {
        result[currentKey] = value.replace(/^["']|["']$/g, '');
        currentKey = null;
        currentValue = [];
      } else {
        result[currentKey] = value;
        currentKey = null;
        currentValue = [];
      }
    } else if (currentKey && trimmed.startsWith('-')) {
      // Array item
      inArray = true;
      currentValue.push(trimmed.slice(1).trim());
    } else if (currentKey) {
      // Continuation of previous value
      currentValue.push(trimmed);
    }
  }

  // Save last key
  if (currentKey) {
    result[currentKey] = inArray ? currentValue : currentValue.join('\n').trim();
  }

  return result;
}
