const store = {
  key: 'neo-dashboard-v2',
  load() {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }
};

const defaultData = {
  projects: [
    {
      id: 'iep-goal-writer',
      name: 'IEP Goal Writer',
      emoji: '📝',
      status: 'active',
      progress: 40,
      phase: 'Building',
      blockedReason: '',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'learning-platform',
      name: 'Learning Platform',
      emoji: '🎓',
      status: 'active',
      progress: 80,
      phase: 'Polish',
      blockedReason: '',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'kcusd',
      name: 'KCUSD Site',
      emoji: '🏫',
      status: 'done',
      progress: 100,
      phase: 'Done',
      blockedReason: '',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'neo-ios',
      name: 'Neo iOS App',
      emoji: '📱',
      status: 'paused',
      progress: 20,
      phase: 'Planning',
      blockedReason: 'Waiting on Apple dev account',
      lastUpdated: new Date().toISOString()
    }
  ],
  quickWins: [
    {
      id: 'approve-email-seq',
      title: 'Approve welcome email sequence',
      estimateMinutes: 10,
      type: 'approve',
      status: 'pending'
    },
    {
      id: 'review-landing-copy',
      title: 'Review IEP Writer landing copy',
      estimateMinutes: 5,
      type: 'review',
      status: 'pending'
    }
  ],
  content: [
    {
      id: 'yt-1',
      title: '5 mistakes school BCBAs make',
      channel: 'youtube',
      scheduledDate: nextDate(2),
      status: 'drafting'
    },
    {
      id: 'email-1',
      title: 'CalABA preview email',
      channel: 'email',
      scheduledDate: nextDate(3),
      status: 'review'
    }
  ],
  monthOffset: 0
};

function nextDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getData() {
  return store.load() || defaultData;
}

function saveData(data) {
  store.save(data);
}

function renderProjects(data) {
  const container = document.getElementById('project-grid');
  container.innerHTML = '';

  data.projects.forEach((project) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.status = project.status;

    card.innerHTML = `
      <div class="project-header">
        <div class="project-title">${project.emoji} ${project.name}</div>
        <span class="project-status">${project.status.toUpperCase()}</span>
      </div>
      <div class="project-progress"><span style="width:${project.progress}%"></span></div>
      <div class="project-meta">${project.phase} • ${project.progress}%</div>
      <div class="project-details">
        <label>Phase</label>
        <input type="text" value="${project.phase}" />
        <label>Status</label>
        <select>
          ${['active', 'blocked', 'done', 'paused']
            .map(
              (status) =>
                `<option value="${status}" ${status === project.status ? 'selected' : ''}>${status}</option>`
            )
            .join('')}
        </select>
        <label>Progress</label>
        <input type="range" min="0" max="100" value="${project.progress}" />
        <label>Blocked Reason</label>
        <textarea rows="2">${project.blockedReason || ''}</textarea>
        <button type="button">Update</button>
      </div>
    `;

    card.addEventListener('click', (event) => {
      if (event.target.tagName === 'BUTTON') return;
      card.classList.toggle('expanded');
    });

    const updateBtn = card.querySelector('button');
    updateBtn.addEventListener('click', () => {
      const [phaseInput, statusSelect, progressInput, blockedInput] = card.querySelectorAll(
        'input, select, textarea'
      );
      project.phase = phaseInput.value;
      project.status = statusSelect.value;
      project.progress = Number(progressInput.value);
      project.blockedReason = blockedInput.value;
      project.lastUpdated = new Date().toISOString();
      saveData(data);
      renderProjects(data);
    });

    container.appendChild(card);
  });
}

function renderQuickWins(data) {
  const container = document.getElementById('quickwin-list');
  container.innerHTML = '';

  data.quickWins.forEach((win) => {
    const item = document.createElement('div');
    item.className = `quickwin-item ${win.status === 'done' ? 'done' : ''}`;
    item.innerHTML = `
      <div class="quickwin-meta">
        <strong>${win.title}</strong>
        <span>${win.estimateMinutes} min • ${win.type}</span>
      </div>
      <div class="quickwin-actions">
        <button type="button" data-action="toggle">${win.status === 'done' ? 'Undo' : 'Done'}</button>
        <button type="button" class="secondary" data-action="delete">Remove</button>
      </div>
    `;

    item.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'toggle') {
          win.status = win.status === 'done' ? 'pending' : 'done';
        }
        if (action === 'delete') {
          data.quickWins = data.quickWins.filter((entry) => entry.id !== win.id);
        }
        saveData(data);
        renderQuickWins(data);
      });
    });

    container.appendChild(item);
  });
}

function setupQuickWinForm(data) {
  const form = document.getElementById('quickwin-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = form.querySelector('#quickwin-title').value.trim();
    const estimate = Number(form.querySelector('#quickwin-estimate').value);
    const type = form.querySelector('#quickwin-type').value;
    if (!title) return;
    data.quickWins.unshift({
      id: `qw-${Date.now()}`,
      title,
      estimateMinutes: estimate,
      type,
      status: 'pending'
    });
    saveData(data);
    form.reset();
    renderQuickWins(data);
  });
}

function renderCalendar(data) {
  const grid = document.getElementById('calendar-grid');
  const label = document.getElementById('calendar-label');
  const monthDate = new Date();
  monthDate.setMonth(monthDate.getMonth() + data.monthOffset);
  monthDate.setDate(1);

  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  label.textContent = monthName;

  const startDay = monthDate.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  grid.innerHTML = '';
  for (let i = 0; i < startDay; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'calendar-cell';
    empty.style.opacity = '0.35';
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    const dateString = new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    cell.innerHTML = `<div class="day">${day}</div>`;

    data.content
      .filter((item) => item.scheduledDate === dateString)
      .forEach((item) => {
        const badge = document.createElement('div');
        badge.className = 'calendar-item';
        badge.dataset.channel = item.channel;
        badge.textContent = item.title;
        cell.appendChild(badge);
      });

    grid.appendChild(cell);
  }

  renderUpcoming(data);
  renderContentWarnings(data);
}

function renderUpcoming(data) {
  const upcoming = document.getElementById('calendar-upcoming');
  upcoming.innerHTML = '';

  const items = [...data.content]
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
    .slice(0, 6);

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'calendar-upcoming-item';
    row.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <div style="font-size:0.8rem; color:#64748b;">${item.channel} • ${item.status}</div>
      </div>
      <div style="font-weight:700;">${new Date(item.scheduledDate).toLocaleDateString()}</div>
    `;
    upcoming.appendChild(row);
  });
}

function setupContentForm(data) {
  const form = document.getElementById('calendar-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = form.querySelector('#content-title').value.trim();
    const channel = form.querySelector('#content-channel').value;
    const date = form.querySelector('#content-date').value;
    if (!title || !date) return;
    data.content.push({
      id: `content-${Date.now()}`,
      title,
      channel,
      scheduledDate: date,
      status: 'idea'
    });
    saveData(data);
    form.reset();
    renderCalendar(data);
  });
}

function renderContentWarnings(data) {
  const warning = document.getElementById('calendar-warning');
  const weekStart = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(weekStart.getDate() + 7);
  const hasEmail = data.content.some((item) => {
    if (item.channel !== 'email') return false;
    const date = new Date(item.scheduledDate);
    return date >= weekStart && date <= weekEnd;
  });

  warning.textContent = hasEmail
    ? 'Email coverage looks good for the next 7 days.'
    : 'No email scheduled in the next 7 days. Consider adding one.';
}

function setupCalendarControls(data) {
  document.getElementById('calendar-prev').addEventListener('click', () => {
    data.monthOffset -= 1;
    saveData(data);
    renderCalendar(data);
  });
  document.getElementById('calendar-next').addEventListener('click', () => {
    data.monthOffset += 1;
    saveData(data);
    renderCalendar(data);
  });
}

function initDashboard() {
  const data = getData();
  saveData(data);

  renderProjects(data);
  renderQuickWins(data);
  setupQuickWinForm(data);
  renderCalendar(data);
  setupContentForm(data);
  setupCalendarControls(data);
}

document.addEventListener('DOMContentLoaded', initDashboard);
