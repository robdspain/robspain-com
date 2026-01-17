// src/netlify/functions/callback.js
exports.handler = async (event) => {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
  const { code } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing authorization code" }),
    };
  }

  try {
    // Exchange the code for an access token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.error_description || data.error }),
      };
    }

    // Return HTML that communicates with Decap CMS
    const content = `
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            (function() {
              function receiveMessage(e) {
                console.log("Receive message:", e);
                if (e.data === "authorizing:github") {
                  window.opener.postMessage(
                    'authorization:github:success:${JSON.stringify({
                      token: data.access_token,
                      provider: "github"
                    })}',
                    e.origin
                  );
                }
              }
              window.addEventListener("message", receiveMessage, false);
              window.opener.postMessage("authorizing:github", "*");
            })();
          </script>
        </body>
      </html>
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: content,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
