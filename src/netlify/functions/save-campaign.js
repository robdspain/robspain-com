const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { id, data } = JSON.parse(event.body);
        if (!id || !data) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing id or data' }) };
        }

        // In serverless, we can't write to the filesystem persistently.
        // Instead, we log the update and return success.
        // For true persistence, this should write to a database (Convex, KV store, etc.)
        console.log(`Campaign update: ${id}`, JSON.stringify(data));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: true, 
                id: id,
                note: 'Changes saved in browser. For permanent persistence, migrate to Convex on plan.behaviorschool.com.'
            })
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
