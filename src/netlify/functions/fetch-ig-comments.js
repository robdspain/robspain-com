// src/netlify/functions/fetch-ig-comments.js
// Fetch Instagram Business comments via Meta Graph API

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

  const { IG_ACCESS_TOKEN, IG_BUSINESS_ACCOUNT_ID } = process.env;

  if (!IG_ACCESS_TOKEN || !IG_BUSINESS_ACCOUNT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing Instagram API configuration',
        hint: 'Set IG_ACCESS_TOKEN and IG_BUSINESS_ACCOUNT_ID in Netlify environment variables'
      })
    };
  }

  try {
    // Get recent media posts from Instagram Business account
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v22.0/${IG_BUSINESS_ACCOUNT_ID}/media?` +
      `fields=id,caption,permalink,timestamp,media_type,media_url,thumbnail_url&limit=10&` +
      `access_token=${IG_ACCESS_TOKEN}`
    );

    if (!mediaResponse.ok) {
      const error = await mediaResponse.json();
      throw new Error(error.error?.message || 'Failed to fetch Instagram media');
    }

    const media = await mediaResponse.json();
    const allComments = [];

    // For each media post, fetch comments
    for (const post of media.data || []) {
      const commentsResponse = await fetch(
        `https://graph.facebook.com/v22.0/${post.id}/comments?` +
        `fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}&` +
        `limit=50&access_token=${IG_ACCESS_TOKEN}`
      );

      if (!commentsResponse.ok) {
        console.error(`Failed to fetch comments for media ${post.id}`);
        continue;
      }

      const comments = await commentsResponse.json();

      for (const comment of comments.data || []) {
        // Add main comment
        allComments.push({
          platform: 'instagram',
          platformCommentId: comment.id,
          platformPostId: post.id,
          postUrl: post.permalink,
          postThumbnail: post.thumbnail_url || post.media_url,
          authorName: comment.username || 'Unknown',
          authorUsername: comment.username || '',
          authorAvatarUrl: null, // IG doesn't provide avatar in comment API
          text: comment.text || '',
          createdAt: new Date(comment.timestamp).getTime(),
          fetchedAt: Date.now(),
          likeCount: comment.like_count || 0,
          replyCount: comment.replies?.data?.length || 0,
          isQuestion: detectQuestion(comment.text),
          isReply: false,
          parentCommentId: null,
          status: 'unread',
          priority: (comment.replies?.data?.length > 0 || detectQuestion(comment.text)) ? 'high' : 'normal'
        });

        // Add replies to the comment
        if (comment.replies?.data) {
          for (const reply of comment.replies.data) {
            allComments.push({
              platform: 'instagram',
              platformCommentId: reply.id,
              platformPostId: post.id,
              postUrl: post.permalink,
              postThumbnail: post.thumbnail_url || post.media_url,
              authorName: reply.username || 'Unknown',
              authorUsername: reply.username || '',
              authorAvatarUrl: null,
              text: reply.text || '',
              createdAt: new Date(reply.timestamp).getTime(),
              fetchedAt: Date.now(),
              likeCount: reply.like_count || 0,
              replyCount: 0,
              isQuestion: detectQuestion(reply.text),
              isReply: true,
              parentCommentId: comment.id,
              status: 'unread',
              priority: 'normal'
            });
          }
        }
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
        platform: 'instagram',
        postsScanned: media.data?.length || 0,
        commentsFound: allComments.length,
        comments: allComments,
        syncedAt: Date.now()
      })
    };

  } catch (error) {
    console.error('Fetch IG comments error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message,
        platform: 'instagram'
      })
    };
  }
};

function detectQuestion(text) {
  if (!text) return false;
  return text.includes('?') ||
         /^(how|what|why|when|where|who|can|could|would|should|is|are|do|does|did|will|has|have)/i.test(text.trim());
}
