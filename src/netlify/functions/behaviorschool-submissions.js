// Proxy function to fetch submissions from behaviorschool.com
// This avoids CORS issues and allows authentication

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Fetch submissions from behaviorschool.com
    // Note: This assumes the behaviorschool.com API doesn't require authentication
    // If it does, we'll need to add authentication headers
    const response = await fetch('https://behaviorschool.com/api/admin/submissions', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RobSpain-CRM-Proxy/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Behaviorschool API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match CRM contact format
    const submissions = data.submissions || [];
    const transformed = submissions.map(submission => ({
      id: `bs-${submission.id}`, // Prefix to avoid conflicts with CRM IDs
      name: `${submission.first_name} ${submission.last_name}`.trim(),
      email: submission.email || null,
      phone: submission.phone || null,
      organization: submission.organization || 'Not provided',
      role: submission.role || 'Not specified',
      source: 'behaviorschool',
      status: submission.status || 'new',
      current_challenges: submission.current_challenges || null,
      submitted_at: submission.submitted_at,
      archived: submission.archived || false,
      tags: ['behaviorschool', submission.status || 'new'].filter(Boolean)
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        submissions: transformed,
        count: transformed.length,
        source: 'behaviorschool.com'
      })
    };

  } catch (error) {
    console.error('Behaviorschool submissions proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        ok: false
      })
    };
  }
};