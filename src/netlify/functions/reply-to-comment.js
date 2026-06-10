// src/netlify/functions/reply-to-comment.js
// Reply to comments on Facebook and Instagram via Meta Graph API

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
    const { platform, platformCommentId, replyText } = JSON.parse(event.body || '{}');

    if (!platform || !platformCommentId || !replyText) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: platform, platformCommentId, replyText'
        })
      };
    }

    if (replyText.length > 8000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Reply text too long (max 8000 characters)' })
      };
    }

    let result;

    switch (platform) {
      case 'facebook':
        result = await replyToFacebookComment(platformCommentId, replyText);
        break;
      case 'instagram':
        result = await replyToInstagramComment(platformCommentId, replyText);
        break;
      case 'twitter':
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Twitter reply requires Basic tier ($100/month)',
            hint: 'Use the Twitter app directly to reply to comments'
          })
        };
      case 'linkedin':
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'LinkedIn reply requires Community Management API approval',
            hint: 'Use LinkedIn directly to reply to comments'
          })
        };
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unsupported platform: ${platform}` })
        };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        platform,
        replyId: result.replyId,
        sentAt: Date.now()
      })
    };

  } catch (error) {
    console.error('Reply to comment error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function replyToFacebookComment(commentId, text) {
  const { FB_PAGE_ACCESS_TOKEN } = process.env;

  if (!FB_PAGE_ACCESS_TOKEN) {
    throw new Error('Missing FB_PAGE_ACCESS_TOKEN environment variable');
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${commentId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        access_token: FB_PAGE_ACCESS_TOKEN
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || 'Facebook reply failed');
  }

  return { replyId: result.id };
}

async function replyToInstagramComment(commentId, text) {
  const { IG_ACCESS_TOKEN } = process.env;

  if (!IG_ACCESS_TOKEN) {
    throw new Error('Missing IG_ACCESS_TOKEN environment variable');
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${commentId}/replies`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        access_token: IG_ACCESS_TOKEN
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || 'Instagram reply failed');
  }

  return { replyId: result.id };
}
