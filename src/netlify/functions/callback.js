// src/netlify/functions/callback.js
exports.handler = async (event) => {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
  const { code } = event.queryStringParameters;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variable" }),
    };
  }

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
        <head>
          <title>Authorizing...</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f1f5f9; color: #334155; }
            .content { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .spinner { border: 4px solid #e2e8f0; border-top: 4px solid #10b981; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="content">
            <div id="status-icon" class="spinner"></div>
            <div id="status-text">Authorizing with GitHub...</div>
            <p style="font-size: 0.875rem; color: #64748b; margin-top: 1rem;">This window should close automatically.</p>
          </div>
          <script>
            (function() {
              const statusText = document.getElementById("status-text");
              const statusIcon = document.getElementById("status-icon");

              function receiveMessage(e) {
                console.log("Callback received message:", e.data);
                if (e.data === "authorizing:github") {
                  const response = {
                    token: "${data.access_token}",
                    provider: "github"
                  };
                  
                  window.opener.postMessage(
                    "authorization:github:success:" + JSON.stringify(response),
                    e.origin
                  );
                  
                  statusText.innerText = "Success! Closing window...";
                  setTimeout(() => window.close(), 1000);
                }
              }

              if (!window.opener) {
                statusText.innerText = "Error: No opener window found. Please try logging in again.";
                statusIcon.style.display = "none";
                return;
              }

              window.addEventListener("message", receiveMessage, false);
              
              // Initial handshake
              console.log("Sending initial handshake...");
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
