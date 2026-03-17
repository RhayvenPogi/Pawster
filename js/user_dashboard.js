/* =============================================
   PAWSTER — USER DASHBOARD
   user_dashboard.js
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initDropdown();
  initModals();
  initParallax();
  initDogCursor();
});

/* ══════════════════════════════════════════
   DROPDOWN
══════════════════════════════════════════ */
function initDropdown() {
  const btn  = document.getElementById('avatarBtn');
  const drop = document.getElementById('profileDrop');
  if (!btn || !drop) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = drop.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
  });

  document.addEventListener('click', () => {
    drop.classList.remove('open');
    btn.classList.remove('open');
  });
}

/* ══════════════════════════════════════════
   MODALS
══════════════════════════════════════════ */
function initModals() {
  // Close on overlay click
  document.getElementById('mEdit')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAll();
  });
  document.getElementById('mPwd')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAll();
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
  });
}

function openEdit() {
  document.getElementById('mEdit').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function openPwd() {
  document.getElementById('mPwd').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeAll() {
  ['mEdit', 'mPwd'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════
   PASSWORD SHOW / HIDE
══════════════════════════════════════════ */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.innerHTML = isText
    ? '<i class="fas fa-eye"></i>'
    : '<i class="fas fa-eye-slash"></i>';
}

/* ══════════════════════════════════════════
   SAVE PROFILE
══════════════════════════════════════════ */
function saveEdit() {
  const fn = document.getElementById('eFirst').value.trim();
  const ln = document.getElementById('eLast').value.trim();
  const em = document.getElementById('eEmail').value.trim();

  // Clear errors
  ['eFirstErr','eLastErr','eEmailErr'].forEach(id => setText(id, ''));

  let ok = true;
  if (!fn) { setText('eFirstErr', 'Required.');       ok = false; }
  if (!ln) { setText('eLastErr',  'Required.');       ok = false; }
  if (!em) { setText('eEmailErr', 'Required.');       ok = false; }
  else if (!/\S+@\S+\.\S+/.test(em)) {
    setText('eEmailErr', 'Invalid email.'); ok = false;
  }
  if (!ok) return;

  const fd = new FormData();
  fd.append('action',    'update_profile');
  fd.append('firstName', fn);
  fd.append('lastName',  ln);
  fd.append('email',     em);
  fd.append('phone',     document.getElementById('ePhone').value.trim());
  fd.append('city',      document.getElementById('eCity').value.trim());
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

/* ══════════════════════════════════════════
   CHANGE PASSWORD
══════════════════════════════════════════ */
function savePwd() {
  const cur  = document.getElementById('pCur').value;
  const nw   = document.getElementById('pNew').value;
  const conf = document.getElementById('pConf').value;

  ['pCurErr','pNewErr','pConfErr'].forEach(id => setText(id, ''));

  let ok = true;
  if (!cur)          { setText('pCurErr',  'Required.');                ok = false; }
  if (nw.length < 8) { setText('pNewErr',  'Min 8 characters.');        ok = false; }
  if (nw !== conf)   { setText('pConfErr', 'Passwords do not match.');  ok = false; }
  if (!ok) return;

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
        // Clear fields
        ['pCur','pNew','pConf'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
      } else {
        toast(d.message || 'Failed.', 'err');
      }
    })
    .catch(() => toast('Server error.', 'err'));
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
function toast(msg, type = 'ok') {
  const icons = {
    ok:  '<i class="fas fa-circle-check"></i>',
    err: '<i class="fas fa-circle-xmark"></i>',
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icons[type] || icons.ok}<span>${msg}</span>`;
  document.getElementById('toast-wrap').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ══════════════════════════════════════════
   UTILITY
══════════════════════════════════════════ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ══════════════════════════════════════════
   MESH PARALLAX
══════════════════════════════════════════ */
function initParallax() {
  const orbs = [
    { el: document.querySelector('.orb-1'), fx:  0.09, fy:  0.06 },
    { el: document.querySelector('.orb-2'), fx: -0.11, fy:  0.08 },
    { el: document.querySelector('.orb-3'), fx:  0.12, fy: -0.07 },
    { el: document.querySelector('.orb-4'), fx: -0.08, fy: -0.10 },
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
      if (el) {
        el.style.marginLeft = (cx * fx) + 'px';
        el.style.marginTop  = (cy * fy) + 'px';
      }
    });
    requestAnimationFrame(anim);
  })();
}

/* ══════════════════════════════════════════
   DOG CURSOR
══════════════════════════════════════════ */
function initDogCursor() {
  const el = document.getElementById('dc');
  if (!el) return;

  let mX = innerWidth / 2, mY = innerHeight / 2;
  let dX = mX, dY = mY;
  let facingRight = true, isClicking = false;

  document.addEventListener('mousemove', e => {
    mX = e.clientX;
    mY = e.clientY;
  });

  document.addEventListener('mousedown', () => {
    isClicking = true;
    el.className = 'clicking';
    setTimeout(() => { isClicking = false; }, 300);
  });

  (function loop() {
    if (!isClicking) {
      const dx   = mX - dX;
      const dy   = mY - dY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        dX += (dx / dist) * Math.min(dist * 0.13, 18);
        dY += (dy / dist) * Math.min(dist * 0.13, 18);

        const right = dx > 0;
        if (right !== facingRight) {
          facingRight = right;
          const svg = document.getElementById('dog-svg');
          if (svg) svg.style.transform = facingRight ? 'scaleX(1)' : 'scaleX(-1)';
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