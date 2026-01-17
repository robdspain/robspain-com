// Netlify Functions handler for Mailgun email sending
const mailgun = require('mailgun-js');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse the request body
        const data = JSON.parse(event.body);
        const { name, email, subject, message } = data;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid email format' })
            };
        }

        // Initialize Mailgun (use environment variables)
        const mg = mailgun({
            apiKey: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN
        });

        // Prepare email content
        const emailContent = `
New contact form submission from ${name}

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from robspain.com contact form
Time: ${new Date().toISOString()}
        `.trim();

        // Email data
        const emailData = {
            from: `Contact Form <noreply@${process.env.MAILGUN_DOMAIN}>`,
            to: process.env.TO_EMAIL || 'rob@robspain.com',
            subject: `Contact Form: ${subject}`,
            text: emailContent,
            'h:Reply-To': email
        };

        // Send email via Mailgun
        await mg.messages().send(emailData);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Configure this for your domain in production
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({
                success: true,
                message: 'Email sent successfully'
            })
        };

    } catch (error) {
        console.error('Email sending error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Failed to send email',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};