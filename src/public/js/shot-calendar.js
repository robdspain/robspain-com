const shotStore = {
  key: 'shot-calendar-v1',
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

const defaultShots = [
  {
    id: 'bst-revenue-webinar',
    title: 'Behavior Study Tools: webinar promo + CTA',
    date: nextDate(2),
    platform: 'YouTube + Email',
    offer: 'BCBA Exam Prep (subscription)',
    priority: 'high',
    revenueTag: 'Recurring MRR',
    status: 'scheduled'
  },
  {
    id: 'behaviorschool-pro-demo',
    title: 'BehaviorSchool Pro demo + enrollment CTA',
    date: nextDate(5),
    platform: 'LinkedIn + Web',
    offer: 'Pro cohort / onboarding',
    priority: 'high',
    revenueTag: 'High-ticket cohort',
    status: 'scheduled'
  },
  {
    id: 'reunify-science-case-study',
    title: 'Reunify Science case study + consultation CTA',
    date: nextDate(7),
    platform: 'YouTube + Website',
    offer: 'Consulting / expert witness',
    priority: 'high',
    revenueTag: 'High-ticket services',
    status: 'planned'
  },
  {
    id: 'behavior-school-rbt',
    title: 'RBT exam prep waitlist announcement',
    date: nextDate(9),
    platform: 'Email',
    offer: 'RBT track',
    priority: 'med',
    revenueTag: 'Entry subscription',
    status: 'planned'
  }
];

function nextDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getData() {
  return shotStore.load() || { shots: defaultShots };
}

function saveData(data) {
  shotStore.save(data);
}

function renderShots(data) {
  const container = document.getElementById('shot-list');
  container.innerHTML = '';
  const sorted = [...data.shots].sort((a, b) => {
    const priorityScore = (priority) => (priority === 'high' ? 3 : priority === 'med' ? 2 : 1);
    return priorityScore(b.priority) - priorityScore(a.priority) || new Date(a.date) - new Date(b.date);
  });

  sorted.forEach((shot) => {
    const item = document.createElement('article');
    item.className = 'shot-item';
    item.innerHTML = `
      <header>
        <div class="shot-title">${shot.title}</div>
        <span class="shot-priority ${shot.priority}">${shot.priority.toUpperCase()}</span>
      </header>
      <div class="shot-meta">
        <span>📅 ${new Date(shot.date).toLocaleDateString()}</span>
        <span>🎥 ${shot.platform}</span>
        <span>💰 ${shot.offer}</span>
        <span>${shot.revenueTag}</span>
        <span>Status: ${shot.status}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

function setupForm(data) {
  const form = document.getElementById('shot-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = form.querySelector('#shot-title').value.trim();
    const date = form.querySelector('#shot-date').value;
    const platform = form.querySelector('#shot-platform').value.trim();
    const offer = form.querySelector('#shot-offer').value.trim();
    const priority = form.querySelector('#shot-priority').value;
    if (!title || !date) return;

    data.shots.push({
      id: `shot-${Date.now()}`,
      title,
      date,
      platform,
      offer,
      priority,
      revenueTag: priority === 'high' ? 'Top revenue' : priority === 'med' ? 'Mid revenue' : 'Support',
      status: 'planned'
    });
    saveData(data);
    form.reset();
    renderShots(data);
  });
}

function init() {
  const data = getData();
  saveData(data);
  renderShots(data);
  setupForm(data);
}

document.addEventListener('DOMContentLoaded', init);
