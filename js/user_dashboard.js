/* ══════════════════════════════════════════════════════════
   user_dashboard.js
   Reads USER constant (injected by user_dashboard.php),
   populates the page, and wires up all interactions.
══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  populatePage();
  bindEvents();
  initParallax();
  initDogCursor();
});

/* ── 2. Populate dynamic content from USER ─────────────── */
function populatePage() {
  const u = USER; // injected by PHP

  // Topbar
  setText('topFirstName', u.firstName);

  // Sidebar
  setText('sbInitials', u.initials);
  setText('sbFullName', u.fullName || u.firstName);
  setText('sbEmail',    u.email);

  // Stat cards
  setText('statPct',  u.profilePct + '%');
  setText('statDays', u.daysSince);
  document.getElementById('statBar').style.width = u.profilePct + '%';

  // Identity panel
  setText('idInitials', u.initials);
  document.getElementById('idStatusRing').className = 'id-status-ring ' + u.status;
  setText('idFullName', u.fullName || u.firstName);
  setText('idEmail',    u.email || '—');
  setText('idJoinDate', u.joinDate || '—');

  if (u.city) {
    const loc = u.city + (u.province ? ', ' + u.province : '');
    setText('idLocation', loc);
    document.getElementById('idLocationRow').style.display = 'flex';
  }

  // Details panel
  setText('dFirst',    u.firstName  || '—');
  setText('dLast',     u.lastName   || '—');
  setText('dEmail',    u.email      || '—');
  setText('dPhone',    u.phone      || '—');
  setText('dCity',     u.city       || '—');
  setText('dProvince', u.province   || '—');

  // Pre-fill edit modal inputs
  val('eFirst',    u.firstName);
  val('eLast',     u.lastName);
  val('eEmail',    u.email);
  val('ePhone',    u.phone);
  val('eCity',     u.city);
  val('eProvince', u.province);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function val(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

/* ── 3. Event bindings ──────────────────────────────────── */
function bindEvents() {

  // Sidebar overlay
  document.getElementById('sbOverlay').addEventListener('click', closeSidebar);

  // Sidebar links → open modals
  document.getElementById('sbEditLink').addEventListener('click', e => { e.preventDefault(); openEdit(); });
  document.getElementById('sbPwdLink') .addEventListener('click', e => { e.preventDefault(); openPwd(); });

  // Action cards
  document.getElementById('btnEdit').addEventListener('click', e => { e.preventDefault(); openEdit(); });
  document.getElementById('btnPwd') .addEventListener('click', e => { e.preventDefault(); openPwd(); });

  // Edit modal
  document.getElementById('closeEdit') .addEventListener('click', closeAll);
  document.getElementById('cancelEdit').addEventListener('click', closeAll);
  document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
  document.getElementById('mEdit').addEventListener('click', e => { if (e.target === e.currentTarget) closeAll(); });

  // Password modal
  document.getElementById('closePwd') .addEventListener('click', closeAll);
  document.getElementById('cancelPwd').addEventListener('click', closeAll);
  document.getElementById('savePwdBtn').addEventListener('click', savePwd);
  document.getElementById('mPwd').addEventListener('click', e => { if (e.target === e.currentTarget) closeAll(); });

  // Keyboard escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
}

/* ── Sidebar ────────────────────────────────────────────── */
function closeSidebar() {
  document.getElementById('sidebar')  .classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('show');
}

function toggleSidebar() {
  document.getElementById('sidebar')  .classList.toggle('open');
  document.getElementById('sbOverlay').classList.toggle('show');
}

/* ── Modal helpers ──────────────────────────────────────── */
function openEdit() { showModal('mEdit'); }
function openPwd()  { showModal('mPwd'); }

function closeAll() {
  ['mEdit', 'mPwd'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.body.style.overflow = '';
}

function showModal(id) {
  document.getElementById(id).style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/* ── Save profile ───────────────────────────────────────── */
function saveEdit() {
  const fn = document.getElementById('eFirst').value.trim();
  const ln = document.getElementById('eLast') .value.trim();
  const em = document.getElementById('eEmail').value.trim();

  document.getElementById('eFirstErr').textContent = '';
  document.getElementById('eLastErr') .textContent = '';
  document.getElementById('eEmailErr').textContent = '';

  let valid = true;
  if (!fn) { document.getElementById('eFirstErr').textContent = 'Required.'; valid = false; }
  if (!ln) { document.getElementById('eLastErr') .textContent = 'Required.'; valid = false; }
  if (!em) {
    document.getElementById('eEmailErr').textContent = 'Required.'; valid = false;
  } else if (!/\S+@\S+\.\S+/.test(em)) {
    document.getElementById('eEmailErr').textContent = 'Invalid email.'; valid = false;
  }
  if (!valid) return;

  const fd = new FormData();
  fd.append('action',    'update_profile');
  fd.append('firstName', fn);
  fd.append('lastName',  ln);
  fd.append('email',     em);
  fd.append('phone',     document.getElementById('ePhone')   .value.trim());
  fd.append('city',      document.getElementById('eCity')    .value.trim());
  fd.append('province',  document.getElementById('eProvince').value.trim());

  fetch('update_profile.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(d => {
      if (d.success) {
        toast('Profile updated!', 'ok');
        closeAll();
        setTimeout(() => location.reload(), 1000);
      } else {
        toast(d.message || 'Update failed.', 'err');
      }
    })
    .catch(() => toast('Server error.', 'err'));
}

/* ── Change password ────────────────────────────────────── */
function savePwd() {
  const cur  = document.getElementById('pCur') .value;
  const nw   = document.getElementById('pNew') .value;
  const conf = document.getElementById('pConf').value;

  document.getElementById('pCurErr') .textContent = '';
  document.getElementById('pNewErr') .textContent = '';
  document.getElementById('pConfErr').textContent = '';

  let valid = true;
  if (!cur)          { document.getElementById('pCurErr') .textContent = 'Required.';             valid = false; }
  if (nw.length < 8) { document.getElementById('pNewErr') .textContent = 'Min 8 characters.';     valid = false; }
  if (nw !== conf)   { document.getElementById('pConfErr').textContent = 'Passwords do not match.'; valid = false; }
  if (!valid) return;

  const fd = new FormData();
  fd.append('action',  'change_password');
  fd.append('current', cur);
  fd.append('new',     nw);

  fetch('update_profile.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(d => {
      if (d.success) {
        toast('Password changed!', 'ok');
        closeAll();
      } else {
        toast(d.message || 'Failed.', 'err');
      }
    })
    .catch(() => toast('Server error.', 'err'));
}

/* ── Toast ──────────────────────────────────────────────── */
function toast(msg, type = 'ok') {
  const icons = {
    ok:  `<svg width="14" height="14" fill="none" stroke="#5aaa30" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
    err: `<svg width="14" height="14" fill="none" stroke="#d04040" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icons[type] || icons.ok}<span>${msg}</span>`;
  document.getElementById('toastBox').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ── Mesh parallax ──────────────────────────────────────── */
function initParallax() {
  const orbs = [
    { el: document.getElementById('o1'), fx:  0.10, fy:  0.07 },
    { el: document.getElementById('o2'), fx: -0.12, fy:  0.09 },
    { el: document.getElementById('o3'), fx:  0.14, fy: -0.08 },
    { el: document.getElementById('o4'), fx: -0.08, fy: -0.11 },
    { el: document.getElementById('o5'), fx:  0.09, fy:  0.13 },
    { el: document.getElementById('o6'), fx: -0.13, fy:  0.07 },
  ];

  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth  - 0.5) * 80;
    my = (e.clientY / innerHeight - 0.5) * 80;
  });
  (function anim() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    orbs.forEach(({ el, fx, fy }) => {
      if (el) { el.style.marginLeft = (cx * fx) + 'px'; el.style.marginTop = (cy * fy) + 'px'; }
    });
    requestAnimationFrame(anim);
  })();
}

/* ── Dog cursor ─────────────────────────────────────────── */
function initDogCursor() {
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { cursor: none !important; }
    #dc {
      position: fixed; z-index: 99999; pointer-events: none;
      width: 28px; height: 28px; transform: translate(-50%, -50%);
    }
    #dc svg { overflow: visible; }
    @keyframes lfw { 0%,100%{transform-origin:30px 28px;transform:rotate(-22deg)} 50%{transform-origin:30px 28px;transform:rotate(22deg)} }
    @keyframes lbw { 0%,100%{transform-origin:14px 28px;transform:rotate(22deg)}  50%{transform-origin:14px 28px;transform:rotate(-22deg)} }
    @keyframes tw  { 0%,100%{transform-origin:8px 18px;transform:rotate(-18deg)}  50%{transform-origin:8px 18px;transform:rotate(18deg)} }
    @keyframes bb  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.5px)} }
    @keyframes ef  { 0%,100%{transform-origin:36px 10px;transform:rotate(0)} 50%{transform-origin:36px 10px;transform:rotate(8deg)} }
    @keyframes ss  { 0%{transform:translateY(0)} 40%{transform:translateY(-3px)} 100%{transform:translateY(0)} }
    @keyframes pt  { 0%,100%{transform-origin:30px 28px;transform:rotate(0)} 50%{transform-origin:30px 28px;transform:rotate(-30deg)} }
    #dc.walking  #dog-body      { animation: bb  .28s ease-in-out infinite; }
    #dc.walking  #dog-leg-front { animation: lfw .28s ease-in-out infinite; }
    #dc.walking  #dog-leg-back  { animation: lbw .28s ease-in-out infinite; }
    #dc.walking  #dog-tail      { animation: tw  .28s ease-in-out infinite; }
    #dc.walking  #dog-ear       { animation: ef  .32s ease-in-out infinite; }
    #dc.idle     #dog-tail      { animation: tw  .6s  ease-in-out infinite; }
    #dc.clicking #dog-body      { animation: ss  .2s  ease-out    forwards; }
    #dc.clicking #dog-leg-front { animation: pt  .18s ease-in-out 2; }
  `;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'dc';
  el.innerHTML = `
    <svg id="dog-svg" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="27" cy="50" rx="14" ry="3" fill="rgba(0,0,0,0.13)"/>
      <g id="dog-tail"><path d="M10 22 Q2 14 6 8 Q10 4 12 10 Q10 16 14 20Z" fill="#c8a06a" stroke="#7a5530" stroke-width="1.2" stroke-linejoin="round"/></g>
      <g id="dog-body">
        <g id="dog-leg-back"><rect x="11" y="30" width="6" height="14" rx="3" fill="#b8904a" stroke="#7a5530" stroke-width="1"/><ellipse cx="14" cy="44" rx="5" ry="3" fill="#a07838" stroke="#7a5530" stroke-width="1"/></g>
        <rect x="10" y="16" width="28" height="18" rx="9" fill="#d4a96a" stroke="#7a5530" stroke-width="1.5"/>
        <ellipse cx="24" cy="28" rx="9" ry="5" fill="#f0d090" opacity=".7"/>
        <g id="dog-leg-front"><rect x="27" y="30" width="6" height="14" rx="3" fill="#c8a06a" stroke="#7a5530" stroke-width="1"/><ellipse cx="30" cy="44" rx="5" ry="3" fill="#a07838" stroke="#7a5530" stroke-width="1"/></g>
        <rect x="30" y="12" width="10" height="12" rx="5" fill="#c89850" stroke="#7a5530" stroke-width="1.2"/>
        <ellipse cx="38" cy="10" rx="10" ry="9" fill="#d4a96a" stroke="#7a5530" stroke-width="1.5"/>
        <ellipse cx="46" cy="13" rx="5" ry="4" fill="#e8c080" stroke="#7a5530" stroke-width="1"/>
        <ellipse cx="50" cy="12" rx="2.2" ry="1.8" fill="#4a2a10"/>
        <circle cx="42" cy="8" r="2.2" fill="#2a1a08"/>
        <circle cx="42.8" cy="7.3" r=".7" fill="#fff"/>
        <g id="dog-ear"><path d="M36 4 Q40 0 44 3 Q42 8 38 9Z" fill="#b87840" stroke="#7a5530" stroke-width="1" stroke-linejoin="round"/></g>
        <rect x="31" y="16" width="10" height="3.5" rx="1.8" fill="#2a7a40" stroke="#1a5030" stroke-width=".8"/>
        <circle cx="36" cy="17.8" r="1.2" fill="#f0c830"/>
      </g>
    </svg>`;
  document.body.appendChild(el);

  let mX = innerWidth / 2, mY = innerHeight / 2;
  let dX = mX, dY = mY;
  let facingRight = true, isClicking = false;

  document.addEventListener('mousemove', e => { mX = e.clientX; mY = e.clientY; });
  document.addEventListener('mousedown', () => {
    isClicking = true;
    el.className = 'clicking';
    setTimeout(() => { isClicking = false; }, 300);
  });

  (function loop() {
    if (!isClicking) {
      const dx = mX - dX, dy = mY - dY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        dX += (dx / dist) * Math.min(dist * 0.13, 18);
        dY += (dy / dist) * Math.min(dist * 0.13, 18);
        const right = dx > 0;
        if (right !== facingRight) {
          facingRight = right;
          document.getElementById('dog-svg').style.transform = facingRight ? 'scaleX(1)' : 'scaleX(-1)';
        }
        el.className = dist > 7 ? 'walking' : 'idle';
      } else {
        el.className = 'idle';
      }
    }
    el.style.left = dX + 'px';
    el.style.top  = dY + 'px';
    requestAnimationFrame(loop);
  })();
}