/* =============================================
   PAWSTER ADMIN DASHBOARD JS
   Calls dashboard.php for all data operations
   ============================================= */

let sidebarCollapsed = false;
let currentPanel = 'overview';
let activityChart = null;
let healthChart = null;
let rejectTarget = null; // { type, id }
let deleteTarget = null; // { type, id, name }

// ─── REALTIME POLLING ────────────────────────────
const POLL_INTERVAL = 30000; // 30 seconds
let pollingTimer = null;

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
  }, POLL_INTERVAL);
}

// ─── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSession();
  loadStats();
  loadAnimals();
  loadRequests('adoptions');
  loadRequests('rehome');
  loadSurveys();
  loadUsers();
  renderRecentActivity();
  initCharts();
  startPolling();
});

// ─── SESSION ────────────────────────────────────
function loadSession() {
  if (typeof PAWSTER_USER === 'undefined') return;
  setText('sb-uname',      PAWSTER_USER.name);
  setText('tb-uname',      PAWSTER_USER.name);
  setText('greeting-name', PAWSTER_USER.name);
  setText('pd-fullname',   PAWSTER_USER.full);
  setText('pd-email',      PAWSTER_USER.email);
}

// ─── API HELPER ────────────────────────────────
async function api(action, data = {}) {
  const form = new FormData();
  form.append('action', action);
  for (const [k, v] of Object.entries(data)) form.append(k, v);
  const res = await fetch('admin_dashboard.php', { method: 'POST', body: form });
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

// ─── STATS ──────────────────────────────────────
async function loadStats() {
  try {
    const res = await api('stats');
    if (!res.success) return;
    const d = res.data;
    animCount('sv-animals', d.animals || 0);
    animCount('sv-adopt',   d.adoptions || 0);
    animCount('sv-rehome',  d.rehome || 0);
    animCount('sv-users',   d.users || 0);
    setText('nb-animals',   d.animals || 0);
    setText('nb-adoptions', d.pending_adoptions || 0);
    setText('nb-rehome',    d.pending_rehome || 0);
    setText('nb-surveys',   d.surveys || 0);
    setText('nb-users',     d.users || 0);

    // Health donut
    updateHealthDonut(d.health_healthy||0, d.health_care||0, d.health_treatment||0);

    // Notif dot
    const pending = (d.pending_adoptions||0) + (d.pending_rehome||0);
    const notifDot = document.getElementById('notif-dot');
    if (notifDot) notifDot.style.display = pending > 0 ? 'block' : 'none';
    const notifBtnDot = document.querySelector('.tb-notif-btn .notif-dot');
    if (notifBtnDot) notifBtnDot.style.display = pending > 0 ? 'block' : 'none';
  } catch(e) { console.warn('Stats error:', e); }
}

function animCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let n = 0;
  const step = Math.max(1, Math.ceil(target / 20));
  const t = setInterval(() => { n = Math.min(n + step, target); el.textContent = n; if (n >= target) clearInterval(t); }, 30);
}

// ─── CHARTS ─────────────────────────────────────
function initCharts() {
  Chart.defaults.font.family = 'Nunito';
  Chart.defaults.color = '#6a7a50';

  // Activity chart
  const ac = document.getElementById('chart-activity');
  if (ac) {
    activityChart = new Chart(ac, {
      type: 'line',
      data: getChartData('weekly'),
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } } },
        scales: {
          x: { grid: { color: 'rgba(180,140,60,0.1)' } },
          y: { grid: { color: 'rgba(180,140,60,0.1)' }, beginAtZero: true }
        },
        elements: { line: { tension: 0.45 } },
        interaction: { mode: 'index', intersect: false }
      }
    });
  }

  // Health donut
  const hc = document.getElementById('chart-health');
  if (hc) {
    healthChart = new Chart(hc, {
      type: 'doughnut',
      data: {
        labels: ['Healthy','Needs Care','Treatment'],
        datasets: [{ data: [1,0,0], backgroundColor: ['#5aaa30','#c87820','#7a3dc0'], borderWidth: 0, hoverOffset: 4 }]
      },
      options: { cutout: '72%', plugins: { legend: { display: false } }, animation: { animateRotate: true } }
    });
  }
}

function updateHealthDonut(h, c, t) {
  if (healthChart) {
    healthChart.data.datasets[0].data = [h||0, c||0, t||0];
    healthChart.update();
  }
  const total = h + c + t;
  setText('donut-pct', total ? Math.round((h/total)*100) + '%' : '0%');
  setText('dl-h', h); setText('dl-c', c); setText('dl-t', t);
}

function getChartData(range) {
  const colors = { adopt: { line: '#5aaa30', fill: 'rgba(90,170,48,0.1)' }, rehome: { line: '#c87820', fill: 'rgba(200,120,32,0.1)' } };
  let labels, aData, rData;
  if (range === 'weekly')       { labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; aData=[2,5,3,8,4,7,3]; rData=[1,2,4,2,3,1,2]; }
  else if (range === 'monthly') { labels=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; aData=[12,18,14,22,19,26,30,25,28,32,21,35]; rData=[5,8,6,10,9,12,15,11,13,16,10,18]; }
  else                          { labels=['2021','2022','2023','2024','2025','2026']; aData=[85,120,145,168,210,240]; rData=[40,55,68,80,110,125]; }
  return {
    labels,
    datasets: [
      { label:'Adoptions', data:aData, borderColor:colors.adopt.line, backgroundColor:colors.adopt.fill, fill:true, pointBackgroundColor:colors.adopt.line, pointRadius:4 },
      { label:'Rehomes',   data:rData, borderColor:colors.rehome.line, backgroundColor:colors.rehome.fill, fill:true, pointBackgroundColor:colors.rehome.line, pointRadius:4 }
    ]
  };
}

function setChart(range, btn) {
  document.querySelectorAll('.dc-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (activityChart) { activityChart.data = getChartData(range); activityChart.update(); }
}

// ─── ANIMALS ────────────────────────────────────
async function loadAnimals() {
  const tbody = document.getElementById('animals-tbody');
  if (!tbody) return;
  try {
    const res = await api('get_animals');
    if (!res.success) { tbody.innerHTML = `<tr><td colspan="7" class="td-empty"><i class="fas fa-paw"></i> ${res.message||'No animals found'}</td></tr>`; return; }
    const animals = res.data;
    if (!animals.length) { tbody.innerHTML = `<tr><td colspan="7" class="td-empty"><i class="fas fa-paw"></i> No animals yet. Add one!</td></tr>`; return; }
    tbody.innerHTML = animals.map(a => `
      <tr>
        <td><strong>${esc(a.name)}</strong></td>
        <td>${esc(a.type)}</td>
        <td>${esc(a.breed||'—')}</td>
        <td>${esc(a.age||'—')}</td>
        <td><span class="badge ${healthBadge(a.health)}">${esc(a.health)}</span></td>
        <td><span class="badge ${statusBadge(a.status)}">${esc(a.status)}</span></td>
        <td>
          <div class="tbl-actions">
            <button class="tbl-btn tbl-edit" onclick="openAnimalModal(${JSON.stringify(a).replace(/"/g,'&quot;')})"><i class="fas fa-pen"></i> Edit</button>
            <button class="tbl-btn tbl-del"  onclick="confirmDelete('animal',${a.id},'${esc(a.name)}')"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>`).join('');
    renderRecentRequests(animals);
  } catch(e) { tbody.innerHTML = `<tr><td colspan="7" class="td-empty"><i class="fas fa-exclamation-circle"></i> Error loading animals</td></tr>`; }
}

function openAnimalModal(animal = null) {
  document.getElementById('am-id').value    = animal ? animal.id    : '';
  document.getElementById('am-name').value  = animal ? animal.name  : '';
  document.getElementById('am-breed').value = animal ? animal.breed : '';
  document.getElementById('am-age').value   = animal ? animal.age   : '';
  setSelect('am-type',   animal ? animal.type   : 'Dog');
  setSelect('am-health', animal ? animal.health : 'Healthy');
  setSelect('am-status', animal ? animal.status : 'Available');
  document.getElementById('am-title').innerHTML = animal
    ? '<i class="fas fa-pen"></i> Edit Animal'
    : '<i class="fas fa-paw"></i> Add Animal';
  openModal('animal-modal');
}

async function saveAnimal() {
  const id     = document.getElementById('am-id').value;
  const name   = document.getElementById('am-name').value.trim();
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
    if (res.success) {
      closeModal('animal-modal');
      loadAnimals(); loadStats();
      showToast(id ? 'Animal updated!' : 'Animal added!', 'success');
    } else { showToast(res.message || 'Error saving', 'error'); }
  } catch(e) { showToast('Server error', 'error'); }
}

// ─── REQUESTS ───────────────────────────────────
async function loadRequests(type) {
  const listId = type === 'adoptions' ? 'list-adoptions' : 'list-rehome';
  const list = document.getElementById(listId);
  if (!list) return;
  try {
    const res = await api('get_requests', { type });
    if (!res.success || !res.data.length) { list.innerHTML = '<div class="list-empty"><i class="fas fa-inbox"></i><p>No requests yet</p></div>'; return; }
    list.innerHTML = res.data.map(r => buildReqCard(r, type)).join('');
  } catch(e) { list.innerHTML = '<div class="list-empty"><i class="fas fa-exclamation-circle"></i><p>Error loading</p></div>'; }
}

function buildReqCard(r, type) {
  const isPending = r.status === 'Pending';
  const detailHtml = type === 'adoptions'
    ? `<strong>Pet:</strong> ${esc(r.pet_name||r.petName||'N/A')}<br><strong>Contact:</strong> ${esc(r.email||'N/A')}`
    : `<strong>Animal:</strong> ${esc(r.animal_name||r.animalName||'N/A')}<br><strong>Reason:</strong> ${esc(r.reason||'N/A')}`;
  const name = r.name || r.owner_name || r.ownerName || 'Applicant';
  return `
  <div class="req-card">
    <div class="rc-head">
      <div>
        <div class="rc-name">${esc(name)}</div>
        <div class="rc-date">${formatDate(r.created_at||r.date)}</div>
      </div>
      <span class="badge ${reqBadge(r.status)}">${esc(r.status||'Pending')}</span>
    </div>
    <div class="rc-detail">${detailHtml}</div>
    <div class="rc-actions">
      ${isPending ? `
        <button class="rca-btn rca-approve" onclick="approveReq('${type}',${r.id})"><i class="fas fa-check"></i> Approve</button>
        <button class="rca-btn rca-reject"  onclick="openReject('${type}',${r.id})"><i class="fas fa-times"></i> Reject</button>
      ` : `<button class="rca-btn rca-view"><i class="fas fa-eye"></i> ${r.status}</button>`}
    </div>
  </div>`;
}

async function filterReqs(type, status, btn) {
  const tabs = btn.closest('.tab-group')?.querySelectorAll('.tab-btn');
  if (tabs) tabs.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const listId = type === 'adoptions' ? 'list-adoptions' : 'list-rehome';
  const list = document.getElementById(listId);
  try {
    const res = await api('get_requests', { type, status: status === 'all' ? '' : status });
    if (!res.success || !res.data.length) { list.innerHTML = '<div class="list-empty"><i class="fas fa-inbox"></i><p>No requests found</p></div>'; return; }
    list.innerHTML = res.data.map(r => buildReqCard(r, type)).join('');
  } catch(e) {}
}

async function approveReq(type, id) {
  try {
    const res = await api('update_request', { type, id, status: 'Approved' });
    if (res.success) { loadRequests(type); loadStats(); showToast('Request approved!', 'success'); }
    else showToast(res.message, 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

function openReject(type, id) {
  rejectTarget = { type, id };
  document.getElementById('reject-reason').value = '';
  openModal('reject-modal');
}

async function confirmReject() {
  if (!rejectTarget) return;
  const reason = document.getElementById('reject-reason').value.trim();
  if (!reason) { showToast('Please enter a reason', 'error'); return; }
  try {
    const res = await api('update_request', { ...rejectTarget, status: 'Rejected', reason });
    if (res.success) {
      closeModal('reject-modal');
      loadRequests(rejectTarget.type); loadStats();
      rejectTarget = null;
      showToast('Request rejected', 'warn');
    } else showToast(res.message, 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

// ─── SURVEYS ────────────────────────────────────
async function loadSurveys() {
  const list = document.getElementById('list-surveys');
  if (!list) return;
  try {
    const res = await api('get_surveys');
    if (!res.success || !res.data.length) { list.innerHTML = '<div class="list-empty"><i class="fas fa-clipboard-list"></i><p>No surveys yet</p></div>'; return; }
    list.innerHTML = res.data.map(s => `
      <div class="req-card">
        <div class="rc-head">
          <div>
            <div class="rc-name">${esc(s.adopter_name||'Adopter')}</div>
            <div class="rc-date">${formatDate(s.created_at)}</div>
          </div>
          <span class="badge bg-green">Submitted</span>
        </div>
        <div class="rc-detail">
          <strong>Animal:</strong> ${esc(s.animal_name||'N/A')}<br>
          <strong>Happiness:</strong> ${esc(s.happiness||'N/A')}<br>
          <strong>Notes:</strong> ${esc(s.notes||'None')}
        </div>
        <div class="rc-actions"><button class="rca-btn rca-view"><i class="fas fa-eye"></i> Viewed</button></div>
      </div>`).join('');
  } catch(e) { list.innerHTML = '<div class="list-empty"><i class="fas fa-exclamation-circle"></i><p>Error loading</p></div>'; }
}

// ─── USER MANAGEMENT ────────────────────────────
async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  const role = document.getElementById('role-filter')?.value || 'all';
  try {
    const res = await api('get_users', { role });
    if (!res.success || !res.data.length) { tbody.innerHTML = `<tr><td colspan="7" class="td-empty"><i class="fas fa-users"></i> No users found</td></tr>`; return; }
    tbody.innerHTML = res.data.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--green-mid),#2a7010);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.78rem;flex-shrink:0">
              ${esc((u.first_name||'?')[0]).toUpperCase()}${esc((u.last_name||'')[0]||'').toUpperCase()}
            </div>
            <div>
              <strong style="display:block;font-size:0.875rem">${esc(u.first_name)} ${esc(u.last_name||'')}</strong>
              <span style="font-size:0.72rem;color:var(--text-muted)">ID #${u.id}</span>
            </div>
          </div>
        </td>
        <td>${esc(u.email)}</td>
        <td><span class="badge ${roleBadge(u.role)}">${esc(u.role||'user')}</span></td>
        <td><span class="badge ${u.is_active==1?'bg-green':'bg-red'}">${u.is_active==1?'Active':'Inactive'}</span></td>
        <td style="font-size:0.8rem">${formatDate(u.created_at)}</td>
        <td style="font-size:0.8rem">${u.last_login ? formatDate(u.last_login) : '<span style="color:var(--text-muted)">Never</span>'}</td>
        <td>
          <div class="tbl-actions">
            <button class="tbl-btn tbl-edit" onclick="openUserModal(${JSON.stringify(u).replace(/"/g,'&quot;')})"><i class="fas fa-pen"></i> Edit</button>
            <button class="tbl-btn tbl-ban"  onclick="toggleUserStatus(${u.id},${u.is_active})"><i class="fas fa-${u.is_active==1?'ban':'check-circle'}"></i></button>
            <button class="tbl-btn tbl-del"  onclick="confirmDelete('user',${u.id},'${esc(u.first_name+' '+(u.last_name||''))}')"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>`).join('');

    renderRecentUsers(res.data.slice(0, 5));
  } catch(e) { tbody.innerHTML = `<tr><td colspan="7" class="td-empty"><i class="fas fa-exclamation-circle"></i> Error loading users</td></tr>`; }
}

function openUserModal(user = null) {
  document.getElementById('um-id').value       = user ? user.id         : '';
  document.getElementById('um-fname').value    = user ? user.first_name : '';
  document.getElementById('um-lname').value    = user ? user.last_name  : '';
  document.getElementById('um-email').value    = user ? user.email      : '';
  document.getElementById('um-password').value = '';
  setSelect('um-role',   user ? user.role      : 'user');
  setSelect('um-status', user ? (user.is_active != null ? String(user.is_active) : '1') : '1');

  document.getElementById('user-modal-title').innerHTML = user
    ? '<i class="fas fa-user-edit"></i> Edit User'
    : '<i class="fas fa-user-plus"></i> Add User';
  ['um-fname-err','um-lname-err','um-email-err','um-pw-err'].forEach(id => setText(id, ''));
  openModal('user-modal');
}

async function saveUser() {
  const id       = document.getElementById('um-id').value;
  const fname    = document.getElementById('um-fname').value.trim();
  const lname    = document.getElementById('um-lname').value.trim();
  const email    = document.getElementById('um-email').value.trim();
  const password = document.getElementById('um-password').value;
  const role     = document.getElementById('um-role').value;
  const is_active = document.getElementById('um-status').value;

  let valid = true;
  if (!fname) { setText('um-fname-err', 'Required'); valid = false; } else setText('um-fname-err','');
  if (!lname) { setText('um-lname-err', 'Required'); valid = false; } else setText('um-lname-err','');
  if (!email) { setText('um-email-err', 'Required'); valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setText('um-email-err','Invalid email'); valid = false; }
  else setText('um-email-err','');
  if (!id && !password) { setText('um-pw-err', 'Password required for new users'); valid = false; } else setText('um-pw-err','');
  if (!valid) return;

  try {
    const res = await api(id ? 'update_user' : 'add_user', { id, first_name: fname, last_name: lname, email, password, role, is_active });
    if (res.success) {
      closeModal('user-modal');
      loadUsers(); loadStats();
      showToast(id ? 'User updated!' : 'User created!', 'success');
    } else { showToast(res.message || 'Error saving user', 'error'); }
  } catch(e) { showToast('Server error', 'error'); }
}

async function toggleUserStatus(id, current) {
  const newStatus = current == 1 ? 0 : 1;
  try {
    const res = await api('update_user_status', { id, is_active: newStatus });
    if (res.success) { loadUsers(); showToast(newStatus ? 'User activated' : 'User deactivated', 'info'); }
    else showToast(res.message, 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

// ─── DELETE ─────────────────────────────────────
function confirmDelete(type, id, name) {
  deleteTarget = { type, id, name };
  setText('delete-msg', `Delete "${name}"? This cannot be undone.`);
  document.getElementById('delete-confirm-btn').onclick = executeDelete;
  openModal('delete-modal');
}

async function executeDelete() {
  if (!deleteTarget) return;
  try {
    const res = await api('delete', { type: deleteTarget.type, id: deleteTarget.id });
    if (res.success) {
      closeModal('delete-modal');
      showToast(`"${deleteTarget.name}" deleted`, 'info');
      deleteTarget = null;
      if (currentPanel === 'users') loadUsers();
      else if (currentPanel === 'animals') loadAnimals();
      loadStats();
    } else showToast(res.message || 'Delete failed', 'error');
  } catch(e) { showToast('Server error', 'error'); }
}

// ─── RECENT LISTS (Overview) ────────────────────
async function renderRecentRequests() {
  const el = document.getElementById('recent-reqs');
  if (!el) return;
  try {
    const res = await api('get_requests', { type: 'adoptions', limit: 5 });
    if (!res.success || !res.data.length) { el.innerHTML = '<div class="list-empty"><i class="fas fa-inbox"></i><p>No pending requests</p></div>'; return; }
    el.innerHTML = res.data.slice(0,5).map(r => `
      <div class="req-mini" style="border-left-color:${r.status==='Pending'?'var(--c2)':r.status==='Approved'?'var(--green-border)':'var(--red)'}">
        <div class="req-mini-ico rmi-orange"><i class="fas fa-heart"></i></div>
        <div class="req-mini-body">
          <strong>${esc(r.name||'Applicant')}</strong>
          <small>${esc(r.pet_name||'—')} · ${formatDate(r.created_at)}</small>
        </div>
        <span class="req-mini-status ${r.status==='Pending'?'rms-pending':r.status==='Approved'?'rms-approved':'rms-rejected'}">${r.status}</span>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="list-empty"><i class="fas fa-inbox"></i><p>No data</p></div>'; }
}

function renderRecentUsers(users) {
  const el = document.getElementById('recent-users-list');
  if (!el || !users.length) return;
  el.innerHTML = users.map(u => `
    <div class="req-mini">
      <div class="req-mini-ico rmi-green" style="font-size:0.85rem;font-weight:900">
        ${esc((u.first_name||'?')[0]).toUpperCase()}
      </div>
      <div class="req-mini-body">
        <strong>${esc(u.first_name)} ${esc(u.last_name||'')}</strong>
        <small>${esc(u.email)} · ${esc(u.role)}</small>
      </div>
      <span class="badge ${roleBadge(u.role)}" style="font-size:0.65rem">${esc(u.role)}</span>
    </div>`).join('');
}

// ─── ACTIVITY LOG ────────────────────────────────
async function loadActivity() {
  const tbody = document.getElementById('activity-tbody');
  if (!tbody) return;
  try {
    const res = await api('get_activity');
    if (!res.success || !res.data.length) { tbody.innerHTML = `<tr><td colspan="4" class="td-empty"><i class="fas fa-history"></i> No activity recorded</td></tr>`; return; }
    tbody.innerHTML = res.data.map(a => `
      <tr>
        <td style="font-size:0.8rem;white-space:nowrap">${formatDate(a.created_at)}</td>
        <td><span class="badge ${actBadge(a.action)}">${esc(a.action)}</span></td>
        <td>${esc(a.user_name||'System')}</td>
        <td style="font-size:0.82rem;color:var(--text-muted)">${esc(a.details||'—')}</td>
      </tr>`).join('');
  } catch(e) { tbody.innerHTML = `<tr><td colspan="4" class="td-empty">Error loading</td></tr>`; }
}

async function renderRecentActivity() {
  renderRecentRequests();
}

// ─── NAVIGATION ──────────────────────────────────
function nav(el) {
  if (!el) return;
  const panel = el.getAttribute ? el.getAttribute('data-panel') : null;
  if (!panel) return;
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('panel-' + panel);
  if (target) target.classList.add('active');
  currentPanel = panel;

  const titles = { overview:'Dashboard', animals:'Manage Animals', adoptions:'Adoption Requests', rehome:'Rehome Requests', surveys:'Follow-up Surveys', users:'User Management', activity:'Activity Log' };
  setText('crumb-page', titles[panel] || panel);

  if (panel === 'users') loadUsers();
  if (panel === 'animals') loadAnimals();
  if (panel === 'activity') loadActivity();
}

function filterTable(tbodyId, q) {
  const rows = document.querySelectorAll(`#${tbodyId} tr`);
  rows.forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none'; });
}

// ─── SIDEBAR ────────────────────────────────────
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
  document.body.classList.toggle('sb-collapsed', sidebarCollapsed);
}

// ─── HEADER ACTIONS ─────────────────────────────
function refreshDash() {
  const ico = document.getElementById('refresh-ico');
  if (ico) ico.classList.add('spinning');
  Promise.all([loadStats(), loadAnimals(), loadRequests('adoptions'), loadRequests('rehome'), loadSurveys(), loadUsers()])
    .finally(() => { setTimeout(() => ico?.classList.remove('spinning'), 600); showToast('Dashboard refreshed', 'success'); });
}

function toggleNotif() {
  document.getElementById('notif-drawer')?.classList.toggle('open');
  document.getElementById('profile-drop')?.classList.remove('open');
}

function toggleProfileDrop() {
  document.getElementById('profile-drop')?.classList.toggle('open');
  document.getElementById('notif-drawer')?.classList.remove('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('#tb-profile')) document.getElementById('profile-drop')?.classList.remove('open');
  if (!e.target.closest('#notif-drawer') && !e.target.closest('.tb-notif-btn')) document.getElementById('notif-drawer')?.classList.remove('open');
});

// ─── MODAL HELPERS ───────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ─── TOAST ───────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info', warn:'fa-triangle-exclamation' };
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fas ${icons[type]||icons.info}"></i><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ─── BADGE HELPERS ───────────────────────────────
function healthBadge(h)  { return h==='Healthy'?'bg-green':h==='Needs Care'?'bg-amber':'bg-purple'; }
function statusBadge(s)  { return s==='Available'?'bg-green':s==='Adopted'?'bg-blue':s==='Pending'?'bg-amber':'bg-gray'; }
function reqBadge(s)     { return s==='Approved'?'bg-green':s==='Rejected'?'bg-red':'bg-amber'; }
function roleBadge(r)    { return r==='admin'?'bg-purple':r==='staff'?'bg-blue':'bg-teal'; }
function actBadge(a)     { return a==='Login'?'bg-green':a==='Delete'?'bg-red':a==='Update'?'bg-amber':'bg-blue'; }

// ─── UTILS ───────────────────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? String(d) : date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val ?? ''; }
function setSelect(id, val) { const el = document.getElementById(id); if (el) for (const o of el.options) { if (o.value == val || o.text == val) { o.selected = true; break; } } }

// ─── PROFILE NAVIGATION ─────────────────────────
function navProfile(panel) {
  document.getElementById('profile-drop')?.classList.remove('open');
  const fakeEl = { getAttribute: () => panel, classList: { add: () => {}, remove: () => {} } };
  // deactivate all nav links, activate the panel only
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('panel-' + panel);
  if (target) target.classList.add('active');
  currentPanel = panel;
  const titles = { 'profile-settings': 'Profile Settings', 'security': 'Security' };
  setText('crumb-page', titles[panel] || panel);
}

// ─── PROFILE SETTINGS ────────────────────────────
async function saveProfile() {
  const fname = document.getElementById('ps-fname').value.trim();
  const lname = document.getElementById('ps-lname').value.trim();
  const email = document.getElementById('ps-email').value.trim();
  const phone = document.getElementById('ps-phone').value.trim();
  let valid = true;
  if (!fname) { setText('ps-fname-err','Required'); valid = false; } else setText('ps-fname-err','');
  if (!email) { setText('ps-email-err','Required'); valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setText('ps-email-err','Invalid email'); valid = false; }
  else setText('ps-email-err','');
  if (!valid) return;
  try {
    const res = await api('update_profile', { first_name: fname, last_name: lname, email, phone });
    if (res.success) {
      // Update all name displays live
      setText('sb-uname', res.first_name);
      setText('tb-uname', res.first_name);
      setText('greeting-name', res.first_name);
      setText('pd-fullname', res.first_name + ' ' + (res.last_name || ''));
      setText('pd-email', res.email);
      if (typeof PAWSTER_USER !== 'undefined') {
        PAWSTER_USER.name = res.first_name;
        PAWSTER_USER.full = res.first_name + ' ' + (res.last_name || '');
        PAWSTER_USER.email = res.email;
      }
      showToast('Profile updated!', 'success');
    } else { showToast(res.message || 'Error updating profile', 'error'); }
  } catch(e) { showToast('Server error', 'error'); }
}

// ─── PHOTO UPLOAD ────────────────────────────────
function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('File too large. Max 2MB', 'error'); input.value=''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('preview-img');
    const placeholder = document.getElementById('photo-placeholder');
    img.src = e.target.result;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    const btn = document.getElementById('photo-upload-btn');
    if (btn) btn.style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

async function uploadPhoto() {
  const input = document.getElementById('photo-file-input');
  if (!input.files[0]) { showToast('Please choose a photo first', 'error'); return; }
  const form = new FormData();
  form.append('action', 'upload_photo');
  form.append('photo', input.files[0]);
  try {
    const btn = document.getElementById('photo-upload-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner spinning"></i> Uploading…'; }
    const res = await fetch('admin_dashboard.php', { method: 'POST', body: form });
    const data = await res.json();
    if (data.success) {
      const url = data.url + '?t=' + Date.now();
      // Update all avatar spots
      updateAllAvatars(data.url);
      if (btn) { btn.style.display = 'none'; btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Save Photo'; }
      input.value = '';
      showToast('Profile photo updated!', 'success');
    } else {
      showToast(data.message || 'Upload failed', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Save Photo'; }
    }
  } catch(e) { showToast('Upload error', 'error'); }
}

function updateAllAvatars(url) {
  const bust = url + '?t=' + Date.now();
  const imgHtml = `<img src="${bust}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  const ids = ['sb-avatar-wrap','tb-avatar-wrap','pd-avatar-wrap'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = imgHtml;
  });
  // Also update preview
  const previewImg = document.getElementById('preview-img');
  if (previewImg) { previewImg.src = bust; previewImg.style.display = 'block'; }
  const ph = document.getElementById('photo-placeholder');
  if (ph) ph.style.display = 'none';
}

// ─── CHANGE PASSWORD ─────────────────────────────
async function changePassword() {
  const current = document.getElementById('sec-current').value;
  const newPass  = document.getElementById('sec-new').value;
  const confirm  = document.getElementById('sec-confirm').value;
  let valid = true;
  if (!current) { setText('sec-current-err','Required'); valid = false; } else setText('sec-current-err','');
  if (!newPass)  { setText('sec-new-err','Required'); valid = false; }
  else if (newPass.length < 8) { setText('sec-new-err','Min 8 characters'); valid = false; }
  else setText('sec-new-err','');
  if (!confirm)  { setText('sec-confirm-err','Required'); valid = false; }
  else if (newPass !== confirm) { setText('sec-confirm-err','Passwords do not match'); valid = false; }
  else setText('sec-confirm-err','');
  if (!valid) return;
  try {
    const res = await api('change_password', { current_password: current, new_password: newPass, confirm_password: confirm });
    if (res.success) {
      document.getElementById('sec-current').value = '';
      document.getElementById('sec-new').value = '';
      document.getElementById('sec-confirm').value = '';
      document.getElementById('pw-strength-fill').style.width = '0';
      setText('pw-strength-label', '');
      showToast('Password changed successfully!', 'success');
    } else { showToast(res.message || 'Error changing password', 'error'); }
  } catch(e) { showToast('Server error', 'error'); }
}

// ─── PASSWORD SHOW/HIDE ──────────────────────────
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.innerHTML = isText ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

// ─── PASSWORD STRENGTH ───────────────────────────
function checkPwStrength(val) {
  const fill  = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if (!fill || !label) return;
  let score = 0;
  if (val.length >= 8)  score++;
  if (val.length >= 12) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w:'0%',   color:'',             text:'' },
    { w:'25%',  color:'#c03030',      text:'Weak' },
    { w:'50%',  color:'var(--amber)', text:'Fair' },
    { w:'75%',  color:'var(--blue)',  text:'Good' },
    { w:'100%', color:'var(--green-border)', text:'Strong' },
  ];
  const l = levels[Math.min(score, 4)];
  fill.style.width = l.w;
  fill.style.background = l.color;
  label.textContent = l.text;
  label.style.color = l.color;
}


// ══════════════════════════════════════════════════════════
//  MAP PANEL  ·  Ilocos Region  ·  Warm Organic Theme
// ══════════════════════════════════════════════════════════

let mapInstance       = null;
let mapMarkers        = [];
let mapLayer          = 'adoptions';
let mapData           = { adoptions: [], rehome: [], users: [] };
let svMode            = false;
let activeProvFilter  = 'all';

// ── Province colour palette (warm, matches Pawster theme) ─
const PROV_COLORS = {
  'Ilocos Norte': { fill: '#d4880a', border: '#b06008', light: 'rgba(212,136,10,0.18)' },
  'Ilocos Sur':   { fill: '#c87820', border: '#a06010', light: 'rgba(200,120,32,0.18)' },
  'La Union':     { fill: '#5aaa30', border: '#3a8018', light: 'rgba(90,170,48,0.18)'  },
  'Pangasinan':   { fill: '#588B41', border: '#3a6828', light: 'rgba(88,139,65,0.18)'  },
};

// Province boundary polygons (approximate, Ilocos only)
const PROV_BOUNDS = {
  'Ilocos Norte': [
    [18.65,120.55],[18.68,120.78],[18.60,120.92],[18.42,121.00],
    [18.25,120.92],[18.10,120.80],[18.00,120.68],[18.10,120.54],
    [18.30,120.45],[18.55,120.42],[18.65,120.55],
  ],
  'Ilocos Sur': [
    [18.00,120.68],[18.10,120.80],[18.10,120.54],[17.85,120.52],
    [17.55,120.35],[17.30,120.28],[17.20,120.38],[17.20,120.52],
    [17.45,120.60],[17.70,120.68],[17.88,120.72],[18.00,120.68],
  ],
  'La Union': [
    [17.20,120.38],[17.30,120.28],[16.95,120.20],[16.75,120.22],
    [16.55,120.28],[16.45,120.34],[16.38,120.42],[16.50,120.52],
    [16.72,120.50],[16.92,120.52],[17.10,120.48],[17.20,120.38],
  ],
  'Pangasinan': [
    [16.45,120.34],[16.55,120.28],[16.20,119.90],[15.95,119.82],
    [15.80,120.00],[15.78,120.25],[15.85,120.50],[16.00,120.60],
    [16.18,120.65],[16.38,120.60],[16.42,120.48],[16.45,120.34],
  ],
};

// ── Ilocos Region city coordinates ───────────────────────
const ILOCOS_CITIES = [
  // Ilocos Norte
  { name:'Laoag City',        lat:18.1977, lng:120.5937, province:'Ilocos Norte', weight:1.00 },
  { name:'Batac City',        lat:18.0554, lng:120.5648, province:'Ilocos Norte', weight:0.55 },
  { name:'Pagudpud',          lat:18.5629, lng:120.7940, province:'Ilocos Norte', weight:0.28 },
  { name:'Paoay',             lat:18.0663, lng:120.5291, province:'Ilocos Norte', weight:0.32 },
  { name:'Bacarra',           lat:18.2533, lng:120.6100, province:'Ilocos Norte', weight:0.26 },
  { name:'Marcos',            lat:18.1200, lng:120.7100, province:'Ilocos Norte', weight:0.22 },
  { name:'Burgos',            lat:18.5100, lng:120.6500, province:'Ilocos Norte', weight:0.18 },
  // Ilocos Sur
  { name:'Vigan City',        lat:17.5747, lng:120.3872, province:'Ilocos Sur',   weight:0.90 },
  { name:'Candon City',       lat:17.1970, lng:120.4491, province:'Ilocos Sur',   weight:0.50 },
  { name:'Narvacan',          lat:17.4213, lng:120.4388, province:'Ilocos Sur',   weight:0.30 },
  { name:'Santa',             lat:17.4800, lng:120.4300, province:'Ilocos Sur',   weight:0.25 },
  { name:'Bantay',            lat:17.6000, lng:120.3900, province:'Ilocos Sur',   weight:0.28 },
  { name:'Magsingal',         lat:17.6870, lng:120.4210, province:'Ilocos Sur',   weight:0.20 },
  { name:'Caoayan',           lat:17.5400, lng:120.3900, province:'Ilocos Sur',   weight:0.18 },
  // La Union
  { name:'San Fernando City', lat:16.6159, lng:120.3166, province:'La Union',     weight:0.95 },
  { name:'Bauang',            lat:16.5300, lng:120.3300, province:'La Union',     weight:0.45 },
  { name:'Agoo',              lat:16.3200, lng:120.3700, province:'La Union',     weight:0.38 },
  { name:'Naguilian',         lat:16.5300, lng:120.3950, province:'La Union',     weight:0.30 },
  { name:'San Juan',          lat:16.6700, lng:120.3300, province:'La Union',     weight:0.35 },
  { name:'Bacnotan',          lat:16.7200, lng:120.3500, province:'La Union',     weight:0.25 },
  // Pangasinan
  { name:'Dagupan City',      lat:16.0430, lng:120.3330, province:'Pangasinan',   weight:1.00 },
  { name:'Alaminos City',     lat:16.1555, lng:119.9796, province:'Pangasinan',   weight:0.60 },
  { name:'Urdaneta City',     lat:15.9765, lng:120.5706, province:'Pangasinan',   weight:0.65 },
  { name:'San Carlos City',   lat:15.9267, lng:120.3470, province:'Pangasinan',   weight:0.55 },
  { name:'Lingayen',          lat:16.0200, lng:120.2300, province:'Pangasinan',   weight:0.50 },
  { name:'Calasiao',          lat:16.0200, lng:120.3700, province:'Pangasinan',   weight:0.40 },
  { name:'Mangaldan',         lat:16.0700, lng:120.4000, province:'Pangasinan',   weight:0.36 },
];

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let _provPolygons = {};

// ── INIT MAP ─────────────────────────────────────────────
function initMap() {
  if (mapInstance) return;
  const el = document.getElementById('pawster-map');
  if (!el) return;

  mapInstance = L.map('pawster-map', {
    center: [17.0, 120.4],
    zoom: 8,
    zoomControl: false,
    attributionControl: true,
  });

  // Warm tile layer (OpenStreetMap with warm CSS filter via leaflet-tile-pane)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  // Draw province boundary polygons
  Object.entries(PROV_BOUNDS).forEach(([prov, coords]) => {
    const col = PROV_COLORS[prov];
    _provPolygons[prov] = L.polygon(coords, {
      color:       col.border,
      weight:      2,
      fillColor:   col.fill,
      fillOpacity: 0.10,
      dashArray:   '5 4',
    }).addTo(mapInstance);

    // Province label
    const center = coords.reduce((acc,c)=>[acc[0]+c[0]/coords.length, acc[1]+c[1]/coords.length], [0,0]);
    L.marker(center, {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          font-family:'Nunito',sans-serif;font-size:10px;font-weight:900;
          color:${col.border};
          background:rgba(255,252,235,0.82);
          border:1px solid ${col.fill}44;
          border-radius:6px;padding:2px 7px;
          white-space:nowrap;pointer-events:none;
          box-shadow:0 2px 8px rgba(100,70,20,0.12);
          text-transform:uppercase;letter-spacing:.06em;
        ">${prov}</div>`,
        iconAnchor: [40, 10],
        iconSize: [80, 20],
      }),
    }).addTo(mapInstance);
  });

  refreshMapData();
}

// ── DATA FETCH ───────────────────────────────────────────
async function refreshMapData() {
  try {
    const [adRes, rhRes, usRes] = await Promise.all([
      api('get_requests', { type:'adoptions', limit:500 }).catch(()=>({success:false})),
      api('get_requests', { type:'rehome',    limit:500 }).catch(()=>({success:false})),
      api('get_users',    {}).catch(()=>({success:false})),
    ]);
    mapData.adoptions = adRes.success ? (adRes.data||[]) : [];
    mapData.rehome    = rhRes.success ? (rhRes.data||[]) : [];
    mapData.users     = usRes.success ? (usRes.data||[]) : [];
  } catch(e) { /* use empty */ }
  renderMapLayer();
  renderTimeline();
  renderHeatGrid();
  updateProvinceRibbon();
}

// ── LAYER SWITCH ─────────────────────────────────────────
function setMapLayer(layer, btn) {
  mapLayer = layer;
  document.querySelectorAll('.map-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const labels = { adoptions:'Adoption Requests', rehome:'Rehome Requests', users:'Registered Users' };
  setText('map-layer-label', labels[layer] || layer);
  renderMapLayer();
  renderTimeline();
  renderHeatGrid();
  updateProvinceRibbon();
}

// ── PROVINCE FILTER ──────────────────────────────────────
function filterProvince(prov, card) {
  activeProvFilter = prov;
  document.querySelectorAll('.mpr-card').forEach(c => c.classList.remove('active'));
  if (card) card.classList.add('active');

  // Highlight boundaries
  Object.entries(_provPolygons).forEach(([name, poly]) => {
    const col = PROV_COLORS[name];
    if (prov === 'all' || prov === name) {
      poly.setStyle({ fillOpacity: prov === name ? 0.22 : 0.10, weight: prov === name ? 2.5 : 2 });
    } else {
      poly.setStyle({ fillOpacity: 0.04, weight: 1 });
    }
  });

  // Fly to province
  if (prov !== 'all') {
    const cities = ILOCOS_CITIES.filter(c => c.province === prov);
    if (cities.length && mapInstance) {
      const lats = cities.map(c=>c.lat), lngs = cities.map(c=>c.lng);
      mapInstance.flyToBounds([
        [Math.min(...lats)-0.1, Math.min(...lngs)-0.1],
        [Math.max(...lats)+0.1, Math.max(...lngs)+0.1],
      ], { duration: 1.2 });
    }
  } else {
    resetMapView();
  }

  renderMapLayer();
}

// ── PROVINCE RIBBON COUNTS ───────────────────────────────
function updateProvinceRibbon() {
  const records = mapData[mapLayer] || [];
  const total   = records.length;
  // Demo distribution by province weight totals
  const provWeights = { 'Ilocos Norte':1.8, 'Ilocos Sur':1.6, 'La Union':1.7, 'Pangasinan':2.6 };
  const wTotal = Object.values(provWeights).reduce((a,b)=>a+b,0);
  setText('mpr-count-all', total || '—');
  if (total > 0) {
    setText('mpr-count-IN', Math.round(total * provWeights['Ilocos Norte']/wTotal));
    setText('mpr-count-IS', Math.round(total * provWeights['Ilocos Sur']/wTotal));
    setText('mpr-count-LU', Math.round(total * provWeights['La Union']/wTotal));
  } else {
    ['IN','IS','LU'].forEach(k => setText('mpr-count-'+k,'—'));
  }
}

// ── RENDER MARKERS ───────────────────────────────────────
function renderMapLayer() {
  if (!mapInstance) return;
  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapMarkers = [];

  const records = mapData[mapLayer] || [];
  const total   = records.length;

  let cities = ILOCOS_CITIES;
  if (activeProvFilter !== 'all') cities = cities.filter(c => c.province === activeProvFilter);

  const cityData = cities.map(c => {
    const base     = Math.round(total * c.weight * (0.6 + Math.random() * 0.8));
    const count    = Math.max(0, base);
    const pending  = Math.round(count * 0.28);
    const approved = Math.round(count * 0.54);
    const rejected = Math.max(0, count - pending - approved);
    return { ...c, count, pending, approved, rejected };
  });

  const maxCount = Math.max(...cityData.map(c => c.count), 1);

  cityData.forEach(city => {
    if (city.count === 0) return;
    const ratio   = city.count / maxCount;
    const col     = PROV_COLORS[city.province] || { fill:'#588B41', border:'#3a6828' };
    const radius  = 7 + ratio * 20;
    const fillCol = blendHeatColor(col.fill, ratio);

    const circle = L.circleMarker([city.lat, city.lng], {
      radius,
      fillColor:   fillCol,
      color:       col.border,
      weight:      1.5,
      fillOpacity: 0.80,
    });

    circle.bindPopup(`
      <div class="map-popup-title">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${col.fill};flex-shrink:0"></span>
        ${city.name}
        <span class="map-popup-province">${city.province}</span>
      </div>
      <div class="map-popup-row"><span>Total</span><span class="map-popup-val">${city.count}</span></div>
      <div class="map-popup-row"><span>Pending</span><span class="map-popup-val" style="color:var(--amber)">${city.pending}</span></div>
      <div class="map-popup-row"><span>Approved</span><span class="map-popup-val" style="color:var(--green-border)">${city.approved}</span></div>
      <div class="map-popup-row"><span>Rejected</span><span class="map-popup-val" style="color:var(--red)">${city.rejected}</span></div>
      <button class="map-popup-sv-btn" onclick="openStreetViewForCity(${city.lat},${city.lng},'${city.name.replace(/'/,"\\'")}')">
        <i class="fas fa-street-view"></i> Open Street View
      </button>
    `, { maxWidth: 220 });

    circle.addTo(mapInstance);
    mapMarkers.push(circle);
  });

  // Stats
  const rec      = mapData[mapLayer] || [];
  const pendRec  = rec.filter(r=>r.status==='Pending').length;
  const apprRec  = rec.filter(r=>r.status==='Approved').length;
  const active   = cityData.filter(c=>c.count>0).length;
  animCount('msc-total',    rec.length);
  animCount('msc-pending',  pendRec);
  animCount('msc-approved', apprRec);
  animCount('msc-regions',  active);

  // Numbers block
  const pct   = rec.length > 0 ? Math.round((apprRec/rec.length)*100) : 0;
  const now   = new Date();
  const thisMo = rec.filter(r=>{ const d=new Date(r.created_at||''); return !isNaN(d)&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
  const lastM  = new Date(now); lastM.setMonth(lastM.getMonth()-1);
  const lastMo = rec.filter(r=>{ const d=new Date(r.created_at||''); return !isNaN(d)&&d.getMonth()===lastM.getMonth()&&d.getFullYear()===lastM.getFullYear(); }).length;
  const rejRec = rec.filter(r=>r.status==='Rejected').length;
  setText('mnb-pct',  pct+'%');
  setText('mnb-big1', thisMo || Math.round(rec.length*0.08));
  setText('mnb-big2', lastMo || Math.round(rec.length*0.07));
  setText('mnb-big3', rejRec || Math.round(rec.length*0.12));

  renderSidePanel(cityData, maxCount);
}

// ── BLEND COLOR ──────────────────────────────────────────
function blendHeatColor(baseHex, ratio) {
  // At low ratio → lighter/desaturated, at high → deeper + orange shift
  if (ratio < 0.3) return '#b8d898';  // light sage green
  if (ratio < 0.5) return '#8cc050';  // medium green
  if (ratio < 0.7) return '#d4880a';  // amber
  if (ratio < 0.85) return '#c87020'; // orange-amber
  return '#b84810';                   // deep orange-red
}

// ── SIDE PANEL ───────────────────────────────────────────
function renderSidePanel(cityData, maxCount) {
  const sorted = [...cityData].sort((a,b)=>b.count-a.count).slice(0,14);
  const listEl = document.getElementById('msp-list');
  const barsEl = document.getElementById('msp-bars');
  if (!listEl) return;
  setText('msp-count', sorted.length+' cities');

  listEl.innerHTML = sorted.map((c,i) => {
    const ratio = maxCount > 0 ? c.count/maxCount : 0;
    const col   = PROV_COLORS[c.province]?.fill || '#588B41';
    return `<div class="msp-region-row" onclick="panToCity(${c.lat},${c.lng})">
      <span class="msp-rank">${i+1}</span>
      <span class="msp-dot" style="background:${col}"></span>
      <div class="msp-region-info">
        <div class="msp-region-name">${esc(c.name)}</div>
        <div class="msp-region-sub">${esc(c.province)}</div>
        <div class="msp-region-bar-wrap"><div class="msp-region-bar" style="width:${Math.round(ratio*100)}%;background:${col}"></div></div>
      </div>
      <span class="msp-region-count">${c.count}</span>
    </div>`;
  }).join('');

  if (barsEl) {
    const top8 = sorted.slice(0,8);
    const mx = Math.max(...top8.map(c=>c.count),1);
    barsEl.innerHTML = top8.map((c,i) => {
      const h = Math.max(5, Math.round((c.count/mx)*58));
      const col = PROV_COLORS[c.province]?.fill || '#588B41';
      return `<div class="msp-bar" style="height:${h}px;background:${col};opacity:0.85">
        <div class="bar-tooltip">${esc(c.name)}: ${c.count}</div>
      </div>`;
    }).join('');
  }
}

// ── TIMELINE ─────────────────────────────────────────────
function renderTimeline() {
  const el = document.getElementById('mtc-chart');
  if (!el) return;
  const records = mapData[mapLayer] || [];
  const now = new Date();
  const curr = Array(12).fill(0);
  const prev = Array(12).fill(0);
  records.forEach(r => {
    const d = new Date(r.created_at||'');
    if (isNaN(d)) return;
    const dy = now.getFullYear()-d.getFullYear();
    if (dy===0) curr[d.getMonth()]++;
    else if (dy===1) prev[d.getMonth()]++;
  });
  const hasCurr = curr.some(v=>v>0);
  const cData = hasCurr ? curr : MONTHS_SHORT.map((_,i)=>Math.round(4+Math.sin(i*.6+1)*7+Math.random()*7+i*.3));
  const pData = hasCurr ? prev : cData.map(v=>Math.round(v*(.4+Math.random()*.5)));
  const maxV = Math.max(...cData,...pData,1);

  el.innerHTML = cData.map((val,i) => {
    const hc = Math.max(3, Math.round((val/maxV)*82));
    const hp = Math.max(2, Math.round((pData[i]/maxV)*82));
    const ratio = val/maxV;
    // Warm gradient: green → amber → orange
    const col = ratio < 0.4 ? '#5aaa30' : ratio < 0.7 ? '#d4880a' : '#c87020';
    const mo  = MONTHS_SHORT[(now.getMonth()-11+i+12)%12];
    return `<div class="mtc-bar-wrap">
      <div style="display:flex;align-items:flex-end;gap:1px;flex:1;width:100%">
        <div class="mtc-bar" style="height:${hp}px;background:#b8d898;flex:1">
          <div class="bar-tooltip">${mo} prev: ${pData[i]}</div>
        </div>
        <div class="mtc-bar" style="height:${hc}px;background:${col};flex:1">
          <div class="bar-tooltip">${mo}: ${val}</div>
        </div>
      </div>
      <span class="mtc-label">${mo}</span>
    </div>`;
  }).join('');
}

// ── HEAT GRID ────────────────────────────────────────────
function renderHeatGrid() {
  const gridEl   = document.getElementById('mhg-grid');
  const monthsEl = document.getElementById('mhg-months');
  if (!gridEl) return;
  const records  = mapData[mapLayer] || [];
  const now = new Date();
  const buckets  = Array(12).fill(0);
  records.forEach(r => {
    const d = new Date(r.created_at||'');
    if (isNaN(d)) return;
    const diff = (now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());
    if (diff>=0 && diff<12) buckets[11-diff]++;
  });
  const hasData = buckets.some(v=>v>0);
  const data = hasData ? buckets : MONTHS_SHORT.map((_,i)=>Math.round(2+Math.random()*18+i*.4));
  const maxV = Math.max(...data,1);

  gridEl.innerHTML = data.map((v,i) => {
    const ratio = v/maxV;
    // Warm spectrum: very light cream → sage → amber → orange
    let bg;
    if (ratio < 0.15) bg = '#f5f0e0';
    else if (ratio < 0.35) bg = '#c8e898';
    else if (ratio < 0.55) bg = '#8cc040';
    else if (ratio < 0.75) bg = '#d4880a';
    else if (ratio < 0.88) bg = '#c87020';
    else bg = '#b04010';
    const mo = MONTHS_SHORT[(now.getMonth()-11+i+12)%12];
    return `<div class="mhg-cell" style="background:${bg}" title="${mo}: ${v}">
      <div class="bar-tooltip" style="bottom:calc(100% + 3px)">${mo}: ${v}</div>
    </div>`;
  }).join('');

  if (monthsEl) {
    monthsEl.innerHTML = MONTHS_SHORT.map((_,i)=>
      `<div class="mhg-month-lbl">${MONTHS_SHORT[(now.getMonth()-11+i+12)%12]}</div>`
    ).join('');
  }
}

// ── MAP HELPERS ──────────────────────────────────────────
function panToCity(lat, lng) {
  if (mapInstance) mapInstance.flyTo([lat, lng], 11, { duration: 1.2 });
}
function resetMapView() {
  if (mapInstance) mapInstance.flyTo([17.0, 120.4], 8, { duration: 1 });
}

// ── STREET VIEW ──────────────────────────────────────────
function toggleStreetView() {
  if (svMode) closeStreetView();
  else openStreetViewForCity(17.5747, 120.3872, 'Vigan City');
}

function openStreetViewForCity(lat, lng, name) {
  const overlay  = document.getElementById('sv-overlay');
  const iframe   = document.getElementById('sv-iframe');
  const cityName = document.getElementById('sv-city-name');
  const btn      = document.getElementById('sv-toggle-btn');
  if (!overlay || !iframe) return;

  svMode = true;
  if (cityName) cityName.textContent = name;
  if (btn) btn.classList.add('active');

  iframe.style.display = 'block';
  // Google Maps Street View embed (no API key — uses standard embed)
  iframe.src = `https://www.google.com/maps?q=${lat},${lng}&layer=c&output=svembed&cbll=${lat},${lng}`;

  overlay.classList.add('visible');
  if (mapInstance) mapInstance.closePopup();
}

function closeStreetView() {
  const overlay = document.getElementById('sv-overlay');
  const iframe  = document.getElementById('sv-iframe');
  const btn     = document.getElementById('sv-toggle-btn');
  if (overlay) overlay.classList.remove('visible');
  if (iframe)  iframe.src = '';
  if (btn)     btn.classList.remove('active');
  svMode = false;
}

// ── NAV HOOK ─────────────────────────────────────────────
const _origNav = typeof nav === 'function' ? nav : null;
nav = function(el) {
  if (_origNav) _origNav(el);
  if (el && el.getAttribute && el.getAttribute('data-panel') === 'map') {
    setTimeout(() => {
      initMap();
      if (mapInstance) mapInstance.invalidateSize();
      if (!mapData.adoptions.length && !mapData.rehome.length) refreshMapData();
    }, 150);
  }
};