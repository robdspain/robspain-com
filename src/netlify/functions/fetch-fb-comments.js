// src/netlify/functions/fetch-fb-comments.js
// Fetch Facebook Page comments via Meta Graph API

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

  const { FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID } = process.env;

  if (!FB_PAGE_ACCESS_TOKEN || !FB_PAGE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing Facebook API configuration',
        hint: 'Set FB_PAGE_ACCESS_TOKEN and FB_PAGE_ID in Netlify environment variables'
      })
    };
  }

  try {
    // Get recent posts from the page (last 10)
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
    const allComments = [];

    // For each post, fetch comments
    for (const post of posts.data || []) {
      const commentsResponse = await fetch(
        `https://graph.facebook.com/v22.0/${post.id}/comments?` +
        `fields=id,from{id,name,picture},message,created_time,like_count,comment_count,parent&` +
        `filter=stream&limit=50&access_token=${FB_PAGE_ACCESS_TOKEN}`
      );

      if (!commentsResponse.ok) {
        console.error(`Failed to fetch comments for post ${post.id}`);
        continue;
      }

      const comments = await commentsResponse.json();

      for (const comment of comments.data || []) {
        allComments.push({
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
          isReply: !!comment.parent,
          parentCommentId: comment.parent?.id || null,
          status: 'unread',
          priority: comment.comment_count > 0 || detectQuestion(comment.message) ? 'high' : 'normal'
        });
      }
    }

    // Sort by created time (newest first)
    allComments.sort((a, b) => b.createdAt - a.createdAt);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        platform: 'facebook',
        postsScanned: posts.data?.length || 0,
        commentsFound: allComments.length,
        comments: allComments,
        syncedAt: Date.now()
      })
    };

  } catch (error) {
    console.error('Fetch FB comments error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message,
        platform: 'facebook'
      })
    };
  }
};

function detectQuestion(text) {
  if (!text) return false;
  return text.includes('?') ||
         /^(how|what|why|when|where|who|can|could|would|should|is|are|do|does|did|will|has|have)/i.test(text.trim());
}
