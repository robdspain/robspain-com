// src/netlify/functions/fetch-url-content.js
// URL Content Fetcher - Final Version

// Known research domains with specific extraction patterns
const RESEARCH_DOMAINS = {
  'onlinelibrary.wiley.com': { type: 'journal', name: 'Wiley Online Library' },
  'pubmed.ncbi.nlm.nih.gov': { type: 'journal', name: 'PubMed' },
  'doi.org': { type: 'journal', name: 'DOI Resolver' },
  'jaba.org': { type: 'journal', name: 'JABA' },
  'springer.com': { type: 'journal', name: 'Springer' },
  'tandfonline.com': { type: 'journal', name: 'Taylor & Francis' }
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

  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BehaviorSchool/1.0; +https://robspain.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      timeout: 10000,
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          suggestion: response.status === 403 || response.status === 401
            ? "This content may be behind a paywall. Try pasting the article text directly."
            : "The URL could not be accessed. Please check the link and try again."
        }),
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const html = await response.text();

    // Extract text content from HTML
    const extractedContent = extractTextFromHtml(html);

    // Extract metadata
    const metadata = extractMetadata(html, parsedUrl.hostname);

    // Detect source type
    const domainInfo = RESEARCH_DOMAINS[parsedUrl.hostname] || null;
    const sourceType = domainInfo ? 'research' : detectSourceType(parsedUrl.hostname, html);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        url: url,
        domain: parsedUrl.hostname,
        sourceType: sourceType, // 'research', 'news', 'blog', 'general'
        sourceName: domainInfo?.name || parsedUrl.hostname,
        title: metadata.title,
        description: metadata.description,
        author: metadata.author,
        publishDate: metadata.publishDate,
        content: extractedContent,
        wordCount: extractedContent.split(/\s+/).length,
        contentType: contentType.includes('pdf') ? 'pdf' : 'html',
        citation: domainInfo ? generateCitation(metadata, parsedUrl.href) : null
      }),
    };

  } catch (error) {
    console.error('Fetch URL error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        suggestion: "There was a problem fetching this URL. Try pasting the content directly."
      }),
    };
  }
};

// Extract readable text from HTML
function extractTextFromHtml(html) {
  // Remove script and style tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');

  // Try to find main content areas
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (articleMatch) {
    text = articleMatch[1];
  } else if (mainMatch) {
    text = mainMatch[1];
  } else if (contentMatch) {
    text = contentMatch[1];
  }

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .trim();

  // Limit to reasonable length
  if (text.length > 15000) {
    text = text.substring(0, 15000) + '...';
  }

  return text;
}

// Extract metadata from HTML
function extractMetadata(html, domain) {
  const metadata = {
    title: '',
    description: '',
    author: '',
    publishDate: ''
  };

  // Title
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  metadata.title = (ogTitle && ogTitle[1]) || (titleTag && titleTag[1]) || '';

  // Description
  const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
  const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  metadata.description = (ogDesc && ogDesc[1]) || (metaDesc && metaDesc[1]) || '';

  // Author
  const authorMeta = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i);
  const authorJson = html.match(/"author"\s*:\s*"([^"]*)"/i);
  metadata.author = (authorMeta && authorMeta[1]) || (authorJson && authorJson[1]) || '';

  // Publish date
  const dateMeta = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"[^>]*>/i);
  const dateJson = html.match(/"datePublished"\s*:\s*"([^"]*)"/i);
  metadata.publishDate = (dateMeta && dateMeta[1]) || (dateJson && dateJson[1]) || '';

  return metadata;
}

// Detect type of content source
function detectSourceType(hostname, html) {
  // News sites
  const newsDomains = ['cnn.com', 'nytimes.com', 'bbc.com', 'reuters.com', 'apnews.com', 'npr.org'];
  if (newsDomains.some(d => hostname.includes(d))) {
    return 'news';
  }

  // Check for blog indicators
  if (hostname.includes('blog') || hostname.includes('medium.com') || hostname.includes('substack.com')) {
    return 'blog';
  }

  // Check HTML for article type
  if (html.includes('type="article"') || html.includes('"@type":"NewsArticle"')) {
    return 'news';
  }

  if (html.includes('"@type":"BlogPosting"')) {
    return 'blog';
  }

  return 'general';
}

// Generate a simple citation for research articles
function generateCitation(metadata, url) {
  const author = metadata.author || 'Unknown Author';
  const year = metadata.publishDate ? new Date(metadata.publishDate).getFullYear() : new Date().getFullYear();
  const title = metadata.title || 'Untitled';

  return {
    simple: `${author} (${year}). ${title}. Retrieved from ${url}`,
    apa: `${author} (${year}). ${title}. Retrieved from ${url}`
  };
}
