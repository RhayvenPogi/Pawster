/* =============================================
   PAWSTER — MISSING ANIMALS
   js/missing.js
   Requires: LOGGED_IN and USER_INIT globals
   set in missing.php before this script loads
   ============================================= */

let currentFilter  = 'all';
let currentSearch  = '';
let currentType    = 'all';
let currentOffset  = 0;
let isLoading      = false;
let hasMore        = true;

document.addEventListener('DOMContentLoaded', () => {
  loadFeed(true);
  loadRecentlyFound();
  loadStats();

  // Close modal when clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(ov =>
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); })
  );

  // Nav avatar dropdown
  const btn  = document.getElementById('avatarBtn');
  const drop = document.getElementById('profileDrop');
  if (btn && drop) {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      drop.classList.toggle('open');
      btn.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      drop.classList.remove('open');
      btn.classList.remove('open');
    });
  }
});

/* ── FILTER & SEARCH ── */
function setFilter(filter, btn) {
  currentFilter = filter;
  currentOffset = 0;
  document.querySelectorAll('.fpill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadFeed(true);
}

let searchTimer;
function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = document.getElementById('search-input').value.trim();
    currentType   = document.getElementById('type-filter').value;
    currentOffset = 0;
    loadFeed(true);
  }, 350);
}

/* ── LOAD FEED ── */
async function loadFeed(reset = false) {
  if (isLoading) return;
  if (reset) { currentOffset = 0; hasMore = true; }
  if (!hasMore && !reset) return;
  isLoading = true;

  const feed = document.getElementById('feed');
  if (reset) {
    feed.innerHTML = '<div class="feed-loading"><i class="fas fa-spinner"></i> Loading reports…</div>';
    document.getElementById('load-more-wrap').style.display = 'none';
  }

  const params = new URLSearchParams({
    action: 'get_posts',
    filter: currentFilter,
    search: currentSearch,
    type:   currentType,
    offset: currentOffset
  });

  try {
    const data = await (await fetch('missing_api.php?' + params)).json();
    if (!data.success) throw new Error(data.message || 'Error');
    if (reset) feed.innerHTML = '';

    if (!data.data.length && reset) {
      feed.innerHTML = `<div class="feed-empty">
        <i class="fas fa-search-location"></i>
        <p>No reports found${currentSearch ? ' for "' + esc(currentSearch) + '"' : ''}.<br>
        ${LOGGED_IN ? 'Be the first to post a report!' : '<a href="login.php">Log in</a> to post.'}</p>
      </div>`;
    } else {
      data.data.forEach(p => feed.insertAdjacentHTML('beforeend', buildCard(p)));
    }

    hasMore = data.has_more;
    currentOffset += data.data.length;
    document.getElementById('load-more-wrap').style.display = hasMore ? 'block' : 'none';
  } catch (e) {
    if (reset) feed.innerHTML = '<div class="feed-empty"><i class="fas fa-exclamation-circle"></i><p>Failed to load. Please try again.</p></div>';
  }
  isLoading = false;
}

function loadMore() { loadFeed(false); }

/* ── BUILD CARD HTML ── */
function buildCard(p) {
  const isFound = p.status === 'found';
  const imgHtml = p.photo_path
    ? `<div class="post-img-wrap"><img src="${esc(p.photo_path)}" alt="${esc(p.pet_name)}" loading="lazy" onerror="this.parentElement.style.display='none'"/><span class="post-img-label">${esc(p.animal_type)}</span></div>`
    : `<div class="post-img-wrap no-img">${emoji(p.animal_type)}</div>`;

  const details = [
    p.breed     ? `<span class="post-detail-item"><i class="fas fa-dna"></i>${esc(p.breed)}</span>`           : '',
    p.color     ? `<span class="post-detail-item"><i class="fas fa-palette"></i>${esc(p.color)}</span>`       : '',
    p.last_seen ? `<span class="post-detail-item"><i class="fas fa-map-marker-alt"></i>${esc(p.last_seen)}</span>` : '',
    p.contact   ? `<span class="post-detail-item"><i class="fas fa-phone"></i>${esc(p.contact)}</span>`       : '',
  ].filter(Boolean).join('');

  const foundBtn = isFound
    ? `<button class="pact-found found-done" disabled><i class="fas fa-check-circle"></i> Reunited</button>`
    : `<button class="pact-found" onclick="markFound(${p.id},this)"><i class="fas fa-check-circle"></i> Mark as Found</button>`;

  const ownerBtns = p.is_owner
    ? `${foundBtn}<button class="pact-delete" onclick="deletePost(${p.id},this)"><i class="fas fa-trash"></i> Delete</button>`
    : foundBtn;

  const commentInput = LOGGED_IN
    ? `<div class="comment-input-row">
        <div class="comment-avatar">${USER_INIT}</div>
        <input class="comment-input" id="ci-${p.id}" placeholder="Write a comment…" onkeydown="if(event.key==='Enter')sendComment(${p.id})"/>
        <button class="comment-send" onclick="sendComment(${p.id})"><i class="fas fa-paper-plane"></i></button>
       </div>`
    : `<p class="login-to-comment"><a href="login.php">Log in</a> to comment</p>`;

  return `
  <div class="post-card" id="post-${p.id}">
    <div class="post-head">
      <div class="post-avatar">${esc((p.poster_name || '??').substring(0, 2).toUpperCase())}</div>
      <div class="post-meta">
        <div class="post-poster">${esc(p.poster_name)}</div>
        <div class="post-time"><i class="fas fa-clock"></i>${esc(p.time_ago)}</div>
      </div>
      <span class="post-status-badge ${isFound ? 'status-found' : 'status-missing'}">${isFound ? '🟢 Found' : '🔴 Missing'}</span>
    </div>
    ${imgHtml}
    <div class="post-body">
      <div class="post-title">${esc(p.pet_name)}<span class="type-chip">${esc(p.animal_type)}</span></div>
      <div class="post-detail-row">${details}</div>
      ${p.description ? `<p class="post-desc clamped" id="desc-${p.id}">${esc(p.description)}</p><button class="read-more-btn" id="rmb-${p.id}" onclick="toggleDesc(${p.id})">Read more</button>` : ''}
    </div>
    <div class="post-actions">
      <button class="pact-btn ${p.user_liked ? 'liked' : ''}" id="like-btn-${p.id}" onclick="toggleLike(${p.id},this)">
        <i class="${p.user_liked ? 'fas' : 'far'} fa-heart" id="like-icon-${p.id}"></i>
        <span id="like-count-${p.id}">${p.like_count}</span>
      </button>
      <button class="pact-btn" onclick="toggleComments(${p.id})">
        <i class="far fa-comment"></i>
        <span id="comment-count-${p.id}">${p.comment_count}</span>
      </button>
      ${ownerBtns}
    </div>
    <div class="comments-section" id="comments-${p.id}">
      <div class="comments-divider"></div>
      <div id="comments-list-${p.id}"></div>
      ${commentInput}
    </div>
  </div>`;
}

/* ── INTERACTIONS ── */
function toggleDesc(id) {
  const d = document.getElementById('desc-' + id);
  const b = document.getElementById('rmb-' + id);
  b.textContent = d.classList.toggle('clamped') ? 'Read more' : 'Show less';
}

async function toggleLike(postId, btn) {
  if (!LOGGED_IN) { showToast('Please log in to like posts', 'err'); return; }
  const fd = new FormData();
  fd.append('action', 'toggle_like');
  fd.append('post_id', postId);
  try {
    const data = await (await fetch('missing_api.php', { method: 'POST', body: fd })).json();
    if (!data.success) throw new Error();
    btn.classList.toggle('liked', data.liked);
    document.getElementById('like-icon-' + postId).className = data.liked ? 'fas fa-heart' : 'far fa-heart';
    document.getElementById('like-count-' + postId).textContent = data.count;
  } catch (e) { showToast('Could not update like', 'err'); }
}

async function toggleComments(postId) {
  const sec  = document.getElementById('comments-' + postId);
  const open = sec.classList.toggle('open');
  if (open) {
    const data = await (await fetch(`missing_api.php?action=get_comments&post_id=${postId}`)).json();
    renderComments(postId, data.data || []);
  }
}

function renderComments(postId, comments) {
  const list = document.getElementById('comments-list-' + postId);
  if (!comments.length) { list.innerHTML = '<div class="no-comments">No comments yet. Be first!</div>'; return; }
  list.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-avatar">${esc(c.initials || '?')}</div>
      <div class="comment-bubble">
        <div class="comment-name">${esc(c.commenter_name)}</div>
        <div class="comment-text">${esc(c.body)}</div>
        <div class="comment-time">${esc(c.time_ago)}</div>
      </div>
    </div>`).join('');
}

async function sendComment(postId) {
  if (!LOGGED_IN) { showToast('Please log in to comment', 'err'); return; }
  const input = document.getElementById('ci-' + postId);
  const body  = input.value.trim();
  if (!body) return;
  const fd = new FormData();
  fd.append('action', 'add_comment');
  fd.append('post_id', postId);
  fd.append('body', body);
  try {
    const data = await (await fetch('missing_api.php', { method: 'POST', body: fd })).json();
    if (!data.success) throw new Error(data.message);
    input.value = '';
    const list  = document.getElementById('comments-list-' + postId);
    const empty = list.querySelector('.no-comments');
    if (empty) empty.remove();
    list.insertAdjacentHTML('beforeend', `
      <div class="comment-item">
        <div class="comment-avatar">${esc(data.initials || '?')}</div>
        <div class="comment-bubble">
          <div class="comment-name">${esc(data.commenter_name)}</div>
          <div class="comment-text">${esc(data.body)}</div>
          <div class="comment-time">Just now</div>
        </div>
      </div>`);
    const cnt = document.getElementById('comment-count-' + postId);
    if (cnt) cnt.textContent = parseInt(cnt.textContent || 0) + 1;
  } catch (e) { showToast(e.message || 'Could not post', 'err'); }
}

async function markFound(postId, btn) {
  if (!LOGGED_IN) { showToast('Please log in', 'err'); return; }
  if (!confirm('Mark this pet as found/reunited?')) return;
  const fd = new FormData();
  fd.append('action', 'mark_found');
  fd.append('post_id', postId);
  try {
    const data = await (await fetch('missing_api.php', { method: 'POST', body: fd })).json();
    if (!data.success) throw new Error(data.message);
    const card  = document.getElementById('post-' + postId);
    const badge = card.querySelector('.post-status-badge');
    badge.className   = 'post-status-badge status-found';
    badge.textContent = '🟢 Found';
    btn.className     = 'pact-found found-done';
    btn.disabled      = true;
    btn.innerHTML     = '<i class="fas fa-check-circle"></i> Reunited';
    showToast('🎉 Marked as found!');
    loadStats();
    loadRecentlyFound();
  } catch (e) { showToast(e.message || 'Error', 'err'); }
}

async function deletePost(postId, btn) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  const fd = new FormData();
  fd.append('action', 'delete_post');
  fd.append('post_id', postId);
  try {
    const data = await (await fetch('missing_api.php', { method: 'POST', body: fd })).json();
    if (!data.success) throw new Error(data.message);
    const card = document.getElementById('post-' + postId);
    card.style.cssText = 'transition:opacity .3s,transform .3s;opacity:0;transform:scale(0.96)';
    setTimeout(() => card.remove(), 300);
    showToast('Post deleted');
    loadStats();
  } catch (e) { showToast(e.message || 'Error', 'err'); }
}

/* ── SUBMIT NEW POST ── */
async function submitPost(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner" style="animation:spin .8s linear infinite"></i> Posting…';

  const fd = new FormData();
  fd.append('action',      'create_post');
  fd.append('pet_name',    document.getElementById('pf-name').value.trim());
  fd.append('animal_type', document.getElementById('pf-type').value);
  fd.append('breed',       document.getElementById('pf-breed').value.trim());
  fd.append('color',       document.getElementById('pf-color').value.trim());
  fd.append('last_seen',   document.getElementById('pf-location').value.trim());
  fd.append('description', document.getElementById('pf-desc').value.trim());
  fd.append('contact',     document.getElementById('pf-contact').value.trim());
  const ph = document.getElementById('pf-photo').files[0];
  if (ph) fd.append('photo', ph);

  try {
    const data = await (await fetch('missing_api.php', { method: 'POST', body: fd })).json();
    if (!data.success) throw new Error(data.message);
    closeModal('post-modal');
    document.getElementById('post-form').reset();
    removePostPhoto();
    showToast('🐾 Report posted! The community will help.');
    setFilter('all', document.querySelector('.fpill[data-filter="all"]'));
    loadStats();
  } catch (e) { showToast(e.message || 'Could not post report', 'err'); }

  btn.disabled  = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Report';
}

/* ── PHOTO PREVIEW ── */
function previewPostPhoto(input) {
  if (!input.files[0]) return;
  const r = new FileReader();
  r.onload = e => {
    document.getElementById('pf-preview').src = e.target.result;
    document.getElementById('pf-preview-wrap').style.display = 'block';
  };
  r.readAsDataURL(input.files[0]);
}
function removePostPhoto() {
  document.getElementById('pf-photo').value = '';
  document.getElementById('pf-preview').src = '';
  document.getElementById('pf-preview-wrap').style.display = 'none';
}

/* ── STATS ── */
async function loadStats() {
  try {
    const [a, m, f] = await Promise.all([
      fetch('missing_api.php?action=get_posts&filter=all&offset=0').then(r => r.json()),
      fetch('missing_api.php?action=get_posts&filter=missing&offset=0').then(r => r.json()),
      fetch('missing_api.php?action=get_posts&filter=found&offset=0').then(r => r.json()),
    ]);
    document.getElementById('stat-total').textContent   = a.data?.length || '0';
    document.getElementById('stat-missing').textContent = m.data?.length || '0';
    document.getElementById('stat-found').textContent   = f.data?.length || '0';
  } catch (e) {}
}

async function loadRecentlyFound() {
  const el = document.getElementById('recently-found');
  try {
    const data = await (await fetch('missing_api.php?action=get_posts&filter=found&offset=0')).json();
    if (!data.success || !data.data.length) {
      el.innerHTML = '<div style="text-align:center;padding:14px;color:var(--text-muted);font-size:13px">No reunions yet 🐾</div>';
      return;
    }
    el.innerHTML = data.data.slice(0, 4).map(p => `
      <div class="recent-found-item">
        <div class="rfi-emoji">${emoji(p.animal_type)}</div>
        <div>
          <div class="rfi-name">${esc(p.pet_name)}</div>
          <div class="rfi-loc">${esc(p.last_seen || '—')}</div>
        </div>
        <span class="rfi-badge">Found ✓</span>
      </div>`).join('');
  } catch (e) {
    el.innerHTML = '<div style="text-align:center;padding:14px;color:var(--text-muted);font-size:13px">Could not load</div>';
  }
}

/* ── HELPERS ── */
function emoji(type) { return { Dog: '🐕', Cat: '🐈', Bird: '🐦', Rabbit: '🐇' }[type] || '🐾'; }
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function showToast(message, type = 'ok') {
  const c = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = `toast${type === 'err' ? ' err' : ' ok'}`;
  t.innerHTML = `<i class="fas fa-${type === 'err' ? 'exclamation-circle' : 'circle-check'}"></i><span>${message}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity   = '0';
    t.style.transform = 'translateX(18px)';
    t.style.transition = 'all .3s';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}
function openModal(id)  { document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; document.body.style.overflow = ''; }