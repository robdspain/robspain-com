const fs = require('fs').promises;
const path = require('path');

// Simple in-memory rate limiting
const ipToHits = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipToHits.get(ip);
  
  if (!entry) {
    ipToHits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipToHits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Rate limiting
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             event.headers['x-real-ip'] || 
             'unknown';
  
  if (isRateLimited(ip)) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { email, source, name = '' } = data;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid email address' }),
      };
    }

    // Prepare email data
    const emailData = {
      email,
      name,
      source: source || 'unknown',
      timestamp: new Date().toISOString(),
      ip,
    };

    console.log('Email signup:', emailData);

    // TODO: Future integration points:
    // - ConvertKit: https://developers.convertkit.com/#add-subscriber-to-a-form
    // - Mailchimp: https://mailchimp.com/developer/marketing/api/list-members/
    // 
    // Example ConvertKit integration:
    // if (process.env.CONVERTKIT_API_KEY && process.env.CONVERTKIT_FORM_ID) {
    //   const response = await fetch(`https://api.convertkit.com/v3/forms/${process.env.CONVERTKIT_FORM_ID}/subscribe`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       api_key: process.env.CONVERTKIT_API_KEY,
    //       email: email,
    //       first_name: name,
    //       fields: { source: source }
    //     }),
    //   });
    // }

    // For now, just store locally in a JSON file
    // In production, replace this with your email service provider
    const emailsFilePath = path.join('/tmp', 'emails.json');
    
    let emails = [];
    try {
      const fileContent = await fs.readFile(emailsFilePath, 'utf-8');
      emails = JSON.parse(fileContent);
    } catch (err) {
      // File doesn't exist yet, that's okay
    }

    // Check for duplicates
    const existingEmail = emails.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          message: "You're already subscribed!",
          alreadySubscribed: true 
        }),
      };
    }

    emails.push(emailData);
    await fs.writeFile(emailsFilePath, JSON.stringify(emails, null, 2));

    // Send webhook notification if configured
    if (process.env.EMAIL_WEBHOOK_URL) {
      try {
        await fetch(process.env.EMAIL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Successfully subscribed!' 
      }),
    };

  } catch (error) {
    console.error('Error processing email signup:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to process signup' }),
    };
  }
};
