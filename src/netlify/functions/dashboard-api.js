/**
 * Neo Dashboard API
 * Endpoints for Neo to interact with the dashboard
 * 
 * POST /api/quick-wins      - Add quick win
 * PATCH /api/quick-wins/:id - Complete/update
 * GET /api/projects         - List projects
 * PATCH /api/projects/:id   - Update progress
 * POST /api/content         - Schedule content
 */

const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'neo-dashboard';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Simple API key auth (set NEO_DASHBOARD_API_KEY in Netlify env)
function checkAuth(event) {
  const apiKey = process.env.NEO_DASHBOARD_API_KEY;
  if (!apiKey) return true; // No auth configured
  
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  return token === apiKey;
}

// Get data from Netlify Blobs
async function getData() {
  try {
    const store = getStore(STORE_NAME);
    const data = await store.get('dashboard-data', { type: 'json' });
    return data || { projects: [], quickWins: [], content: [] };
  } catch (err) {
    console.error('Error loading data:', err);
    return { projects: [], quickWins: [], content: [] };
  }
}

// Save data to Netlify Blobs
async function saveData(data) {
  try {
    const store = getStore(STORE_NAME);
    await store.setJSON('dashboard-data', data);
    return true;
  } catch (err) {
    console.error('Error saving data:', err);
    return false;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  
  // Check auth
  if (!checkAuth(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  const path = event.path.replace('/.netlify/functions/dashboard-api', '').replace('/api', '');
  const method = event.httpMethod;
  
  try {
    const data = await getData();
    let body = {};
    
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        body = {};
      }
    }
    
    // Route: GET /projects
    if (path === '/projects' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ projects: data.projects })
      };
    }
    
    // Route: PATCH /projects/:id
    if (path.startsWith('/projects/') && method === 'PATCH') {
      const projectId = path.replace('/projects/', '');
      const project = data.projects.find(p => p.id === projectId);
      
      if (!project) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Project not found' })
        };
      }
      
      // Update allowed fields
      const allowedFields = ['name', 'emoji', 'status', 'progress', 'phase', 'blockedReason', 'prdPath'];
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          project[field] = body[field];
        }
      });
      project.lastUpdated = new Date().toISOString();
      
      await saveData(data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ project })
      };
    }
    
    // Route: POST /projects
    if (path === '/projects' && method === 'POST') {
      const newProject = {
        id: body.id || generateId(),
        name: body.name || 'New Project',
        emoji: body.emoji || '📌',
        status: body.status || 'active',
        progress: body.progress || 0,
        phase: body.phase || 'Planning',
        blockedReason: body.blockedReason || '',
        prdPath: body.prdPath || '',
        lastUpdated: new Date().toISOString()
      };
      
      data.projects.push(newProject);
      await saveData(data);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ project: newProject })
      };
    }
    
    // Route: GET /quick-wins
    if (path === '/quick-wins' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ quickWins: data.quickWins })
      };
    }
    
    // Route: POST /quick-wins
    if (path === '/quick-wins' && method === 'POST') {
      const newWin = {
        id: generateId(),
        title: body.title || 'Quick Win',
        description: body.description || '',
        estimateMinutes: body.estimateMinutes || 10,
        type: body.type || 'action',
        previewUrl: body.previewUrl || '',
        actionUrl: body.actionUrl || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null,
        relatedProject: body.relatedProject || ''
      };
      
      data.quickWins.unshift(newWin);
      await saveData(data);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ quickWin: newWin })
      };
    }
    
    // Route: PATCH /quick-wins/:id
    if (path.startsWith('/quick-wins/') && method === 'PATCH') {
      const winId = path.replace('/quick-wins/', '');
      const win = data.quickWins.find(w => w.id === winId);
      
      if (!win) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Quick win not found' })
        };
      }
      
      // Update status
      if (body.status === 'done' && win.status !== 'done') {
        win.status = 'done';
        win.completedAt = new Date().toISOString();
      } else if (body.status === 'pending') {
        win.status = 'pending';
        win.completedAt = null;
      }
      
      // Update other fields
      ['title', 'description', 'estimateMinutes', 'type', 'previewUrl', 'actionUrl'].forEach(field => {
        if (body[field] !== undefined) {
          win[field] = body[field];
        }
      });
      
      await saveData(data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ quickWin: win })
      };
    }
    
    // Route: GET /content
    if (path === '/content' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ content: data.content })
      };
    }
    
    // Route: POST /content
    if (path === '/content' && method === 'POST') {
      const newContent = {
        id: generateId(),
        title: body.title || 'Content Item',
        channel: body.channel || 'email',
        scheduledDate: body.scheduledDate || new Date().toISOString().split('T')[0],
        status: body.status || 'idea',
        contentDraft: body.contentDraft || '',
        previewUrl: body.previewUrl || '',
        publishUrl: body.publishUrl || '',
        tags: body.tags || []
      };
      
      data.content.push(newContent);
      await saveData(data);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ content: newContent })
      };
    }
    
    // Route: PATCH /content/:id
    if (path.startsWith('/content/') && method === 'PATCH') {
      const contentId = path.replace('/content/', '');
      const content = data.content.find(c => c.id === contentId);
      
      if (!content) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Content not found' })
        };
      }
      
      // Update allowed fields
      ['title', 'channel', 'scheduledDate', 'status', 'contentDraft', 'previewUrl', 'publishUrl', 'tags'].forEach(field => {
        if (body[field] !== undefined) {
          content[field] = body[field];
        }
      });
      
      await saveData(data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ content })
      };
    }
    
    // Route: GET /sync - Get all dashboard data
    if (path === '/sync' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }
    
    // Route: POST /sync - Replace all dashboard data
    if (path === '/sync' && method === 'POST') {
      const newData = {
        projects: body.projects || data.projects,
        quickWins: body.quickWins || data.quickWins,
        content: body.content || data.content
      };
      
      await saveData(newData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: newData })
      };
    }
    
    // Not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found', path, method })
    };
    
  } catch (err) {
    console.error('Dashboard API error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: err.message })
    };
  }
};
