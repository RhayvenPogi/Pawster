/* =============================================
   PAWSTER ADMIN DASHBOARD — admin_dashboard.js v2
   Chart.js 4 · Leaflet · PostgreSQL via PHP API
   ============================================= */
'use strict';

/* ─── STATE ─────────────────────────────────── */
let sidebarCollapsed = false;
let currentPanel     = 'overview';
let activityChart    = null;
let healthChart      = null;
let rejectTarget     = null;
let deleteTarget     = null;
const POLL_MS        = 30000;
let chartDataCache = { adoptions: [], rehome: [] };
let pollingTimer     = null;

/* ─── INIT ──────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadSession();
  refreshDash(true);
  initCharts();
  startPolling();
});

function startPolling() {
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = setInterval(() => {
    loadStats();
    if (currentPanel === 'users')     loadUsers();
    if (currentPanel === 'animals')   loadAnimals();
    if (currentPanel === 'adoptions') loadRequests('adoptions');
    if (currentPanel === 'rehome')    loadRequests('rehome');
    if (currentPanel === 'surveys')   loadSurveys();
    if (currentPanel === 'activity')  loadActivity();
    renderRecentRequests();
  }, POLL_MS);
}

/* ─── SESSION ───────────────────────────────── */
function loadSession() {
  if (typeof PAWSTER_USER === 'undefined') return;
  setText('sb-uname',      PAWSTER_USER.name);
  setText('tb-uname',      PAWSTER_USER.name);
  setText('greeting-name', PAWSTER_USER.name);
  setText('pd-fullname',   PAWSTER_USER.full);
  setText('pd-email',      PAWSTER_USER.email);
}

/* ─── API HELPER ────────────────────────────── */
async function api(action, data = {}) {
  const form = new FormData();
  form.append('action', action);
  for (const [k, v] of Object.entries(data)) form.append(k, v ?? '');
  const res = await fetch('admin_dashboard.php', { method: 'POST', body: form });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/* ─── STATS ─────────────────────────────────── */
async function loadStats() {
  try {
    const res = await api('stats');
    if (!res.success) return;
    const d = res.data;
    animCount('sv-animals', d.animals           || 0);
    animCount('sv-adopt',   d.adoptions         || 0);
    animCount('sv-rehome',  d.rehome            || 0);
    animCount('sv-users',   d.users             || 0);
    setText('nb-animals',   d.animals           || 0);
    setText('nb-adoptions', d.pending_adoptions || 0);
    setText('nb-rehome',    d.pending_rehome    || 0);
    setText('nb-surveys',   d.surveys           || 0);
    setText('nb-users',     d.users             || 0);
    updateHealthDonut(d.health_healthy || 0, d.health_care || 0, d.health_treatment || 0);
    const pending = (d.pending_adoptions || 0) + (d.pending_rehome || 0);
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = pending > 0 ? 'block' : 'none';
  } catch(e) { console.warn('Stats:', e); }
}

function animCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const step = Math.max(1, Math.ceil(Math.abs(target - start) / 18));
  let n = start;
  const t = setInterval(() => {
    n = target > n ? Math.min(n + step, target) : Math.max(n - step, target);
    el.textContent = n;
    if (n === target) clearInterval(t);
  }, 28);
}

/* ─── CHARTS ────────────────────────────────── */
function initCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = 'Nunito';
  Chart.defaults.font.weight = '700';
  Chart.defaults.color       = '#6a7a50';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyle    = 'circle';

  const ac = document.getElementById('chart-activity');
  if (ac) {
    if (activityChart) { activityChart.destroy(); activityChart = null; }
    activityChart = new Chart(ac, {
      type: 'line',
      data: buildChartData('weekly', [], []),
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 18, font: { size: 11, weight: '700' } } },
          tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(255,252,235,0.97)', titleColor: '#1a4a08', bodyColor: '#3a5020', borderColor: 'rgba(90,170,48,0.4)', borderWidth: 1.5, padding: 10, cornerRadius: 10 }
        },
        scales: {
          x: { grid: { color: 'rgba(180,140,60,0.10)' }, ticks: { font: { size: 10, weight: '800' } } },
          y: { grid: { color: 'rgba(180,140,60,0.10)' }, beginAtZero: true, ticks: { font: { size: 10, weight: '800' } } }
        },
        elements: { line: { tension: 0.42, borderWidth: 2.5 }, point: { radius: 4, hoverRadius: 6, borderColor: '#fff', borderWidth: 1.5 } },
        interaction: { mode: 'index', intersect: false }
      }
    });
  }

  const hc = document.getElementById('chart-health');
  if (hc) {
    if (healthChart) { healthChart.destroy(); healthChart = null; }
    healthChart = new Chart(hc, {
      type: 'doughnut',
      data: {
        labels: ['Healthy', 'Needs Care', 'Treatment'],
        datasets: [{ data: [0, 0, 0], backgroundColor: ['#5aaa30', '#c87820', '#7a3dc0'], hoverBackgroundColor: ['#4a9a20', '#b86810', '#6a2db0'], borderWidth: 0, hoverOffset: 5 }]
      },
      options: {
        cutout: '73%',
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: 'rgba(255,252,235,0.97)', titleColor: '#1a4a08', bodyColor: '#3a5020', borderColor: 'rgba(90,170,48,0.4)', borderWidth: 1.5, cornerRadius: 10 }
        },
        animation: { animateRotate: true, duration: 800 }
      }
    });
  }
}
function updateHealthDonut(h, c, t) {
  if (healthChart) { healthChart.data.datasets[0].data = [h || 0, c || 0, t || 0]; healthChart.update('active'); }
  const total = (h || 0) + (c || 0) + (t || 0);
  setText('donut-pct', total ? Math.round(((h || 0) / total) * 100) + '%' : '0%');
  setText('dl-h', h || 0); setText('dl-c', c || 0); setText('dl-t', t || 0);
}

function buildChartData(range, adoptions, rehome) {
  adoptions = (arguments.length >= 2) ? (adoptions || []) : chartDataCache.adoptions;
  rehome    = (arguments.length >= 3) ? (rehome    || []) : chartDataCache.rehome;
  const now = new Date();

  function bucketWeekly(records) {
    const days = [0,0,0,0,0,0,0];
    records.forEach(function(r) {
      const d = new Date(r.created_at || ''); if (isNaN(d)) return;
      const diff = Math.floor((now - d) / 86400000);
      if (diff >= 0 && diff < 7) days[6 - diff]++;
    });
    return days;
  }

  function bucketMonthly(records) {
    const months = Array(12).fill(0);
    records.forEach(function(r) {
      const d = new Date(r.created_at || ''); if (isNaN(d)) return;
      if (d.getFullYear() === now.getFullYear()) months[d.getMonth()]++;
    });
    return months;
  }

  if (range === 'weekly') {
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return {
      labels: dayLabels,
      datasets: [
        { label: 'Adoptions',       data: bucketWeekly(adoptions), borderColor: '#5aaa30', backgroundColor: 'rgba(90,170,48,0.10)',  fill: true, pointBackgroundColor: '#5aaa30' },
        { label: 'Rehome Requests', data: bucketWeekly(rehome),    borderColor: '#c87820', backgroundColor: 'rgba(200,120,32,0.10)', fill: true, pointBackgroundColor: '#c87820' }
      ]
    };
  }

  if (range === 'monthly') {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return {
      labels: MONTHS,
      datasets: [
        { label: 'Adoptions',       data: bucketMonthly(adoptions), borderColor: '#5aaa30', backgroundColor: 'rgba(90,170,48,0.10)',  fill: true, pointBackgroundColor: '#5aaa30' },
        { label: 'Rehome Requests', data: bucketMonthly(rehome),    borderColor: '#c87820', backgroundColor: 'rgba(200,120,32,0.10)', fill: true, pointBackgroundColor: '#c87820' }
      ]
    };
  }

  // yearly
  const allRecs = adoptions.concat(rehome);
  const ySet = new Set(allRecs.map(function(r){ return String(new Date(r.created_at||'').getFullYear()); }).filter(function(y){ return y !== 'NaN'; }));
  ySet.add(String(now.getFullYear()));
  const labels = Array.from(ySet).sort();
  return {
    labels: labels,
    datasets: [
      { label: 'Adoptions',       data: labels.map(function(y){ return adoptions.filter(function(r){ return String(new Date(r.created_at||'').getFullYear())===y; }).length; }), borderColor: '#5aaa30', backgroundColor: 'rgba(90,170,48,0.10)',  fill: true, pointBackgroundColor: '#5aaa30' },
      { label: 'Rehome Requests', data: labels.map(function(y){ return rehome.filter(function(r){    return String(new Date(r.created_at||'').getFullYear())===y; }).length; }), borderColor: '#c87820', backgroundColor: 'rgba(200,120,32,0.10)', fill: true, pointBackgroundColor: '#c87820' }
    ]
  };
}

function setChart(range, btn) {
  document.querySelectorAll('.dc-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (activityChart) { activityChart.data = buildChartData(range); activityChart.update(); }
}

/* ─── ANIMALS ───────────────────────────────── */
async function loadAnimals() {
  const tbody = document.getElementById('animals-tbody');
  if (!tbody) return;
  try {
    const res = await api('get_animals');
    if (!res.success || !res.data.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="td-empty"><i class="fas fa-paw"></i> ' + (res.success ? 'No animals yet. Add one!' : esc(res.message)) + '</td></tr>';
      return;
    }
    tbody.innerHTML = res.data.map(a => {
      const iconMap = { Dog:'fa-dog', Cat:'fa-cat', Bird:'fa-dove', Rabbit:'fa-hippo', Other:'fa-paw' };
      const bgMap   = { Dog:'#2a6010', Cat:'#7a3dc0', Bird:'#1a8a6a', Rabbit:'#c87820', Other:'#2060a0' };
      const icon = iconMap[a.type] || 'fa-paw';
      const bg   = bgMap[a.type]   || '#2a6010';
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:9px">
          <div style="width:30px;height:30px;border-radius:8px;background:${bg};display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.76rem;flex-shrink:0"><i class="fas ${icon}"></i></div>
          <strong>${esc(a.name)}</strong></div></td>
        <td>${esc(a.type)}</td>
        <td>${esc(a.breed || '—')}</td>
        <td>${esc(a.age || '—')}</td>
        <td><span class="badge ${healthBadge(a.health)}">${esc(a.health)}</span></td>
        <td><span class="badge ${statusBadge(a.status)}">${esc(a.status)}</span></td>
        <td><div class="tbl-actions">
          <button class="tbl-btn tbl-edit" onclick='openAnimalModal(${JSON.stringify(a)})'><i class="fas fa-pen"></i> Edit</button>
          <button class="tbl-btn tbl-del"  onclick="confirmDelete('animal',${a.id},'${escQ(a.name)}')"><i class="fas fa-trash-alt"></i></button>
        </div></td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="7" class="td-empty"><i class="fas fa-exclamation-circle"></i> Error loading</td></tr>'; }
}

function openAnimalModal(animal) {
  animal = animal || null;
  document.getElementById('am-id').value    = animal ? animal.id    : '';
  document.getElementById('am-name').value  = animal ? animal.name  : '';
  document.getElementById('am-breed').value = animal ? (animal.breed || '') : '';
  document.getElementById('am-age').value   = animal ? (animal.age   || '') : '';
  setSelect('am-type',   animal ? animal.type   : 'Dog');
  setSelect('am-health', animal ? animal.health : 'Healthy');
  setSelect('am-status', animal ? animal.status : 'Available');
  document.getElementById('am-title').innerHTML = animal ? '<i class="fas fa-pen"></i> Edit Animal' : '<i class="fas fa-paw"></i> Add Animal';
  openModal('animal-modal');
}

async function saveAnimal() {
  const id   = document.getElementById('am-id').value;
  const name = document.getElementById('am-name').value.trim();
  if (!name) { showToast('Animal name is required', 'error'); return; }
  try {
    const res = await api(id ? 'update_animal' : 'add_animal', {
      id, name,
      type:   document.getElementById('am-type').value,
      breed:  document.getElementById('am-breed').value.trim(),
      age:    document.getElementById('am-age').value.trim(),
      health: document.getElementById('am-health').value,
      status: document.getElementById('am-status').value
    });
    if (res.success) { closeModal('animal-modal'); loadAnimals(); loadStats(); showToast(id ? 'Animal updated!' : 'Animal added!', 'success'); }
    else showToast(res.message || 'Error saving', 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

/* ─── REQUEST CARDS ─────────────────────────── */
async function loadRequests(type) {
  const listId = type === 'adoptions' ? 'list-adoptions' : 'list-rehome';
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = '<div class="list-empty"><i class="fas fa-spinner spinning" style="font-size:1.5rem;opacity:0.4"></i><p>Loading…</p></div>';
  try {
    const res = await api('get_requests', { type });
    if (!res.success || !res.data.length) { list.innerHTML = '<div class="list-empty"><i class="fas fa-inbox"></i><p>No requests yet</p></div>'; return; }
    list.innerHTML = res.data.map((r, i) => buildReqCard(r, type, i)).join('');
  } catch(e) { list.innerHTML = '<div class="list-empty"><i class="fas fa-exclamation-circle"></i><p>Error loading</p></div>'; }
}

function buildReqCard(r, type, idx) {
  idx = idx || 0;
  const status   = r.status || 'Pending';
  const isPend   = status === 'Pending';
  const name     = esc(r.name || r.owner_name || r.full_name || 'Applicant');
  const initials = name.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').split(' ').map(function(w){return w[0]||'';}).slice(0,2).join('').toUpperCase() || '?';
  const delay    = (idx % 8) * 0.04;
  const avClass  = type === 'adoptions' ? '' : 'av-orange';

  const petName = esc(r.pet_name   || r.animal_name || r.petName    || r.animalName    || '—');
  const email   = esc(r.email      || r.contact     || '—');
  const phone   = esc(r.phone      || r.contact_no  || '—');
  const address = esc(r.address    || r.city        || '—');
  const reason  = esc(r.reason     || r.description || '');
  const rejectNote = esc(r.reject_note || '');

  const detailsHtml = type === 'adoptions'
    ? '<div class="rc-details">'
      + '<div class="rc-detail-item"><div class="rcd-label">Pet Requested</div><div class="rcd-value"><i class="fas fa-paw"></i>' + petName + '</div></div>'
      + '<div class="rc-detail-item"><div class="rcd-label">Email</div><div class="rcd-value"><i class="fas fa-envelope"></i>' + email + '</div></div>'
      + '<div class="rc-detail-item"><div class="rcd-label">Phone</div><div class="rcd-value"><i class="fas fa-phone"></i>' + phone + '</div></div>'
      + '<div class="rc-detail-item"><div class="rcd-label">Address</div><div class="rcd-value"><i class="fas fa-map-pin"></i>' + address + '</div></div>'
      + '</div>'
    : '<div class="rc-details">'
      + '<div class="rc-detail-item"><div class="rcd-label">Animal</div><div class="rcd-value"><i class="fas fa-paw"></i>' + petName + '</div></div>'
      + '<div class="rc-detail-item"><div class="rcd-label">Contact</div><div class="rcd-value"><i class="fas fa-envelope"></i>' + email + '</div></div>'
      + '<div class="rc-detail-item full"><div class="rcd-label">Address</div><div class="rcd-value rcd-wrap"><i class="fas fa-map-pin"></i>' + address + '</div></div>'
      + '</div>';

  const notesHtml = reason
    ? '<div class="rc-notes-wrap"><div class="rc-notes-label"><i class="fas fa-comment-dots"></i>' + (type === 'adoptions' ? 'Reason for Adoption' : 'Rehome Reason') + '</div><div class="rc-notes-text">' + reason + '</div></div>'
    : '';

  const rejectHtml = (rejectNote && status === 'Rejected')
    ? '<div class="rc-reject-note"><i class="fas fa-times-circle"></i> <strong>Rejection Reason:</strong> ' + rejectNote + '</div>'
    : '';

  const actionsHtml = isPend
    ? '<button class="rca-btn rca-approve" onclick="approveReq(\'' + type + '\',' + r.id + ')"><i class="fas fa-check"></i> Approve</button>'
      + '<button class="rca-btn rca-reject" onclick="openReject(\'' + type + '\',' + r.id + ')"><i class="fas fa-times"></i> Reject</button>'
    : '<button class="rca-btn rca-view"><i class="fas fa-' + (status === 'Approved' ? 'check-circle' : 'times-circle') + '"></i> ' + status + '</button>';

  return '<div class="req-card status-' + status + '" style="animation-delay:' + delay + 's">'
    + '<div class="rc-body">'
    + '<div class="rc-head">'
    +   '<div class="rc-identity">'
    +     '<div class="rc-avatar ' + avClass + '">' + initials + '</div>'
    +     '<div><div class="rc-name">' + name + '</div>'
    +     '<div class="rc-date"><i class="fas fa-clock"></i> ' + formatDate(r.created_at || r.date) + '</div></div>'
    +   '</div>'
    +   '<span class="rc-status-pill pill-' + status.toLowerCase() + '">' + status + '</span>'
    + '</div>'
    + '<div class="rc-divider"></div>'
    + detailsHtml
    + notesHtml
    + rejectHtml
    + '<div class="rc-actions">' + actionsHtml + '</div>'
    + '</div></div>';
}

async function filterReqs(type, status, btn) {
  const tabs = btn.closest('.tab-group') ? btn.closest('.tab-group').querySelectorAll('.tab-btn') : [];
  tabs.forEach(function(t){ t.classList.remove('active'); });
  btn.classList.add('active');
  const listId = type === 'adoptions' ? 'list-adoptions' : 'list-rehome';
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = '<div class="list-empty"><i class="fas fa-spinner spinning" style="font-size:1.5rem;opacity:0.4"></i><p>Loading…</p></div>';
  try {
    const res = await api('get_requests', { type: type, status: status === 'all' ? '' : status });
    if (!res.success || !res.data.length) { list.innerHTML = '<div class="list-empty"><i class="fas fa-inbox"></i><p>No results found</p></div>'; return; }
    list.innerHTML = res.data.map(function(r, i){ return buildReqCard(r, type, i); }).join('');
  } catch(e) {}
}

async function approveReq(type, id) {
  try {
    const res = await api('update_request', { type: type, id: id, status: 'Approved' });
    if (res.success) { loadRequests(type); loadStats(); showToast('Request approved!', 'success'); }
    else showToast(res.message, 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

function openReject(type, id) {
  rejectTarget = { type: type, id: id };
  document.getElementById('reject-reason').value = '';
  openModal('reject-modal');
}

async function confirmReject() {
  if (!rejectTarget) return;
  const reason = document.getElementById('reject-reason').value.trim();
  if (!reason) { showToast('Please enter a reason', 'error'); return; }
  try {
    const res = await api('update_request', { type: rejectTarget.type, id: rejectTarget.id, status: 'Rejected', reason: reason });
    if (res.success) {
      closeModal('reject-modal');
      loadRequests(rejectTarget.type); loadStats();
      rejectTarget = null;
      showToast('Request rejected', 'warn');
    } else showToast(res.message, 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

/* ─── SURVEYS ───────────────────────────────── */
async function loadSurveys() {
  const list = document.getElementById('list-surveys');
  if (!list) return;
  list.innerHTML = '<div class="list-empty"><i class="fas fa-spinner spinning" style="font-size:1.5rem;opacity:0.4"></i><p>Loading…</p></div>';
  try {
    const res = await api('get_surveys');
    if (!res.success || !res.data.length) { list.innerHTML = '<div class="list-empty"><i class="fas fa-clipboard-list"></i><p>No surveys submitted yet</p></div>'; return; }
    list.innerHTML = res.data.map(function(s, i) {
      const name     = esc(s.adopter_name || s.user_name || 'Adopter');
      const rawName  = (s.adopter_name || s.user_name || 'Adopter');
      const initials = rawName.split(' ').map(function(w){return w[0]||'';}).slice(0,2).join('').toUpperCase() || '?';
      const animal   = esc(s.animal_name || '—');
      const rating   = parseInt(s.rating || s.happiness_rating || s.happiness || 0);
      const notes    = esc(s.notes || s.comments || s.feedback || '—');
      const delay    = (i % 8) * 0.04;
      const starsHtml = [1,2,3,4,5].map(function(k){ return '<i class="fas fa-star ' + (k <= rating ? 'filled' : '') + '"></i>'; }).join('');
      return '<div class="req-card status-Submitted" style="animation-delay:' + delay + 's">'
        + '<div class="rc-body">'
        + '<div class="rc-head">'
        +   '<div class="rc-identity">'
        +     '<div class="rc-avatar av-teal">' + initials + '</div>'
        +     '<div><div class="rc-name">' + name + '</div>'
        +     '<div class="rc-date"><i class="fas fa-clock"></i> ' + formatDate(s.created_at) + '</div></div>'
        +   '</div>'
        +   '<span class="rc-status-pill pill-submitted"><i class="fas fa-check-circle"></i> Submitted</span>'
        + '</div>'
        + '<div class="rc-divider"></div>'
        + '<div class="rc-details">'
        +   '<div class="rc-detail-item"><div class="rcd-label">Animal Adopted</div><div class="rcd-value"><i class="fas fa-paw"></i>' + animal + '</div></div>'
        +   '<div class="rc-detail-item"><div class="rcd-label">Satisfaction</div><div class="rc-stars">' + starsHtml + '</div></div>'
        + '</div>'
        + '<div class="rc-notes-wrap"><div class="rc-notes-label"><i class="fas fa-comment-dots"></i> Feedback</div><div class="rc-notes-text">' + notes + '</div></div>'
        + '<div class="rc-actions"><button class="rca-btn rca-view"><i class="fas fa-eye"></i> View Details</button></div>'
        + '</div></div>';
    }).join('');
  } catch(e) { list.innerHTML = '<div class="list-empty"><i class="fas fa-exclamation-circle"></i><p>Error loading surveys</p></div>'; }
}

/* ─── USERS ─────────────────────────────────── */
async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  const role = document.getElementById('role-filter') ? document.getElementById('role-filter').value : 'all';
  try {
    const res = await api('get_users', { role: role });
    if (!res.success || !res.data.length) { tbody.innerHTML = '<tr><td colspan="7" class="td-empty"><i class="fas fa-users"></i> No users found</td></tr>'; return; }
    tbody.innerHTML = res.data.map(function(u) {
      const fn  = esc(u.first_name || '?');
      const ln  = esc(u.last_name  || '');
      const ini = ((u.first_name||'')[0]||'').toUpperCase() + ((u.last_name||'')[0]||'').toUpperCase();
      return '<tr>'
        + '<td><div style="display:flex;align-items:center;gap:10px">'
        +   '<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--green-mid),#2a7010);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:900;flex-shrink:0;border:1.5px solid var(--green-border)">' + (ini || '?') + '</div>'
        +   '<div><strong style="display:block;font-size:0.875rem">' + fn + ' ' + ln + '</strong>'
        +   '<span style="font-size:0.70rem;color:var(--text-muted)">ID #' + u.id + '</span></div>'
        + '</div></td>'
        + '<td style="font-size:0.84rem">' + esc(u.email) + '</td>'
        + '<td><span class="badge ' + roleBadge(u.role) + '">' + esc(u.role || 'user') + '</span></td>'
        + '<td><span class="badge ' + (u.is_active == 1 ? 'bg-green' : 'bg-red') + '">' + (u.is_active == 1 ? 'Active' : 'Inactive') + '</span></td>'
        + '<td style="font-size:0.80rem">' + formatDate(u.created_at) + '</td>'
        + '<td style="font-size:0.80rem">' + (u.last_login ? formatDate(u.last_login) : '<span style="color:var(--text-muted)">Never</span>') + '</td>'
        + '<td><div class="tbl-actions">'
        +   '<button class="tbl-btn tbl-edit" onclick=\'openUserModal(' + JSON.stringify(u) + ')\'><i class="fas fa-pen"></i> Edit</button>'
        +   '<button class="tbl-btn tbl-ban"  onclick="toggleUserStatus(' + u.id + ',' + u.is_active + ')"><i class="fas fa-' + (u.is_active == 1 ? 'ban' : 'check-circle') + '"></i></button>'
        +   '<button class="tbl-btn tbl-del"  onclick="confirmDelete(\'user\',' + u.id + ',\'' + escQ(fn + ' ' + ln) + '\')"><i class="fas fa-trash-alt"></i></button>'
        + '</div></td></tr>';
    }).join('');
    renderRecentUsers(res.data.slice(0, 5));
  } catch(e) { tbody.innerHTML = '<tr><td colspan="7" class="td-empty"><i class="fas fa-exclamation-circle"></i> Error loading users</td></tr>'; }
}

function openUserModal(user) {
  user = user || null;
  document.getElementById('um-id').value       = user ? user.id         : '';
  document.getElementById('um-fname').value    = user ? user.first_name : '';
  document.getElementById('um-lname').value    = user ? user.last_name  : '';
  document.getElementById('um-email').value    = user ? user.email      : '';
  document.getElementById('um-password').value = '';
  setSelect('um-role',   user ? user.role                           : 'user');
  setSelect('um-status', user ? String(user.is_active != null ? user.is_active : '1') : '1');
  document.getElementById('user-modal-title').innerHTML = user
    ? '<i class="fas fa-user-edit"></i> Edit User'
    : '<i class="fas fa-user-plus"></i> Add User';
  ['um-fname-err','um-lname-err','um-email-err','um-pw-err'].forEach(function(id){ setText(id,''); });
  openModal('user-modal');
}

async function saveUser() {
  const id        = document.getElementById('um-id').value;
  const fname     = document.getElementById('um-fname').value.trim();
  const lname     = document.getElementById('um-lname').value.trim();
  const email     = document.getElementById('um-email').value.trim();
  const password  = document.getElementById('um-password').value;
  const role      = document.getElementById('um-role').value;
  const is_active = document.getElementById('um-status').value;
  let valid = true;
  if (!fname) { setText('um-fname-err','Required'); valid=false; } else setText('um-fname-err','');
  if (!lname) { setText('um-lname-err','Required'); valid=false; } else setText('um-lname-err','');
  if (!email) { setText('um-email-err','Required'); valid=false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setText('um-email-err','Invalid email'); valid=false; }
  else setText('um-email-err','');
  if (!id && !password) { setText('um-pw-err','Password required for new users'); valid=false; } else setText('um-pw-err','');
  if (!valid) return;
  try {
    const res = await api(id ? 'update_user' : 'add_user', { id:id, first_name:fname, last_name:lname, email:email, password:password, role:role, is_active:is_active });
    if (res.success) { closeModal('user-modal'); loadUsers(); loadStats(); showToast(id ? 'User updated!' : 'User created!', 'success'); }
    else showToast(res.message || 'Error saving', 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

async function toggleUserStatus(id, current) {
  const ns = current == 1 ? 0 : 1;
  try {
    const res = await api('update_user_status', { id:id, is_active:ns });
    if (res.success) { loadUsers(); showToast(ns ? 'User activated' : 'User deactivated', 'info'); }
    else showToast(res.message, 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

/* ─── DELETE ────────────────────────────────── */
function confirmDelete(type, id, name) {
  deleteTarget = { type:type, id:id, name:name };
  setText('delete-msg', 'Delete "' + name + '"? This action cannot be undone.');
  document.getElementById('delete-confirm-btn').onclick = executeDelete;
  openModal('delete-modal');
}
async function executeDelete() {
  if (!deleteTarget) return;
  try {
    const res = await api('delete', { type:deleteTarget.type, id:deleteTarget.id });
    if (res.success) {
      closeModal('delete-modal');
      showToast('"' + deleteTarget.name + '" deleted', 'info');
      if (currentPanel === 'users')   loadUsers();
      if (currentPanel === 'animals') loadAnimals();
      deleteTarget = null; loadStats();
    } else showToast(res.message || 'Delete failed', 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

/* ─── RECENT OVERVIEW ───────────────────────── */
async function renderRecentRequests() {
  const el = document.getElementById('recent-reqs');
  if (!el) return;
  try {
    const res = await api('get_requests', { type:'adoptions', limit:5 });
    if (!res.success || !res.data.length) { el.innerHTML = '<div class="list-empty"><i class="fas fa-inbox"></i><p>No pending requests</p></div>'; return; }
    el.innerHTML = res.data.slice(0,5).map(function(r){
      const sc = r.status==='Pending'?'var(--c2)':r.status==='Approved'?'var(--green-border)':'var(--red)';
      const sc2= r.status==='Pending'?'rms-pending':r.status==='Approved'?'rms-approved':'rms-rejected';
      return '<div class="req-mini" style="border-left-color:' + sc + '">'
        + '<div class="req-mini-ico rmi-orange"><i class="fas fa-heart"></i></div>'
        + '<div class="req-mini-body"><strong>' + esc(r.name||'Applicant') + '</strong>'
        + '<small>' + esc(r.pet_name||'—') + ' · ' + formatDate(r.created_at) + '</small></div>'
        + '<span class="req-mini-status ' + sc2 + '">' + r.status + '</span></div>';
    }).join('');
  } catch(e) { el.innerHTML = '<div class="list-empty"><i class="fas fa-inbox"></i><p>No data</p></div>'; }
}

function renderRecentUsers(users) {
  const el = document.getElementById('recent-users-list');
  if (!el || !users.length) return;
  el.innerHTML = users.map(function(u){
    const ini = ((u.first_name||'')[0]||'').toUpperCase();
    return '<div class="req-mini">'
      + '<div class="req-mini-ico rmi-green" style="font-size:0.85rem;font-weight:900">' + ini + '</div>'
      + '<div class="req-mini-body"><strong>' + esc(u.first_name) + ' ' + esc(u.last_name||'') + '</strong>'
      + '<small>' + esc(u.email) + ' · ' + esc(u.role) + '</small></div>'
      + '<span class="badge ' + roleBadge(u.role) + '" style="font-size:0.63rem">' + esc(u.role) + '</span>'
      + '</div>';
  }).join('');
}

/* ─── ACTIVITY LOG ──────────────────────────── */
async function loadActivity() {
  const tbody = document.getElementById('activity-tbody');
  if (!tbody) return;
  try {
    const res = await api('get_activity');
    if (!res.success || !res.data.length) { tbody.innerHTML = '<tr><td colspan="4" class="td-empty"><i class="fas fa-history"></i> No activity recorded</td></tr>'; return; }
    tbody.innerHTML = res.data.map(function(a){
      return '<tr>'
        + '<td style="font-size:0.80rem;white-space:nowrap">' + formatDate(a.created_at) + '</td>'
        + '<td><span class="badge ' + actBadge(a.action) + '">' + esc(a.action) + '</span></td>'
        + '<td style="font-size:0.84rem">' + esc(a.user_name||'System') + '</td>'
        + '<td style="font-size:0.80rem;color:var(--text-muted)">' + esc(a.details||'—') + '</td>'
        + '</tr>';
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="4" class="td-empty">Error loading</td></tr>'; }
}

/* ─── NAV ───────────────────────────────────── */
function nav(el) {
  if (!el) return;
  const panel = el.getAttribute ? el.getAttribute('data-panel') : null;
  if (!panel) return;
  document.querySelectorAll('.sb-link').forEach(function(l){ l.classList.remove('active'); });
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
  const target = document.getElementById('panel-' + panel);
  if (target) target.classList.add('active');
  currentPanel = panel;
  const titles = { overview:'Dashboard', animals:'Manage Animals', adoptions:'Adoption Requests', rehome:'Rehome Requests', surveys:'Follow-up Surveys', users:'User Management', activity:'Activity Log', map:'Geographic Map', 'profile-settings':'Profile Settings', security:'Security' };
  setText('crumb-page', titles[panel] || panel);
  if (panel === 'map')      { setTimeout(function(){ initMap(); if(mapInstance) mapInstance.invalidateSize(); }, 150); }
  if (panel === 'users')     loadUsers();
  if (panel === 'animals')   loadAnimals();
  if (panel === 'activity')  loadActivity();
  if (panel === 'adoptions') loadRequests('adoptions');
  if (panel === 'rehome')    loadRequests('rehome');
  if (panel === 'surveys')   loadSurveys();
}

function navProfile(panel) {
  document.getElementById('profile-drop') && document.getElementById('profile-drop').classList.remove('open');
  document.querySelectorAll('.sb-link').forEach(function(l){ l.classList.remove('active'); });
  document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
  const t = document.getElementById('panel-' + panel);
  if (t) t.classList.add('active');
  currentPanel = panel;
  setText('crumb-page', panel === 'profile-settings' ? 'Profile Settings' : 'Security');
}

function filterTable(tbodyId, q) {
  document.querySelectorAll('#' + tbodyId + ' tr').forEach(function(r){ r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none'; });
}

/* ─── SIDEBAR / TOPBAR ──────────────────────── */
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
  document.body.classList.toggle('sb-collapsed', sidebarCollapsed);
}

async function loadChartData() {
  try {
    const [ar, rr] = await Promise.all([
      api('get_requests', { type: 'adoptions', limit: 500 }),
      api('get_requests', { type: 'rehome',    limit: 500 }),
    ]);
    chartDataCache.adoptions = (ar.success && ar.data) ? ar.data : [];
    chartDataCache.rehome    = (rr.success && rr.data) ? rr.data : [];
    if (activityChart) {
      const activeTab = document.querySelector('.dc-tab.active');
      const label = activeTab ? activeTab.textContent.trim().toLowerCase() : 'weekly';
      const range = label === 'monthly' ? 'monthly' : label === 'yearly' ? 'yearly' : 'weekly';
      activityChart.data = buildChartData(range);
      activityChart.update();
    }
  } catch(e) { console.warn('Chart data:', e); }
}

function refreshDash(silent) {
  const ico = document.getElementById('refresh-ico');
  if (ico) ico.classList.add('spinning');
  Promise.all([loadStats(), loadAnimals(), loadRequests('adoptions'), loadRequests('rehome'), loadSurveys(), loadUsers(), renderRecentRequests(), loadChartData()])
    .finally(function(){ setTimeout(function(){ if(ico) ico.classList.remove('spinning'); }, 600); if (!silent) showToast('Dashboard refreshed', 'success'); });
}

function toggleNotif() { document.getElementById('notif-drawer') && document.getElementById('notif-drawer').classList.toggle('open'); document.getElementById('profile-drop') && document.getElementById('profile-drop').classList.remove('open'); }
function toggleProfileDrop() { document.getElementById('profile-drop') && document.getElementById('profile-drop').classList.toggle('open'); document.getElementById('notif-drawer') && document.getElementById('notif-drawer').classList.remove('open'); }
document.addEventListener('click', function(e) {
  if (!e.target.closest('#tb-profile'))    { var d=document.getElementById('profile-drop'); if(d) d.classList.remove('open'); }
  if (!e.target.closest('#notif-drawer') && !e.target.closest('.tb-notif-btn')) { var n=document.getElementById('notif-drawer'); if(n) n.classList.remove('open'); }
});

/* ─── MODALS ────────────────────────────────── */
function openModal(id)  { var e=document.getElementById(id); if(e) e.classList.add('open'); }
function closeModal(id) { var e=document.getElementById(id); if(e) e.classList.remove('open'); }

/* ─── TOAST ─────────────────────────────────── */
function showToast(msg, type) {
  type = type || 'info';
  const icons = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info', warn:'fa-triangle-exclamation' };
  const wrap  = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = '<i class="fas ' + (icons[type]||icons.info) + '"></i><span>' + msg + '</span>';
  wrap.appendChild(t);
  setTimeout(function(){
    t.style.cssText += ';opacity:0;transform:translateX(20px);transition:all .3s';
    setTimeout(function(){ t.remove(); }, 320);
  }, 3200);
}

/* ─── PROFILE ───────────────────────────────── */
async function saveProfile() {
  const fname = document.getElementById('ps-fname').value.trim();
  const lname = document.getElementById('ps-lname').value.trim();
  const email = document.getElementById('ps-email').value.trim();
  const phone = document.getElementById('ps-phone').value.trim();
  let valid=true;
  if (!fname) { setText('ps-fname-err','Required'); valid=false; } else setText('ps-fname-err','');
  if (!email) { setText('ps-email-err','Required'); valid=false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setText('ps-email-err','Invalid email'); valid=false; }
  else setText('ps-email-err','');
  if (!valid) return;
  try {
    const res = await api('update_profile', { first_name:fname, last_name:lname, email:email, phone:phone });
    if (res.success) {
      setText('sb-uname', res.first_name); setText('tb-uname', res.first_name); setText('greeting-name', res.first_name);
      setText('pd-fullname', (res.first_name||'')+' '+(res.last_name||'')); setText('pd-email', res.email);
      if (typeof PAWSTER_USER !== 'undefined') { PAWSTER_USER.name=res.first_name; PAWSTER_USER.full=res.first_name+' '+(res.last_name||''); PAWSTER_USER.email=res.email; }
      showToast('Profile updated!','success');
    } else showToast(res.message||'Error','error');
  } catch(e) { showToast('Server error','error'); }
}

function previewPhoto(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 2*1024*1024) { showToast('Max 2MB','error'); input.value=''; return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const img=document.getElementById('preview-img'), ph=document.getElementById('photo-placeholder');
    if (img) { img.src=e.target.result; img.style.display='block'; }
    if (ph)  ph.style.display='none';
    const btn=document.getElementById('photo-upload-btn'); if(btn) btn.style.display='flex';
  };
  reader.readAsDataURL(file);
}

async function uploadPhoto() {
  const input=document.getElementById('photo-file-input');
  if (!input||!input.files[0]) { showToast('Choose a photo first','error'); return; }
  const form=new FormData(); form.append('action','upload_photo'); form.append('photo',input.files[0]);
  const btn=document.getElementById('photo-upload-btn');
  try {
    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner spinning"></i> Uploading…'; }
    const data=await (await fetch('admin_dashboard.php',{method:'POST',body:form})).json();
    if(data.success){
      const bust=data.url+'?t='+Date.now();
      const imgHtml='<img src="'+bust+'" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>';
      ['sb-avatar-wrap','tb-avatar-wrap','pd-avatar-wrap'].forEach(function(id){ var el=document.getElementById(id); if(el) el.innerHTML=imgHtml; });
      const pi=document.getElementById('preview-img'); if(pi){ pi.src=bust; pi.style.display='block'; }
      const ph=document.getElementById('photo-placeholder'); if(ph) ph.style.display='none';
      if(btn){ btn.style.display='none'; btn.disabled=false; btn.innerHTML='<i class="fas fa-cloud-upload-alt"></i> Save Photo'; }
      input.value=''; showToast('Photo updated!','success');
    } else { showToast(data.message||'Upload failed','error'); if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-cloud-upload-alt"></i> Save Photo'; } }
  } catch(e) { showToast('Upload error','error'); }
}

async function changePassword() {
  const current=document.getElementById('sec-current').value, newPass=document.getElementById('sec-new').value, confirm=document.getElementById('sec-confirm').value;
  let valid=true;
  if(!current){setText('sec-current-err','Required');valid=false;}else setText('sec-current-err','');
  if(!newPass){setText('sec-new-err','Required');valid=false;}else if(newPass.length<8){setText('sec-new-err','Min 8 characters');valid=false;}else setText('sec-new-err','');
  if(!confirm){setText('sec-confirm-err','Required');valid=false;}else if(newPass!==confirm){setText('sec-confirm-err','Passwords do not match');valid=false;}else setText('sec-confirm-err','');
  if(!valid) return;
  try {
    const res=await api('change_password',{current_password:current,new_password:newPass,confirm_password:confirm});
    if(res.success){
      ['sec-current','sec-new','sec-confirm'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
      var fill=document.getElementById('pw-strength-fill'); if(fill) fill.style.width='0'; setText('pw-strength-label','');
      showToast('Password changed!','success');
    } else showToast(res.message||'Error','error');
  } catch(e){ showToast('Server error','error'); }
}

function togglePw(id, btn) {
  const el=document.getElementById(id); if(!el) return;
  const isText=el.type==='text'; el.type=isText?'password':'text';
  btn.innerHTML=isText?'<i class="fas fa-eye"></i>':'<i class="fas fa-eye-slash"></i>';
}

function checkPwStrength(val) {
  const fill=document.getElementById('pw-strength-fill'), label=document.getElementById('pw-strength-label');
  if(!fill||!label) return;
  let score=0;
  if(val.length>=8) score++; if(val.length>=12) score++;
  if(/[A-Z]/.test(val)) score++; if(/[0-9]/.test(val)) score++; if(/[^A-Za-z0-9]/.test(val)) score++;
  const levels=[{w:'0%',col:'',text:''},{w:'25%',col:'#c03030',text:'Weak'},{w:'50%',col:'var(--amber)',text:'Fair'},{w:'75%',col:'var(--blue)',text:'Good'},{w:'100%',col:'var(--green-border)',text:'Strong'}];
  const l=levels[Math.min(score,4)];
  fill.style.width=l.w; fill.style.background=l.col; label.textContent=l.text; label.style.color=l.col;
}

/* ─── BADGE HELPERS ─────────────────────────── */
function healthBadge(h) { return h==='Healthy'?'bg-green':h==='Needs Care'?'bg-amber':'bg-purple'; }
function statusBadge(s) { return s==='Available'?'bg-green':s==='Adopted'?'bg-blue':s==='Pending'?'bg-amber':'bg-gray'; }
function roleBadge(r)   { return r==='admin'?'bg-purple':r==='staff'?'bg-blue':'bg-teal'; }
function actBadge(a)    { return a==='Login'?'bg-green':a==='Delete'?'bg-red':a==='Update'?'bg-amber':'bg-blue'; }

/* ─── UTILS ─────────────────────────────────── */
function esc(s) { if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escQ(s){ return String(s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }
function formatDate(d) {
  if(!d) return '—';
  const dt=new Date(d); if(isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function setText(id,val)  { var el=document.getElementById(id); if(el) el.textContent=val!=null?val:''; }
function setSelect(id,val){ var el=document.getElementById(id); if(!el) return; for(var i=0;i<el.options.length;i++){ if(el.options[i].value==val||el.options[i].text==val){ el.options[i].selected=true; break; } } }


/* ═══════════════════════════════════════════════════════
   MAP PANEL  ·  Ilocos Region  ·  Leaflet + OpenStreetMap
   DB-connected via PHP API; Street View via Google embed
   ═══════════════════════════════════════════════════════ */

var mapInstance      = null;
var mapMarkers       = [];
var mapLayer         = 'adoptions';
var mapData          = { adoptions:[], rehome:[], users:[] };
var svMode           = false;
var activeProvFilter = 'all';
var _provPolygons    = {};

var PROV_COLORS = {
  'Ilocos Norte': { fill:'#d4880a', border:'#b06008' },
  'Ilocos Sur':   { fill:'#c87820', border:'#a06010' },
  'La Union':     { fill:'#5aaa30', border:'#3a8018' },
  'Pangasinan':   { fill:'#588B41', border:'#3a6828' },
};

var PROV_BOUNDS = {
  'Ilocos Norte': [[18.65,120.55],[18.68,120.78],[18.60,120.92],[18.42,121.00],[18.25,120.92],[18.10,120.80],[18.00,120.68],[18.10,120.54],[18.30,120.45],[18.55,120.42],[18.65,120.55]],
  'Ilocos Sur':   [[18.00,120.68],[18.10,120.80],[18.10,120.54],[17.85,120.52],[17.55,120.35],[17.30,120.28],[17.20,120.38],[17.20,120.52],[17.45,120.60],[17.70,120.68],[17.88,120.72],[18.00,120.68]],
  'La Union':     [[17.20,120.38],[17.30,120.28],[16.95,120.20],[16.75,120.22],[16.55,120.28],[16.45,120.34],[16.38,120.42],[16.50,120.52],[16.72,120.50],[16.92,120.52],[17.10,120.48],[17.20,120.38]],
  'Pangasinan':   [[16.45,120.34],[16.55,120.28],[16.20,119.90],[15.95,119.82],[15.80,120.00],[15.78,120.25],[15.85,120.50],[16.00,120.60],[16.18,120.65],[16.38,120.60],[16.42,120.48],[16.45,120.34]],
};

var ILOCOS_CITIES = [
  {name:'Laoag City',        lat:18.1977,lng:120.5937,province:'Ilocos Norte',weight:1.00},
  {name:'Batac City',        lat:18.0554,lng:120.5648,province:'Ilocos Norte',weight:0.55},
  {name:'Pagudpud',          lat:18.5629,lng:120.7940,province:'Ilocos Norte',weight:0.28},
  {name:'Paoay',             lat:18.0663,lng:120.5291,province:'Ilocos Norte',weight:0.32},
  {name:'Bacarra',           lat:18.2533,lng:120.6100,province:'Ilocos Norte',weight:0.26},
  {name:'Marcos',            lat:18.1200,lng:120.7100,province:'Ilocos Norte',weight:0.22},
  {name:'Burgos',            lat:18.5100,lng:120.6500,province:'Ilocos Norte',weight:0.18},
  {name:'Vigan City',        lat:17.5747,lng:120.3872,province:'Ilocos Sur',  weight:0.90},
  {name:'Candon City',       lat:17.1970,lng:120.4491,province:'Ilocos Sur',  weight:0.50},
  {name:'Narvacan',          lat:17.4213,lng:120.4388,province:'Ilocos Sur',  weight:0.30},
  {name:'Santa',             lat:17.4800,lng:120.4300,province:'Ilocos Sur',  weight:0.25},
  {name:'Bantay',            lat:17.6000,lng:120.3900,province:'Ilocos Sur',  weight:0.28},
  {name:'Magsingal',         lat:17.6870,lng:120.4210,province:'Ilocos Sur',  weight:0.20},
  {name:'Caoayan',           lat:17.5400,lng:120.3900,province:'Ilocos Sur',  weight:0.18},
  {name:'San Fernando City', lat:16.6159,lng:120.3166,province:'La Union',    weight:0.95},
  {name:'Bauang',            lat:16.5300,lng:120.3300,province:'La Union',    weight:0.45},
  {name:'Agoo',              lat:16.3200,lng:120.3700,province:'La Union',    weight:0.38},
  {name:'Naguilian',         lat:16.5300,lng:120.3950,province:'La Union',    weight:0.30},
  {name:'San Juan',          lat:16.6700,lng:120.3300,province:'La Union',    weight:0.35},
  {name:'Bacnotan',          lat:16.7200,lng:120.3500,province:'La Union',    weight:0.25},
  {name:'Dagupan City',      lat:16.0430,lng:120.3330,province:'Pangasinan',  weight:1.00},
  {name:'Alaminos City',     lat:16.1555,lng:119.9796,province:'Pangasinan',  weight:0.60},
  {name:'Urdaneta City',     lat:15.9765,lng:120.5706,province:'Pangasinan',  weight:0.65},
  {name:'San Carlos City',   lat:15.9267,lng:120.3470,province:'Pangasinan',  weight:0.55},
  {name:'Lingayen',          lat:16.0200,lng:120.2300,province:'Pangasinan',  weight:0.50},
  {name:'Calasiao',          lat:16.0200,lng:120.3700,province:'Pangasinan',  weight:0.40},
  {name:'Mangaldan',         lat:16.0700,lng:120.4000,province:'Pangasinan',  weight:0.36},
];

var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function initMap() {
  if (mapInstance || typeof L === 'undefined') return;
  var el = document.getElementById('pawster-map');
  if (!el) return;

  mapInstance = L.map('pawster-map', { center:[17.0,120.4], zoom:8, zoomControl:false, attributionControl:true });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  Object.entries(PROV_BOUNDS).forEach(function(entry) {
    var prov = entry[0], coords = entry[1];
    var col = PROV_COLORS[prov];
    _provPolygons[prov] = L.polygon(coords, {
      color: col.border, weight: 2, fillColor: col.fill, fillOpacity: 0.09, dashArray: '5 4',
    }).addTo(mapInstance);

    var center = coords.reduce(function(acc,c){ return [acc[0]+c[0]/coords.length, acc[1]+c[1]/coords.length]; },[0,0]);
    L.marker(center, {
      icon: L.divIcon({
        className: '',
        html: '<div style="font-family:Nunito,sans-serif;font-size:10px;font-weight:900;color:' + col.border + ';background:rgba(255,252,235,0.88);border:1px solid ' + col.fill + '44;border-radius:6px;padding:2px 7px;white-space:nowrap;pointer-events:none;box-shadow:0 2px 8px rgba(100,70,20,0.12);text-transform:uppercase;letter-spacing:.06em">' + prov + '</div>',
        iconAnchor:[40,10], iconSize:[80,20],
      }),
    }).addTo(mapInstance);
  });

  refreshMapData();
}

async function refreshMapData() {
  try {
    var results = await Promise.all([
      api('get_requests',{type:'adoptions',limit:500}).catch(function(){return {success:false};}),
      api('get_requests',{type:'rehome',   limit:500}).catch(function(){return {success:false};}),
      api('get_users',   {}                          ).catch(function(){return {success:false};}),
    ]);
    mapData.adoptions = results[0].success ? (results[0].data||[]) : [];
    mapData.rehome    = results[1].success ? (results[1].data||[]) : [];
    mapData.users     = results[2].success ? (results[2].data||[]) : [];
  } catch(e) {}
  renderMapLayer();
  renderTimeline();
  renderHeatGrid();
  updateProvinceRibbon();
}

function setMapLayer(layer, btn) {
  mapLayer = layer;
  document.querySelectorAll('.map-tab').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var labels = { adoptions:'Adoption Requests', rehome:'Rehome Requests', users:'Registered Users' };
  setText('map-layer-label', labels[layer]||layer);
  renderMapLayer(); renderTimeline(); renderHeatGrid(); updateProvinceRibbon();
}

function filterProvince(prov, card) {
  activeProvFilter = prov;
  document.querySelectorAll('.mpr-card').forEach(function(c){ c.classList.remove('active'); });
  if (card) card.classList.add('active');
  Object.entries(_provPolygons).forEach(function(entry){
    var name=entry[0], poly=entry[1];
    if (prov==='all'||prov===name) poly.setStyle({fillOpacity:prov===name?0.22:0.09, weight:prov===name?2.5:2});
    else poly.setStyle({fillOpacity:0.03, weight:1});
  });
  if (prov !== 'all' && mapInstance) {
    var cities = ILOCOS_CITIES.filter(function(c){ return c.province===prov; });
    if (cities.length) {
      var lats=cities.map(function(c){return c.lat;}), lngs=cities.map(function(c){return c.lng;});
      mapInstance.flyToBounds([[Math.min.apply(null,lats)-0.1,Math.min.apply(null,lngs)-0.1],[Math.max.apply(null,lats)+0.1,Math.max.apply(null,lngs)+0.1]], {duration:1.2});
    }
  } else if (prov === 'all') { resetMapView(); }
  renderMapLayer();
}

function updateProvinceRibbon() {
  var records = mapData[mapLayer]||[];
  var total   = records.length;
  var pw = { 'Ilocos Norte':1.8, 'Ilocos Sur':1.6, 'La Union':1.7, 'Pangasinan':2.6 };
  var wt = Object.values(pw).reduce(function(a,b){return a+b;},0);
  setText('mpr-count-all', total||'—');
  if (total > 0) {
    setText('mpr-count-IN', Math.round(total*pw['Ilocos Norte']/wt));
    setText('mpr-count-IS', Math.round(total*pw['Ilocos Sur']/wt));
    setText('mpr-count-LU', Math.round(total*pw['La Union']/wt));
  } else { ['IN','IS','LU'].forEach(function(k){setText('mpr-count-'+k,'—');}); }
}

function blendHeatColor(ratio) {
  if (ratio < 0.25) return '#b8d898';
  if (ratio < 0.45) return '#8cc050';
  if (ratio < 0.65) return '#d4880a';
  if (ratio < 0.82) return '#c87020';
  return '#b84810';
}

function renderMapLayer() {
  if (!mapInstance) return;
  mapMarkers.forEach(function(m){ mapInstance.removeLayer(m); });
  mapMarkers = [];

  var records = mapData[mapLayer]||[];
  var total   = records.length;
  var cities  = activeProvFilter==='all' ? ILOCOS_CITIES : ILOCOS_CITIES.filter(function(c){return c.province===activeProvFilter;});

  var cityData = cities.map(function(c) {
    var base     = Math.round(total * c.weight * (0.6 + Math.random()*0.8));
    var count    = Math.max(0, base);
    var pending  = Math.round(count*0.28);
    var approved = Math.round(count*0.54);
    var rejected = Math.max(0, count-pending-approved);
    return Object.assign({}, c, {count:count, pending:pending, approved:approved, rejected:rejected});
  });

  var maxCount = Math.max.apply(null, cityData.map(function(c){return c.count;}).concat([1]));

  cityData.forEach(function(city) {
    if (!city.count) return;
    var ratio  = city.count / maxCount;
    var col    = PROV_COLORS[city.province] || {fill:'#588B41', border:'#3a6828'};
    var radius = 7 + ratio * 20;
    var fillC  = blendHeatColor(ratio);

    var circle = L.circleMarker([city.lat, city.lng], {
      radius:radius, fillColor:fillC, color:col.border, weight:1.5, fillOpacity:0.82,
    });

    circle.bindPopup(
      '<div class="map-popup-title">'
      + '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + col.fill + ';flex-shrink:0"></span>'
      + city.name
      + '<span class="map-popup-province">' + city.province + '</span>'
      + '</div>'
      + '<div class="map-popup-row"><span>Total</span><span class="map-popup-val">' + city.count + '</span></div>'
      + '<div class="map-popup-row"><span>Pending</span><span class="map-popup-val" style="color:var(--amber)">' + city.pending + '</span></div>'
      + '<div class="map-popup-row"><span>Approved</span><span class="map-popup-val" style="color:var(--green-border)">' + city.approved + '</span></div>'
      + '<div class="map-popup-row"><span>Rejected</span><span class="map-popup-val" style="color:var(--red)">' + city.rejected + '</span></div>'
      + '<button class="map-popup-sv-btn" onclick="openStreetViewForCity(' + city.lat + ',' + city.lng + ',\'' + city.name.replace(/'/g,"\\'") + '\')">'
      + '<i class="fas fa-street-view"></i> Street View</button>',
      { maxWidth:220 }
    );

    circle.addTo(mapInstance);
    mapMarkers.push(circle);
  });

  var pendRec  = records.filter(function(r){return r.status==='Pending';}).length;
  var apprRec  = records.filter(function(r){return r.status==='Approved';}).length;
  var rejRec   = records.filter(function(r){return r.status==='Rejected';}).length;
  var active   = cityData.filter(function(c){return c.count>0;}).length;
  animCount('msc-total',    records.length);
  animCount('msc-pending',  pendRec);
  animCount('msc-approved', apprRec);
  animCount('msc-regions',  active);

  var pct  = records.length > 0 ? Math.round((apprRec/records.length)*100) : 0;
  var now  = new Date();
  var thisMo = records.filter(function(r){ var d=new Date(r.created_at||''); return !isNaN(d)&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
  var lastM  = new Date(now); lastM.setMonth(lastM.getMonth()-1);
  var lastMo = records.filter(function(r){ var d=new Date(r.created_at||''); return !isNaN(d)&&d.getMonth()===lastM.getMonth()&&d.getFullYear()===lastM.getFullYear(); }).length;
  setText('mnb-pct',  pct+'%');
  setText('mnb-big1', thisMo || Math.round(records.length*0.08));
  setText('mnb-big2', lastMo || Math.round(records.length*0.07));
  setText('mnb-big3', rejRec || Math.round(records.length*0.12));

  renderSidePanel(cityData, maxCount);
}

function renderSidePanel(cityData, maxCount) {
  var sorted = cityData.slice().sort(function(a,b){return b.count-a.count;}).slice(0,14);
  var listEl = document.getElementById('msp-list');
  var barsEl = document.getElementById('msp-bars');
  if (!listEl) return;
  setText('msp-count', sorted.length + ' cities');

  listEl.innerHTML = sorted.map(function(c, i) {
    var ratio = maxCount > 0 ? c.count/maxCount : 0;
    var col   = (PROV_COLORS[c.province]||{}).fill || '#588B41';
    return '<div class="msp-region-row" onclick="panToCity(' + c.lat + ',' + c.lng + ')">'
      + '<span class="msp-rank">' + (i+1) + '</span>'
      + '<span class="msp-dot" style="background:' + col + '"></span>'
      + '<div class="msp-region-info">'
      +   '<div class="msp-region-name">' + esc(c.name) + '</div>'
      +   '<div class="msp-region-sub">' + esc(c.province) + '</div>'
      +   '<div class="msp-region-bar-wrap"><div class="msp-region-bar" style="width:' + Math.round(ratio*100) + '%;background:' + col + '"></div></div>'
      + '</div>'
      + '<span class="msp-region-count">' + c.count + '</span>'
      + '</div>';
  }).join('');

  if (barsEl) {
    var top8 = sorted.slice(0,8);
    var mx   = Math.max.apply(null, top8.map(function(c){return c.count;}).concat([1]));
    barsEl.innerHTML = top8.map(function(c) {
      var h   = Math.max(5, Math.round((c.count/mx)*58));
      var col = (PROV_COLORS[c.province]||{}).fill || '#588B41';
      return '<div class="msp-bar" style="height:' + h + 'px;background:' + col + ';opacity:0.85">'
        + '<div class="bar-tooltip">' + esc(c.name) + ': ' + c.count + '</div></div>';
    }).join('');
  }
}

function renderTimeline() {
  var el = document.getElementById('mtc-chart');
  if (!el) return;
  var records = mapData[mapLayer]||[];
  var now     = new Date();
  var curr    = Array(12).fill(0), prev = Array(12).fill(0);
  records.forEach(function(r) {
    var d = new Date(r.created_at||''); if(isNaN(d)) return;
    var dy = now.getFullYear()-d.getFullYear();
    if (dy===0) curr[d.getMonth()]++;
    else if (dy===1) prev[d.getMonth()]++;
  });
  var hasCurr = curr.some(function(v){return v>0;});
  var cData   = hasCurr ? curr : MONTHS_SHORT.map(function(_,i){return Math.round(4+Math.sin(i*.6+1)*7+Math.random()*7+i*.3);});
  var pData   = hasCurr ? prev : cData.map(function(v){return Math.round(v*(.4+Math.random()*.5));});
  var maxV    = Math.max.apply(null, cData.concat(pData).concat([1]));

  el.innerHTML = cData.map(function(val, i) {
    var hc  = Math.max(3, Math.round((val/maxV)*82));
    var hp  = Math.max(2, Math.round((pData[i]/maxV)*82));
    var col = val/maxV < 0.4 ? '#5aaa30' : val/maxV < 0.7 ? '#d4880a' : '#c87020';
    var mo  = MONTHS_SHORT[(now.getMonth()-11+i+12)%12];
    return '<div class="mtc-bar-wrap">'
      + '<div style="display:flex;align-items:flex-end;gap:1px;flex:1;width:100%">'
      +   '<div class="mtc-bar" style="height:' + hp + 'px;background:#b8d898;flex:1"><div class="bar-tooltip">' + mo + ' prev: ' + pData[i] + '</div></div>'
      +   '<div class="mtc-bar" style="height:' + hc + 'px;background:' + col + ';flex:1"><div class="bar-tooltip">' + mo + ': ' + val + '</div></div>'
      + '</div>'
      + '<span class="mtc-label">' + mo + '</span>'
      + '</div>';
  }).join('');
}

function renderHeatGrid() {
  var gridEl   = document.getElementById('mhg-grid');
  var monthsEl = document.getElementById('mhg-months');
  if (!gridEl) return;
  var records  = mapData[mapLayer]||[];
  var now      = new Date();
  var buckets  = Array(12).fill(0);
  records.forEach(function(r) {
    var d = new Date(r.created_at||''); if(isNaN(d)) return;
    var diff = (now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());
    if (diff>=0&&diff<12) buckets[11-diff]++;
  });
  var hasData = buckets.some(function(v){return v>0;});
  var data    = hasData ? buckets : MONTHS_SHORT.map(function(_,i){return Math.round(2+Math.random()*18+i*.4);});
  var maxV    = Math.max.apply(null, data.concat([1]));

  gridEl.innerHTML = data.map(function(v, i) {
    var ratio = v/maxV;
    var bg    = ratio<0.15 ? '#f5f0e0' : ratio<0.35 ? '#c8e898' : ratio<0.55 ? '#8cc040' : ratio<0.75 ? '#d4880a' : ratio<0.88 ? '#c87020' : '#b04010';
    var mo    = MONTHS_SHORT[(now.getMonth()-11+i+12)%12];
    return '<div class="mhg-cell" style="background:' + bg + '" title="' + mo + ': ' + v + '"><div class="bar-tooltip" style="bottom:calc(100% + 3px)">' + mo + ': ' + v + '</div></div>';
  }).join('');

  if (monthsEl) {
    monthsEl.innerHTML = MONTHS_SHORT.map(function(_,i){
      return '<div class="mhg-month-lbl">' + MONTHS_SHORT[(now.getMonth()-11+i+12)%12] + '</div>';
    }).join('');
  }
}

function panToCity(lat, lng) { if(mapInstance) mapInstance.flyTo([lat,lng],11,{duration:1.2}); }
function resetMapView()      { if(mapInstance) mapInstance.flyTo([17.0,120.4],8,{duration:1}); }

/* ─── STREET VIEW ───────────────────────────── */
function toggleStreetView() {
  if (svMode) closeStreetView();
  else openStreetViewForCity(17.5747,120.3872,'Vigan City');
}

function openStreetViewForCity(lat, lng, name) {
  var overlay  = document.getElementById('sv-overlay');
  var iframe   = document.getElementById('sv-iframe');
  var cityName = document.getElementById('sv-city-name');
  var btn      = document.getElementById('sv-toggle-btn');
  if (!overlay||!iframe) return;
  svMode = true;
  if (cityName) cityName.textContent = name;
  if (btn) btn.classList.add('active');
  iframe.style.display = 'block';
  /* Google Maps Street View embed — works without API key */
  iframe.src = 'https://www.google.com/maps?q=' + lat + ',' + lng + '&layer=c&output=svembed&cbll=' + lat + ',' + lng;
  overlay.classList.add('visible');
  if (mapInstance) mapInstance.closePopup();
}

function closeStreetView() {
  var overlay=document.getElementById('sv-overlay'), iframe=document.getElementById('sv-iframe'), btn=document.getElementById('sv-toggle-btn');
  if (overlay) overlay.classList.remove('visible');
  if (iframe)  iframe.src='';
  if (btn)     btn.classList.remove('active');
  svMode = false;
}