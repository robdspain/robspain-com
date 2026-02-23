/**
 * Neo Dashboard v2 - Visual Project Dashboard
 * Features: Project cards, Quick Wins, Content Calendar
 */

const STORAGE_KEY = 'neo-dashboard-v2';

const CHANNEL_ICONS = {
  email: '📧',
  youtube: '🎥',
  linkedin: '💼',
  blog: '📝',
  twitter: '🐦'
};

const STATUS_LABELS = {
  idea: '💭 Idea',
  drafting: '✏️ Drafting',
  review: '🔍 Review',
  approved: '✅ Approved',
  published: '🚀 Published'
};

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(isoString);
}

function isToday(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

function isOverdue(dateStr, status) {
  if (status === 'published' || status === 'approved') return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
}

// Storage functions
const store = {
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

// Default data — real projects and actionable quick wins
const defaultData = {
  projects: [
    {
      id: 'schoolrbt',
      name: 'SchoolRBT',
      emoji: '📖',
      status: 'blocked',
      progress: 85,
      phase: 'Awaiting DNS',
      blockedReason: 'DNS for rbtstudy.behaviorschool.com needs to be pointed',
      lastUpdated: '2026-02-22T18:00:00Z',
      prdPath: ''
    },
    {
      id: 'ace-ceu',
      name: 'ACE CEU Platform',
      emoji: '🎓',
      status: 'active',
      progress: 45,
      phase: 'Building',
      blockedReason: '',
      lastUpdated: '2026-02-21T14:30:00Z',
      prdPath: ''
    },
    {
      id: 'iep-goal-writer',
      name: 'IEP Goal Writer',
      emoji: '📝',
      status: 'active',
      progress: 55,
      phase: 'Building',
      blockedReason: '',
      lastUpdated: '2026-02-23T09:00:00Z',
      prdPath: ''
    },
    {
      id: 'observationpro',
      name: 'ObservationPro Watch',
      emoji: '⌚',
      status: 'active',
      progress: 30,
      phase: 'Prototyping',
      blockedReason: '',
      lastUpdated: '2026-02-19T11:00:00Z',
      prdPath: ''
    },
    {
      id: 'reunifyscience',
      name: 'ReunifyScience Tools',
      emoji: '🔬',
      status: 'active',
      progress: 70,
      phase: 'Beta',
      blockedReason: '',
      lastUpdated: '2026-02-20T16:45:00Z',
      prdPath: ''
    },
    {
      id: 'kcusd-hub',
      name: 'KCUSD Behavior Hub',
      emoji: '🏫',
      status: 'done',
      progress: 100,
      phase: 'Launched',
      blockedReason: '',
      lastUpdated: '2026-02-10T08:00:00Z',
      prdPath: ''
    },
    {
      id: 'behavior-school-pro',
      name: 'Behavior School Pro',
      emoji: '🧠',
      status: 'blocked',
      progress: 25,
      phase: 'Auth Setup',
      blockedReason: 'Needs Google OAuth credentials configured',
      lastUpdated: '2026-02-18T13:20:00Z',
      prdPath: ''
    }
  ],
  quickWins: [
    {
      id: 'r2-credentials',
      title: 'Set up Cloudflare R2 credentials for video hosting',
      description: 'Log into Cloudflare dashboard, create R2 API token, and add to .env — needed to unblock video uploads',
      estimateMinutes: 10,
      type: 'action',
      previewUrl: '',
      actionUrl: 'https://dash.cloudflare.com/',
      status: 'pending',
      createdAt: '2026-02-23T08:00:00Z',
      completedAt: null,
      relatedProject: ''
    },
    {
      id: 'stripe-price-id',
      title: 'Create Stripe price ID for ACE CEU subscription',
      description: 'Set up a recurring price in Stripe dashboard and copy the price_xxx ID into the config',
      estimateMinutes: 10,
      type: 'action',
      previewUrl: '',
      actionUrl: 'https://dashboard.stripe.com/products',
      status: 'pending',
      createdAt: '2026-02-23T08:00:00Z',
      completedAt: null,
      relatedProject: 'ace-ceu'
    },
    {
      id: 'resend-pro',
      title: 'Upgrade to Resend Pro for transactional email',
      description: 'Current free tier is hitting limits. Upgrade plan and verify sending domain',
      estimateMinutes: 5,
      type: 'action',
      previewUrl: '',
      actionUrl: 'https://resend.com/settings/billing',
      status: 'pending',
      createdAt: '2026-02-23T08:00:00Z',
      completedAt: null,
      relatedProject: ''
    },
    {
      id: 'google-oauth',
      title: 'Configure Google OAuth for Behavior School Pro',
      description: 'Create OAuth 2.0 client ID in Google Cloud Console and add credentials to project config',
      estimateMinutes: 15,
      type: 'action',
      previewUrl: '',
      actionUrl: 'https://console.cloud.google.com/apis/credentials',
      status: 'pending',
      createdAt: '2026-02-23T08:00:00Z',
      completedAt: null,
      relatedProject: 'behavior-school-pro'
    },
    {
      id: 'dns-rbtstudy',
      title: 'Point DNS for rbtstudy.behaviorschool.com',
      description: 'Add CNAME record in Cloudflare DNS to point rbtstudy subdomain to hosting provider',
      estimateMinutes: 5,
      type: 'action',
      previewUrl: '',
      actionUrl: 'https://dash.cloudflare.com/',
      status: 'pending',
      createdAt: '2026-02-23T08:00:00Z',
      completedAt: null,
      relatedProject: 'schoolrbt'
    }
  ],
  content: [],
  weekOffset: 0
};

// Get data with defaults
function getData() {
  const stored = store.load();
  if (!stored) return { ...defaultData };

  // Merge with defaults to ensure all fields exist
  return {
    projects: stored.projects || defaultData.projects,
    quickWins: stored.quickWins || defaultData.quickWins,
    content: stored.content || defaultData.content,
    weekOffset: stored.weekOffset || 0
  };
}

function saveData(data) {
  store.save(data);
}

// ===== PROJECTS RENDERING =====
function renderProjects(data) {
  const container = document.getElementById('project-grid');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Separate active/done from blocked
  const activeProjects = data.projects.filter(p => p.status !== 'blocked');
  const blockedProjects = data.projects.filter(p => p.status === 'blocked');
  
  // Render active projects
  activeProjects.forEach((project) => {
    const card = createProjectCard(project, data);
    container.appendChild(card);
  });
  
  // Render blocked section if any
  if (blockedProjects.length > 0) {
    renderBlockedSection(blockedProjects, data, container);
  }
}

function createProjectCard(project, data) {
  const card = document.createElement('div');
  card.className = 'project-card';
  card.dataset.status = project.status;
  
  const progressPercent = Math.min(100, Math.max(0, project.progress));
  const lastUpdated = project.lastUpdated ? formatRelativeTime(project.lastUpdated) : '';
  
  card.innerHTML = `
    <div class="project-header">
      <div class="project-title">
        <span class="project-emoji">${project.emoji}</span>
        <span>${project.name}</span>
      </div>
      <span class="project-status">${project.status === 'done' ? '✅ Done' : project.status}</span>
    </div>
    <div class="project-progress">
      <span style="width: ${progressPercent}%"></span>
    </div>
    <div class="project-meta">
      <span>${project.phase} • ${progressPercent}%</span>
      ${lastUpdated ? `<span class="project-last-updated">Updated ${lastUpdated}</span>` : ''}
    </div>
    ${project.prdPath ? `<a href="${project.prdPath}" class="project-prd-link" onclick="event.stopPropagation()">📄 View PRD</a>` : ''}
    <div class="project-details">
      <label>Phase</label>
      <input type="text" value="${escapeHtml(project.phase)}" data-field="phase" />
      <label>Status</label>
      <select data-field="status">
        ${['active', 'blocked', 'done', 'paused'].map(s =>
          `<option value="${s}" ${s === project.status ? 'selected' : ''}>${s}</option>`
        ).join('')}
      </select>
      <label>Progress</label>
      <input type="range" min="0" max="100" value="${project.progress}" data-field="progress" />
      <label>Blocked Reason</label>
      <textarea rows="2" data-field="blockedReason">${escapeHtml(project.blockedReason || '')}</textarea>
      <label>PRD Path</label>
      <input type="text" value="${escapeHtml(project.prdPath || '')}" data-field="prdPath" placeholder="/path/to/prd.md" />
      <button type="button" class="update-btn">Update Project</button>
    </div>
  `;
  
  // Toggle expand on card click
  card.addEventListener('click', (e) => {
    if (e.target.closest('.project-details') && !e.target.classList.contains('update-btn')) return;
    if (e.target.classList.contains('project-prd-link')) return;
    card.classList.toggle('expanded');
  });
  
  // Handle update button
  const updateBtn = card.querySelector('.update-btn');
  updateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    const phaseInput = card.querySelector('[data-field="phase"]');
    const statusSelect = card.querySelector('[data-field="status"]');
    const progressInput = card.querySelector('[data-field="progress"]');
    const blockedInput = card.querySelector('[data-field="blockedReason"]');
    const prdInput = card.querySelector('[data-field="prdPath"]');
    
    project.phase = phaseInput.value;
    project.status = statusSelect.value;
    project.progress = Number(progressInput.value);
    project.blockedReason = blockedInput.value;
    project.prdPath = prdInput.value;
    project.lastUpdated = new Date().toISOString();
    
    saveData(data);
    renderProjects(data);
  });
  
  return card;
}

function renderBlockedSection(blockedProjects, data, container) {
  const section = document.createElement('div');
  section.className = 'blocked-section';
  section.innerHTML = `<h3>⏸️ Blocked / Waiting on Rob</h3>`;
  
  blockedProjects.forEach(project => {
    const item = document.createElement('div');
    item.className = 'blocked-item';
    item.innerHTML = `
      <div class="blocked-info">
        <div class="blocked-title">${project.emoji} ${project.name}</div>
        <div class="blocked-reason">${project.blockedReason || 'No reason specified'}</div>
      </div>
      <button type="button" data-project-id="${project.id}">Unblock</button>
    `;
    
    item.querySelector('button').addEventListener('click', () => {
      project.status = 'active';
      project.blockedReason = '';
      project.lastUpdated = new Date().toISOString();
      saveData(data);
      renderProjects(data);
    });
    
    section.appendChild(item);
  });
  
  // Add to parent of project grid
  container.parentElement.appendChild(section);
}

// ===== QUICK WINS RENDERING =====
function renderQuickWins(data) {
  const container = document.getElementById('quickwin-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Sort by estimate (fastest first), then pending before done
  const sortedWins = [...data.quickWins].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    return a.estimateMinutes - b.estimateMinutes;
  });
  
  sortedWins.forEach(win => {
    const item = createQuickWinItem(win, data);
    container.appendChild(item);
  });
  
  // Update stats
  updateQuickWinStats(data);
}

function createQuickWinItem(win, data) {
  const item = document.createElement('div');
  item.className = `quickwin-item ${win.status === 'done' ? 'done' : ''}`;
  item.dataset.id = win.id;
  
  const typeEmoji = {
    approve: '✅',
    review: '📄',
    decision: '🤔',
    action: '⚡',
    signup: '🔗'
  }[win.type] || '📌';
  
  item.innerHTML = `
    <div class="quickwin-top">
      <div class="quickwin-meta">
        <div class="quickwin-title">${escapeHtml(win.title)}</div>
        <div class="quickwin-info">
          <span class="quickwin-estimate">${win.estimateMinutes} min</span>
          <span class="quickwin-type">${typeEmoji} ${win.type}</span>
        </div>
      </div>
      <div class="quickwin-actions">
        ${win.previewUrl ? `<button class="btn-preview" data-action="preview" title="Preview">👁️</button>` : ''}
        ${win.actionUrl ? `<button class="btn-preview" data-action="go" title="Go to URL">🔗</button>` : ''}
        <button class="btn-done" data-action="toggle">${win.status === 'done' ? '↩️' : '✓'}</button>
        <button class="btn-delete" data-action="delete">×</button>
      </div>
    </div>
    ${win.description ? `<div class="quickwin-description">${escapeHtml(win.description)}</div>` : ''}
  `;
  
  // Handle actions
  item.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      
      if (action === 'toggle') {
        const wasCompleted = win.status === 'done';
        win.status = wasCompleted ? 'pending' : 'done';
        win.completedAt = wasCompleted ? null : new Date().toISOString();
        
        if (!wasCompleted) {
          // Celebration animation
          item.classList.add('celebrating');
          setTimeout(() => item.classList.remove('celebrating'), 400);
        }
        
        saveData(data);
        renderQuickWins(data);
      }
      
      if (action === 'delete') {
        data.quickWins = data.quickWins.filter(w => w.id !== win.id);
        saveData(data);
        renderQuickWins(data);
      }
      
      if (action === 'preview' && win.previewUrl) {
        window.open(win.previewUrl, '_blank');
      }
      
      if (action === 'go' && win.actionUrl) {
        window.open(win.actionUrl, '_blank');
      }
    });
  });
  
  return item;
}

function updateQuickWinStats(data) {
  const today = new Date().toISOString().split('T')[0];
  const completedToday = data.quickWins.filter(w => {
    if (w.status !== 'done' || !w.completedAt) return false;
    return w.completedAt.split('T')[0] === today;
  }).length;
  
  // Update stats display
  let statsEl = document.querySelector('.quickwin-stats');
  if (!statsEl) {
    const header = document.querySelector('.neo-quickwins h2');
    if (header) {
      statsEl = document.createElement('span');
      statsEl.className = 'quickwin-stats';
      header.parentElement.insertBefore(statsEl, header.nextSibling);
    }
  }
  
  if (statsEl) {
    statsEl.textContent = `✅ ${completedToday} done today`;
  }
}

function setupQuickWinForm(data) {
  const form = document.getElementById('quickwin-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const titleInput = form.querySelector('#quickwin-title');
    const estimateSelect = form.querySelector('#quickwin-estimate');
    const typeSelect = form.querySelector('#quickwin-type');
    
    const title = titleInput.value.trim();
    if (!title) return;
    
    data.quickWins.unshift({
      id: generateId(),
      title,
      description: '',
      estimateMinutes: Number(estimateSelect.value),
      type: typeSelect.value,
      previewUrl: '',
      actionUrl: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      relatedProject: ''
    });
    
    saveData(data);
    form.reset();
    renderQuickWins(data);
  });
}

// ===== WEEKLY CALENDAR RENDERING =====
const WEEK_CHANNELS = ['linkedin', 'twitter', 'email'];
const CHANNEL_LABELS = {
  linkedin: '💼 LinkedIn',
  twitter: '🐦 Twitter/X',
  email: '📧 Email'
};

function getWeekDates(offset) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function renderCalendar(data) {
  const grid = document.getElementById('calendar-grid');
  const label = document.getElementById('calendar-label');
  if (!grid || !label) return;

  const weekDates = getWeekDates(data.weekOffset || 0);
  const todayStr = new Date().toISOString().split('T')[0];

  // Week label
  const startStr = weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  label.textContent = `${startStr} – ${endStr}`;

  grid.innerHTML = '';

  // Build the weekly grid: channel rows x 7 day columns
  // Header row: empty corner + day headers
  const corner = document.createElement('div');
  corner.className = 'week-corner';
  grid.appendChild(corner);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  weekDates.forEach((date, i) => {
    const header = document.createElement('div');
    const dateStr = date.toISOString().split('T')[0];
    header.className = 'week-day-header' + (dateStr === todayStr ? ' today' : '');
    header.innerHTML = `<span class="week-day-name">${dayNames[i]}</span><span class="week-day-date">${date.getDate()}</span>`;
    grid.appendChild(header);
  });

  // Channel rows
  WEEK_CHANNELS.forEach(channel => {
    // Row label
    const rowLabel = document.createElement('div');
    rowLabel.className = 'week-channel-label';
    rowLabel.dataset.channel = channel;
    rowLabel.textContent = CHANNEL_LABELS[channel];
    grid.appendChild(rowLabel);

    // Day cells for this channel
    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const cell = document.createElement('div');
      cell.className = 'week-cell';
      if (dateStr === todayStr) cell.classList.add('today');
      cell.dataset.channel = channel;
      cell.dataset.date = dateStr;

      // Find content items for this cell
      const items = data.content.filter(
        item => item.scheduledDate === dateStr && item.channel === channel
      );

      if (items.length > 0) {
        items.forEach(item => {
          const badge = document.createElement('div');
          badge.className = 'week-item';
          badge.dataset.status = item.status;
          if (isOverdue(item.scheduledDate, item.status)) {
            badge.classList.add('overdue');
          }
          badge.innerHTML = `<span class="week-item-title">${escapeHtml(truncate(item.title, 22))}</span>`;
          badge.title = `${item.title} (${item.status})`;
          cell.appendChild(badge);
        });
      } else {
        // Empty placeholder slot
        const placeholder = document.createElement('div');
        placeholder.className = 'week-placeholder';
        placeholder.innerHTML = '<span>+</span>';
        placeholder.title = `Schedule ${CHANNEL_LABELS[channel]} for ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
        placeholder.addEventListener('click', () => {
          // Pre-fill form
          const titleInput = document.getElementById('content-title');
          const channelSelect = document.getElementById('content-channel');
          const dateInput = document.getElementById('content-date');
          if (titleInput && channelSelect && dateInput) {
            channelSelect.value = channel;
            dateInput.value = dateStr;
            titleInput.focus();
            // Scroll form into view
            titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        cell.appendChild(placeholder);
      }

      grid.appendChild(cell);
    });
  });

  renderUpcoming(data);
  renderContentWarnings(data);
}

function renderUpcoming(data) {
  const container = document.getElementById('calendar-upcoming');
  if (!container) return;
  
  container.innerHTML = '<h3>📋 Upcoming Content</h3>';
  
  const today = new Date().toISOString().split('T')[0];
  const upcoming = [...data.content]
    .filter(item => item.scheduledDate >= today && item.status !== 'published')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);
  
  if (upcoming.length === 0) {
    container.innerHTML += '<p style="color: var(--neo-slate); font-size: 0.9rem;">No upcoming content scheduled.</p>';
    return;
  }
  
  upcoming.forEach(item => {
    const row = document.createElement('div');
    row.className = 'calendar-upcoming-item';
    
    row.innerHTML = `
      <div class="upcoming-info">
        <strong>${CHANNEL_ICONS[item.channel] || ''} ${escapeHtml(item.title)}</strong>
        <div class="upcoming-meta">
          <span>${formatDate(item.scheduledDate)}</span>
          <span class="upcoming-status" data-status="${item.status}">${STATUS_LABELS[item.status] || item.status}</span>
        </div>
      </div>
      <div class="upcoming-actions">
        ${item.status === 'review' ? '<button class="btn-approve" data-action="approve">✓ Approve</button>' : ''}
        <button class="btn-reschedule" data-action="reschedule">📅</button>
      </div>
    `;
    
    // Handle actions
    row.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        
        if (action === 'approve') {
          item.status = 'approved';
          saveData(data);
          renderCalendar(data);
        }
        
        if (action === 'reschedule') {
          const newDate = prompt('New date (YYYY-MM-DD):', item.scheduledDate);
          if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            item.scheduledDate = newDate;
            saveData(data);
            renderCalendar(data);
          }
        }
      });
    });
    
    container.appendChild(row);
  });
}

function renderContentWarnings(data) {
  const warning = document.getElementById('calendar-warning');
  if (!warning) return;
  
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const todayStr = today.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  
  // Check for email in next 7 days
  const hasEmail = data.content.some(item => {
    if (item.channel !== 'email') return false;
    return item.scheduledDate >= todayStr && item.scheduledDate <= nextWeekStr;
  });
  
  // Check for overdue items
  const overdueCount = data.content.filter(item => 
    isOverdue(item.scheduledDate, item.status)
  ).length;
  
  if (overdueCount > 0) {
    warning.className = 'neo-alert error';
    warning.innerHTML = `⚠️ ${overdueCount} content item${overdueCount > 1 ? 's' : ''} overdue! Review and reschedule.`;
  } else if (!hasEmail) {
    warning.className = 'neo-alert warning';
    warning.innerHTML = '📧 No email scheduled in the next 7 days. Consider adding one.';
  } else {
    warning.className = 'neo-alert success';
    warning.innerHTML = '✅ Content calendar looks good for the next 7 days.';
  }
}

function setupContentForm(data) {
  const form = document.getElementById('calendar-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const titleInput = form.querySelector('#content-title');
    const channelSelect = form.querySelector('#content-channel');
    const dateInput = form.querySelector('#content-date');
    
    const title = titleInput.value.trim();
    const date = dateInput.value;
    
    if (!title || !date) return;
    
    data.content.push({
      id: generateId(),
      title,
      channel: channelSelect.value,
      scheduledDate: date,
      status: 'idea',
      contentDraft: '',
      previewUrl: '',
      publishUrl: '',
      tags: []
    });
    
    saveData(data);
    form.reset();
    renderCalendar(data);
  });
}

function setupCalendarControls(data) {
  const prevBtn = document.getElementById('calendar-prev');
  const nextBtn = document.getElementById('calendar-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      data.weekOffset = (data.weekOffset || 0) - 1;
      saveData(data);
      renderCalendar(data);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      data.weekOffset = (data.weekOffset || 0) + 1;
      saveData(data);
      renderCalendar(data);
    });
  }
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(str, len) {
  if (!str || str.length <= len) return str;
  return str.substring(0, len) + '…';
}

// ===== INITIALIZATION =====
function initDashboard() {
  const data = getData();
  saveData(data); // Ensure defaults are persisted
  
  renderProjects(data);
  renderQuickWins(data);
  setupQuickWinForm(data);
  renderCalendar(data);
  setupContentForm(data);
  setupCalendarControls(data);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

// ===== API INTEGRATION (for Neo) =====
// Expose functions for external API calls
window.NeoDashboard = {
  getData,
  saveData,
  
  // Add a quick win programmatically
  addQuickWin(win) {
    const data = getData();
    data.quickWins.unshift({
      id: generateId(),
      title: win.title,
      description: win.description || '',
      estimateMinutes: win.estimateMinutes || 10,
      type: win.type || 'action',
      previewUrl: win.previewUrl || '',
      actionUrl: win.actionUrl || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      relatedProject: win.relatedProject || ''
    });
    saveData(data);
    renderQuickWins(data);
    return true;
  },
  
  // Update project progress
  updateProject(projectId, updates) {
    const data = getData();
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return false;
    
    Object.assign(project, updates);
    project.lastUpdated = new Date().toISOString();
    
    saveData(data);
    renderProjects(data);
    return true;
  },
  
  // Schedule content
  scheduleContent(item) {
    const data = getData();
    data.content.push({
      id: generateId(),
      title: item.title,
      channel: item.channel,
      scheduledDate: item.scheduledDate,
      status: item.status || 'idea',
      contentDraft: item.contentDraft || '',
      previewUrl: item.previewUrl || '',
      publishUrl: item.publishUrl || '',
      tags: item.tags || []
    });
    saveData(data);
    renderCalendar(data);
    return true;
  },
  
  // Mark content as needing review
  markForReview(contentId) {
    const data = getData();
    const content = data.content.find(c => c.id === contentId);
    if (!content) return false;
    
    content.status = 'review';
    saveData(data);
    renderCalendar(data);
    return true;
  }
};
