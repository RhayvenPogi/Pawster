/* =============================================
   PAWSTER — SHARED PAGE JS
   js/pawster_pages.js
   Load this on EVERY inner page before page-specific JS
   ============================================= */
(function () {

  /* ── SCROLL REVEAL ──────────────────────────
     Strategy:
     1. Elements already on screen → show immediately, no animation
     2. Elements off-screen → add .js-reveal to hide, then animate in
     3. If IntersectionObserver not supported → show everything
  ─────────────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      // Old browser — just show everything
      els.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.classList.remove('js-reveal');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      const onScreen = rect.top < window.innerHeight && rect.bottom > 0;

      if (onScreen) {
        // Already visible — don't hide it, just leave it as-is
        // (no .js-reveal, no .visible needed — default CSS shows it)
      } else {
        // Off screen — hide it and observe
        el.classList.add('js-reveal');
        observer.observe(el);
      }
    });
  }

  /* ── NAV AVATAR DROPDOWN ─────────────────── */
  function initNavDropdown() {
    const btn  = document.getElementById('avatarBtn');
    const drop = document.getElementById('profileDrop');
    if (!btn || !drop) return;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = drop.classList.toggle('open');
      btn.classList.toggle('open', open);
    });
    document.addEventListener('click', () => {
      drop.classList.remove('open');
      btn.classList.remove('open');
    });
  }

  /* ── FAQ ACCORDION ───────────────────────── */
  function initFaq() {
    document.querySelectorAll('.faq-q').forEach(q => {
      q.addEventListener('click', () => q.parentElement.classList.toggle('open'));
    });
  }

  /* ── GLOBAL TOAST ────────────────────────── */
  window.showToast = function (msg, type) {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'err' ? ' err' : ' ok');
    t.innerHTML = `<i class="fas fa-${type === 'err' ? 'exclamation-circle' : 'circle-check'}"></i><span>${msg}</span>`;
    wrap.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(18px)';
      t.style.transition = 'all .3s';
      setTimeout(() => t.remove(), 300);
    }, 3500);
  };

  /* ── INIT ────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  function run() {
    initReveal();
    initNavDropdown();
    initFaq();
  }

}());