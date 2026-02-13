const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// Path to CRM database (will be bundled with the function)
const DB_PATH = path.join(__dirname, 'crm.db');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'private, max-age=60',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const params = event.queryStringParameters || {};
  const { q, id, tag, tags } = params;

  try {
    // Load database
    const SQL = await initSqlJs();
    const dbBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(dbBuffer);

    // Route: GET /api/crm/tags - list all tags
    if (tags === 'true' || event.path.endsWith('/tags')) {
      const results = db.exec(`
        SELECT tag, COUNT(DISTINCT contact_id) as count
        FROM contact_tags
        GROUP BY tag
        ORDER BY tag
      `);
      
      const tagList = results.length > 0 
        ? results[0].values.map(row => ({ tag: row[0], count: row[1] }))
        : [];
      
      db.close();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tags: tagList }) };
    }

    // Route: GET /api/crm?id=123 - get single contact with full details
    if (id) {
      const contactId = parseInt(id, 10);
      
      // Get contact
      const contactResults = db.exec(`
        SELECT id, name, email, phone, organization, role, notes, 
               datetime(created_at) as created_at, 
               datetime(updated_at) as updated_at
        FROM contacts
        WHERE id = ?
      `, [contactId]);
      
      if (!contactResults.length || !contactResults[0].values.length) {
        db.close();
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Contact not found' }) };
      }
      
      const contactRow = contactResults[0].values[0];
      const contact = {
        id: contactRow[0],
        name: contactRow[1],
        email: contactRow[2],
        phone: contactRow[3],
        organization: contactRow[4],
        role: contactRow[5],
        notes: contactRow[6],
        created_at: contactRow[7],
        updated_at: contactRow[8],
      };
      
      // Get tags
      const tagResults = db.exec(`
        SELECT tag FROM contact_tags WHERE contact_id = ?
      `, [contactId]);
      contact.tags = tagResults.length > 0 
        ? tagResults[0].values.map(row => row[0])
        : [];
      
      // Get interactions
      const interactionResults = db.exec(`
        SELECT id, note, datetime(interaction_date) as interaction_date
        FROM interactions
        WHERE contact_id = ?
        ORDER BY interaction_date DESC
      `, [contactId]);
      contact.interactions = interactionResults.length > 0
        ? interactionResults[0].values.map(row => ({
            id: row[0],
            note: row[1],
            date: row[2]
          }))
        : [];
      
      db.close();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, contact }) };
    }

    // Route: GET /api/crm?q=search_term - search contacts
    // Route: GET /api/crm?tag=tagname - filter by tag
    let query = `
      SELECT DISTINCT c.id, c.name, c.email, c.phone, c.organization, c.role
      FROM contacts c
    `;
    const queryParams = [];
    const whereClauses = [];

    if (tag) {
      query += ` INNER JOIN contact_tags ct ON c.id = ct.contact_id `;
      whereClauses.push('ct.tag = ?');
      queryParams.push(tag);
    }

    if (q) {
      const searchTerm = `%${q}%`;
      whereClauses.push(`(
        c.name LIKE ? OR 
        c.email LIKE ? OR 
        c.phone LIKE ? OR 
        c.organization LIKE ? OR 
        c.role LIKE ? OR 
        c.notes LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY c.name LIMIT 200';

    const results = db.exec(query, queryParams);
    
    // Get all contact IDs from results to fetch their tags
    const contacts = results.length > 0 
      ? results[0].values.map(row => ({
          id: row[0],
          name: row[1],
          email: row[2],
          phone: row[3],
          organization: row[4],
          role: row[5],
          tags: []
        }))
      : [];
    
    // Batch fetch tags for all contacts
    if (contacts.length > 0) {
      const contactIds = contacts.map(c => c.id).join(',');
      const tagResults = db.exec(`
        SELECT contact_id, tag 
        FROM contact_tags 
        WHERE contact_id IN (${contactIds})
      `);
      
      if (tagResults.length > 0) {
        const tagMap = {};
        tagResults[0].values.forEach(row => {
          const contactId = row[0];
          const tag = row[1];
          if (!tagMap[contactId]) tagMap[contactId] = [];
          tagMap[contactId].push(tag);
        });
        
        contacts.forEach(contact => {
          contact.tags = tagMap[contact.id] || [];
        });
      }
    }

    db.close();
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, contacts, count: contacts.length }) };
    
  } catch (error) {
    console.error('CRM API Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
