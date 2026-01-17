// src/netlify/functions/auth.js
exports.handler = async (event) => {
  const { GITHUB_CLIENT_ID } = process.env;
  
  if (!GITHUB_CLIENT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing GITHUB_CLIENT_ID environment variable" }),
    };
  }

  // Redirect user to GitHub for authorization
  const authorizationUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user`;

  return {
    statusCode: 302,
    headers: {
      Location: authorizationUrl,
      'Cache-Control': 'no-cache',
    },
    body: '',
  };
};
