// src/netlify/functions/get-comments.js
// Unified endpoint to fetch all comments across platforms
// This aggregates cached comments from localStorage or fetches fresh from APIs

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  const { FB_PAGE_ACCESS_TOKEN, IG_ACCESS_TOKEN } = process.env;

  try {
    // Parse query params for filtering
    const params = event.queryStringParameters || {};
    const platform = params.platform || 'all';
    const status = params.status || 'all';
    const limit = parseInt(params.limit) || 50;

    // Fetch comments from each configured platform
    const results = {
      comments: [],
      counts: {
        facebook: { total: 0, unread: 0 },
        instagram: { total: 0, unread: 0 },
        twitter: { total: 0, unread: 0, note: 'Requires Basic tier for API access' },
        linkedin: { total: 0, unread: 0, note: 'Requires Partner Program for API access' }
      },
      syncStatus: {},
      errors: []
    };

    // Fetch Facebook comments if configured
    if (FB_PAGE_ACCESS_TOKEN && (platform === 'all' || platform === 'facebook')) {
      try {
        const fbResult = await fetchFacebookComments();
        results.comments.push(...fbResult.comments);
        results.counts.facebook.total = fbResult.comments.length;
        results.counts.facebook.unread = fbResult.comments.filter(c => c.status === 'unread').length;
        results.syncStatus.facebook = { lastSync: fbResult.syncedAt, success: true };
      } catch (error) {
        results.errors.push({ platform: 'facebook', error: error.message });
        results.syncStatus.facebook = { lastSync: null, success: false, error: error.message };
      }
    }

    // Fetch Instagram comments if configured
    if (IG_ACCESS_TOKEN && (platform === 'all' || platform === 'instagram')) {
      try {
        const igResult = await fetchInstagramComments();
        results.comments.push(...igResult.comments);
        results.counts.instagram.total = igResult.comments.length;
        results.counts.instagram.unread = igResult.comments.filter(c => c.status === 'unread').length;
        results.syncStatus.instagram = { lastSync: igResult.syncedAt, success: true };
      } catch (error) {
        results.errors.push({ platform: 'instagram', error: error.message });
        results.syncStatus.instagram = { lastSync: null, success: false, error: error.message };
      }
    }

    // Filter by status if specified
    if (status !== 'all') {
      results.comments = results.comments.filter(c => {
        switch (status) {
          case 'unread': return c.status === 'unread';
          case 'questions': return c.isQuestion;
          case 'replied': return c.status === 'replied';
          case 'flagged': return c.status === 'flagged';
          default: return true;
        }
      });
    }

    // Sort by creation time (newest first)
    results.comments.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    results.comments = results.comments.slice(0, limit);

    // Add unique IDs for client-side reference
    results.comments = results.comments.map((comment, index) => ({
      ...comment,
      _id: `${comment.platform}-${comment.platformCommentId}`
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('Get comments error:', error);
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

async function fetchFacebookComments() {
  const { FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID } = process.env;

  const postsResponse = await fetch(
    `https://graph.facebook.com/v22.0/${FB_PAGE_ID}/posts?` +
    `fields=id,message,created_time,permalink_url&limit=10&` +
    `access_token=${FB_PAGE_ACCESS_TOKEN}`
  );

  if (!postsResponse.ok) {
    const error = await postsResponse.json();
    throw new Error(error.error?.message || 'Failed to fetch Facebook posts');
  }

  const posts = await postsResponse.json();
  const comments = [];

  for (const post of posts.data || []) {
    const commentsResponse = await fetch(
      `https://graph.facebook.com/v22.0/${post.id}/comments?` +
      `fields=id,from{id,name,picture},message,created_time,like_count,comment_count&` +
      `filter=stream&limit=50&access_token=${FB_PAGE_ACCESS_TOKEN}`
    );

    if (!commentsResponse.ok) continue;

    const commentsData = await commentsResponse.json();

    for (const comment of commentsData.data || []) {
      comments.push({
        platform: 'facebook',
        platformCommentId: comment.id,
        platformPostId: post.id,
        postUrl: post.permalink_url,
        authorName: comment.from?.name || 'Unknown User',
        authorUsername: comment.from?.id || '',
        authorAvatarUrl: comment.from?.picture?.data?.url || null,
        text: comment.message || '',
        createdAt: new Date(comment.created_time).getTime(),
        fetchedAt: Date.now(),
        likeCount: comment.like_count || 0,
        replyCount: comment.comment_count || 0,
        isQuestion: detectQuestion(comment.message),
        isReply: false,
        status: 'unread',
        priority: comment.comment_count > 0 || detectQuestion(comment.message) ? 'high' : 'normal'
      });
    }
  }

  return { comments, syncedAt: Date.now() };
}

async function fetchInstagramComments() {
  const { IG_ACCESS_TOKEN, IG_BUSINESS_ACCOUNT_ID } = process.env;

  const mediaResponse = await fetch(
    `https://graph.facebook.com/v22.0/${IG_BUSINESS_ACCOUNT_ID}/media?` +
    `fields=id,caption,permalink,timestamp,thumbnail_url,media_url&limit=10&` +
    `access_token=${IG_ACCESS_TOKEN}`
  );

  if (!mediaResponse.ok) {
    const error = await mediaResponse.json();
    throw new Error(error.error?.message || 'Failed to fetch Instagram media');
  }

  const media = await mediaResponse.json();
  const comments = [];

  for (const post of media.data || []) {
    const commentsResponse = await fetch(
      `https://graph.facebook.com/v22.0/${post.id}/comments?` +
      `fields=id,text,timestamp,username,like_count&` +
      `limit=50&access_token=${IG_ACCESS_TOKEN}`
    );

    if (!commentsResponse.ok) continue;

    const commentsData = await commentsResponse.json();

    for (const comment of commentsData.data || []) {
      comments.push({
        platform: 'instagram',
        platformCommentId: comment.id,
        platformPostId: post.id,
        postUrl: post.permalink,
        postThumbnail: post.thumbnail_url || post.media_url,
        authorName: comment.username || 'Unknown',
        authorUsername: comment.username || '',
        authorAvatarUrl: null,
        text: comment.text || '',
        createdAt: new Date(comment.timestamp).getTime(),
        fetchedAt: Date.now(),
        likeCount: comment.like_count || 0,
        replyCount: 0,
        isQuestion: detectQuestion(comment.text),
        isReply: false,
        status: 'unread',
        priority: detectQuestion(comment.text) ? 'high' : 'normal'
      });
    }
  }

  return { comments, syncedAt: Date.now() };
}

function detectQuestion(text) {
  if (!text) return false;
  return text.includes('?') ||
         /^(how|what|why|when|where|who|can|could|would|should|is|are|do|does|did|will|has|have)/i.test(text.trim());
}
