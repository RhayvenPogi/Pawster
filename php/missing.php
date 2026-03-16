<?php
session_start();
$loggedIn  = isset($_SESSION['user_id']);
$initials  = strtoupper(substr($_SESSION['first_name']??'U',0,1).substr($_SESSION['last_name']??'',0,1));
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pawster — Missing Animals</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/style.css"/>    ← your base styles
  <link rel="stylesheet" href="../css/missing.css"/>  ← page-specific styles on top

</head>
<body>

<div id="toast-w"></div>

<!-- NAV -->
<nav>
  <div class="nav-inner">
    <a href="index.html" class="logo">
      <div class="logo-ic"><i class="fas fa-paw"></i></div>
      Pawster
    </a>
    <ul class="nav-links" id="nav-links">
      <li><a href="index.html"         onclick="setActiveNav(this)">Home</a></li>
      <li><a href="index.html#animals" onclick="setActiveNav(this)">Animals</a></li>
      <li><a href="missing.php" class="active" onclick="setActiveNav(this)">Missing Pets</a></li>
      <li><a href="index.html#contact" onclick="setActiveNav(this)">Contact</a></li>
    </ul>
    <div class="nav-right">
      <button class="admin-btn" onclick="window.open('admin.html','_blank')">
        <i class="fas fa-shield-alt"></i> Admin Panel
      </button>
      <button class="ham" id="ham" onclick="toggleMobileMenu()"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>

<!-- HERO -->
<div class="missing-hero">
  <div class="sec-tag"><i class="fas fa-search-location"></i> Community Reports</div>
  <h1>Missing <span>&amp;</span> Found Pets</h1>
  <p>Help reunite lost animals with their families. Post a sighting, share a report, and spread the word across the Ilocos Region.</p>
  <div class="hero-btns">
    <?php if ($loggedIn): ?>
      <button class="btn-post" onclick="openModal('post-modal')">
        <i class="fas fa-plus"></i> Report Missing Pet
      </button>
    <?php else: ?>
      <button class="btn-post" onclick="window.location.href='login.html'">
        <i class="fas fa-sign-in-alt"></i> Log In to Post
      </button>
    <?php endif; ?>
    <button class="btn-o" style="border-color:rgba(255,255,255,0.5);color:#fff;background:rgba(255,255,255,0.12)"
            onclick="document.querySelector('.missing-layout').scrollIntoView({behavior:'smooth'})">
      <i class="fas fa-list"></i> Browse Reports
    </button>
  </div>
</div>

<!-- STATS STRIP -->
<div class="missing-strip">
  <div class="missing-strip-in">
    <div class="mstrip-stat"><div class="mstrip-val" id="stat-total">—</div><div class="mstrip-lbl">Total Reports</div></div>
    <div class="mstrip-div"></div>
    <div class="mstrip-stat"><div class="mstrip-val" id="stat-missing">—</div><div class="mstrip-lbl">Still Missing</div></div>
    <div class="mstrip-div"></div>
    <div class="mstrip-stat"><div class="mstrip-val" id="stat-found">—</div><div class="mstrip-lbl">Reunited</div></div>
  </div>
</div>

<!-- FILTER BAR -->
<div class="missing-fbar">
  <div class="missing-fbar-inner">
    <div class="filter-pills">
      <button class="fpill active" data-filter="all"     onclick="setFilter('all',this)">All</button>
      <button class="fpill orange" data-filter="missing" onclick="setFilter('missing',this)">🔴 Missing</button>
      <button class="fpill"        data-filter="found"   onclick="setFilter('found',this)">🟢 Found</button>
    </div>
    <div class="sw" style="flex:1;max-width:320px">
      <i class="fas fa-search"></i>
      <input type="text" id="search-input" placeholder="Search by name, location…" oninput="onSearch()"/>
    </div>
    <select class="fsel" id="type-filter" onchange="onSearch()">
      <option value="all">All Animals</option>
      <option value="Dog">Dogs</option>
      <option value="Cat">Cats</option>
      <option value="Bird">Birds</option>
      <option value="Rabbit">Rabbits</option>
      <option value="Other">Other</option>
    </select>
  </div>
</div>

<!-- MAIN LAYOUT -->
<div class="missing-layout">
  <div>
    <div class="feed" id="feed">
      <div class="feed-loading"><i class="fas fa-spinner"></i></div>
    </div>
    <div class="load-more-wrap" id="load-more-wrap" style="display:none;margin-top:16px">
      <button class="load-more-btn" onclick="loadMore()"><i class="fas fa-arrow-down"></i> Load More</button>
    </div>
  </div>

  <aside class="missing-sidebar">
    <div class="sidebar-card fu">
      <div class="sidebar-card-head"><i class="fas fa-lightbulb"></i> Tips for Finding Lost Pets</div>
      <div class="sidebar-card-body">
        <div class="tip-item"><div class="tip-num">1</div><div class="tip-text">Search within a 3–5 block radius immediately. Lost pets often hide nearby.</div></div>
        <div class="tip-item"><div class="tip-num">2</div><div class="tip-text">Post on barangay Facebook groups and Pawster's feed with a clear photo.</div></div>
        <div class="tip-item"><div class="tip-num">3</div><div class="tip-text">Place used clothing near your door — your scent can guide them home.</div></div>
        <div class="tip-item"><div class="tip-num">4</div><div class="tip-text">Contact local vets and animal shelters with a description and photo.</div></div>
        <div class="tip-item"><div class="tip-num">5</div><div class="tip-text">Check at dusk and dawn — animals are more active and less afraid then.</div></div>
      </div>
    </div>
    <div class="sidebar-card fu">
      <div class="sidebar-card-head"><i class="fas fa-heart"></i> Recently Reunited</div>
      <div class="sidebar-card-body" id="recently-found">
        <div style="text-align:center;padding:16px;color:var(--text-light);font-size:13px">
          <i class="fas fa-spinner" style="animation:spin .8s linear infinite;font-size:18px;margin-bottom:8px;display:block"></i>Loading…
        </div>
      </div>
    </div>
    <?php if ($loggedIn): ?>
    <div class="sidebar-card fu">
      <div class="sidebar-card-body" style="text-align:center;padding:22px 18px">
        <div style="font-size:36px;margin-bottom:12px">🐾</div>
        <h3 style="font-family:'Playfair Display',serif;font-size:17px;margin-bottom:8px">Missing a Pet?</h3>
        <p style="font-size:13px;color:var(--text-light);margin-bottom:16px;line-height:1.55">Post a report and let the community help find your furry friend.</p>
        <button class="btn-p" style="width:100%;justify-content:center" onclick="openModal('post-modal')">
          <i class="fas fa-plus"></i> Post Report
        </button>
      </div>
    </div>
    <?php endif; ?>
  </aside>
</div>

<!-- POST MODAL -->
<div class="mover" id="post-modal">
  <div class="mbox">
    <div class="mhead">
      <h2><i class="fas fa-exclamation-circle" style="color:var(--c2);margin-right:8px;font-size:20px"></i>Report Missing Pet</h2>
      <button class="mcls" onclick="closeModal('post-modal')">&times;</button>
    </div>
    <div class="mbody">
      <form id="post-form" onsubmit="submitPost(event)">
        <div class="fgrid">
          <div class="fg">
            <label>Pet Name *</label>
            <input type="text" id="pf-name" required placeholder="e.g. Max"/>
          </div>
          <div class="fg">
            <label>Animal Type *</label>
            <select id="pf-type" required>
              <option value="Dog">Dog</option><option value="Cat">Cat</option>
              <option value="Bird">Bird</option><option value="Rabbit">Rabbit</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="fg">
            <label>Breed</label>
            <input type="text" id="pf-breed" placeholder="e.g. Labrador"/>
          </div>
          <div class="fg">
            <label>Color / Markings</label>
            <input type="text" id="pf-color" placeholder="e.g. Brown with white patch"/>
          </div>
          <div class="fg full">
            <label>Last Seen Location *</label>
            <input type="text" id="pf-location" required placeholder="e.g. Near SM Laoag, Ilocos Norte"/>
          </div>
          <div class="fg full">
            <label>Description *</label>
            <textarea id="pf-desc" required placeholder="Describe your pet, when they went missing, any distinctive features…" style="min-height:90px"></textarea>
          </div>
          <div class="fg full">
            <label>Contact Number / Info *</label>
            <input type="text" id="pf-contact" required placeholder="e.g. 09XX-XXX-XXXX"/>
          </div>
          <div class="fg full">
            <label>Upload Photo <span style="color:var(--text-light);font-weight:400">(recommended)</span></label>
            <label class="photo-upload-label" for="pf-photo">
              <i class="fas fa-camera" style="font-size:18px"></i>
              <span>Click to upload a photo</span>
              <input type="file" id="pf-photo" accept="image/*" onchange="previewPostPhoto(this)"/>
            </label>
            <div class="photo-preview-wrap" id="pf-preview-wrap">
              <img id="pf-preview" src="" alt="Preview"/>
              <button type="button" class="photo-remove" onclick="removePostPhoto()"><i class="fas fa-times"></i></button>
            </div>
          </div>
        </div>
        <button type="submit" class="sbm org" style="margin-top:20px">
          <i class="fas fa-paper-plane"></i> Post Report
        </button>
      </form>
    </div>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <div class="foot-in">
    <div class="foot-top">
      <div class="foot-brand">
        <div class="foot-logo"><i class="fas fa-paw"></i> Pawster</div>
        <p>Giving every rescued animal a second chance at happiness. We believe every pet deserves love.</p>
        <div class="srow">
          <a href="#" class="sbtn"><i class="fab fa-facebook-f"></i></a>
          <a href="#" class="sbtn"><i class="fab fa-instagram"></i></a>
          <a href="#" class="sbtn"><i class="fab fa-twitter"></i></a>
        </div>
      </div>
      <div class="foot-col">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="index.html#animals">Browse Animals</a></li>
          <li><a href="missing.php">Missing Pets</a></li>
          <li><a href="index.html#contact">Contact Us</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>Actions</h4>
        <ul>
          <li><a href="index.html">Apply to Adopt</a></li>
          <li><a href="index.html">Rehome a Pet</a></li>
          <li><a href="missing.php">Report Missing Pet</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bot">
      &copy; 2024 Pawster. All rights reserved. Made with <i class="fas fa-heart" style="color:#ef4444"></i> for every animal.
    </div>
  </div>
</footer>

<script>
const LOGGED_IN = <?= $loggedIn ? 'true' : 'false' ?>;
const USER_INIT = <?= json_encode($initials) ?>;

let currentFilter = 'all', currentSearch = '', currentType = 'all';
let currentOffset = 0, isLoading = false, hasMore = true;

document.addEventListener('DOMContentLoaded', () => {
  loadFeed(true);
  loadRecentlyFound();
  loadStats();
  setupModalOverlayClose();
  setupScrollAnimations();
});

function setFilter(filter, btn) {
  currentFilter = filter; currentOffset = 0;
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

async function loadFeed(reset = false) {
  if (isLoading) return;
  if (reset) { currentOffset = 0; hasMore = true; }
  if (!hasMore && !reset) return;
  isLoading = true;

  const feed = document.getElementById('feed');
  if (reset) {
    feed.innerHTML = '<div class="feed-loading"><i class="fas fa-spinner"></i></div>';
    document.getElementById('load-more-wrap').style.display = 'none';
  }

  const params = new URLSearchParams({ action:'get_posts', filter:currentFilter, search:currentSearch, type:currentType, offset:currentOffset });
  try {
    const data = await (await fetch('missing_api.php?'+params)).json();
    if (!data.success) throw new Error(data.message||'Error');
    if (reset) feed.innerHTML = '';

    if (!data.data.length && reset) {
      feed.innerHTML = `<div class="feed-empty"><i class="fas fa-search-location"></i><p>No reports found${currentSearch?' for "'+esc(currentSearch)+'"':''}.<br>${LOGGED_IN?'Be the first to post a report!':'Log in to post a report.'}</p></div>`;
    } else {
      data.data.forEach(p => feed.insertAdjacentHTML('beforeend', buildCard(p)));
      observeFadeUp();
    }

    hasMore = data.has_more;
    currentOffset += data.data.length;
    document.getElementById('load-more-wrap').style.display = hasMore ? 'block' : 'none';
  } catch(e) {
    if (reset) feed.innerHTML = '<div class="feed-empty"><i class="fas fa-exclamation-circle"></i><p>Failed to load. Please try again.</p></div>';
  }
  isLoading = false;
}

function loadMore() { loadFeed(false); }

function buildCard(p) {
  const isFound   = p.status === 'found';
  const imgHtml   = p.photo_path
    ? `<div class="post-img-wrap"><img src="${esc(p.photo_path)}" alt="${esc(p.pet_name)}" loading="lazy" onerror="this.parentElement.style.display='none'"/><span class="post-img-label">${esc(p.animal_type)}</span></div>`
    : `<div class="post-img-wrap" style="height:80px;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--cream)">${emoji(p.animal_type)}</div>`;

  const details = [
    p.breed?`<span class="post-detail-item"><i class="fas fa-dna"></i>${esc(p.breed)}</span>`:'',
    p.color?`<span class="post-detail-item"><i class="fas fa-palette"></i>${esc(p.color)}</span>`:'',
    p.last_seen?`<span class="post-detail-item"><i class="fas fa-map-marker-alt"></i>${esc(p.last_seen)}</span>`:'',
    p.contact?`<span class="post-detail-item"><i class="fas fa-phone"></i>${esc(p.contact)}</span>`:'',
  ].filter(Boolean).join('');

  const foundBtn = isFound
    ? `<button class="pact-found found-done" disabled><i class="fas fa-check-circle"></i> Reunited</button>`
    : `<button class="pact-found" onclick="markFound(${p.id},this)"><i class="fas fa-check-circle"></i> Mark as Found</button>`;

  const ownerBtns = p.is_owner
    ? `${foundBtn}<button class="pact-delete" onclick="deletePost(${p.id},this)"><i class="fas fa-trash"></i> Delete</button>`
    : foundBtn;

  return `
  <div class="post-card fu" id="post-${p.id}">
    <div class="post-head">
      <div class="post-avatar">${esc((p.poster_name||'??').substring(0,2).toUpperCase())}</div>
      <div class="post-meta">
        <div class="post-poster">${esc(p.poster_name)}</div>
        <div class="post-time"><i class="fas fa-clock" style="font-size:10px;margin-right:3px"></i>${esc(p.time_ago)}</div>
      </div>
      <span class="post-status-badge ${isFound?'status-found':'status-missing'}">${isFound?'🟢 Found':'🔴 Missing'}</span>
    </div>
    ${imgHtml}
    <div class="post-body">
      <div class="post-title">${esc(p.pet_name)}<span class="type-chip">${esc(p.animal_type)}</span></div>
      <div class="post-detail-row">${details}</div>
      ${p.description?`<p class="post-desc clamped" id="desc-${p.id}">${esc(p.description)}</p><button class="read-more-btn" id="rmb-${p.id}" onclick="toggleDesc(${p.id})">Read more</button>`:''}
    </div>
    <div class="post-actions">
      <button class="pact-btn ${p.user_liked?'liked':''}" id="like-btn-${p.id}" onclick="toggleLike(${p.id},this)">
        <i class="${p.user_liked?'fas':'far'} fa-heart" id="like-icon-${p.id}"></i>
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
      <div id="comments-list-${p.id}"><div class="no-comments">Loading…</div></div>
      ${LOGGED_IN?`
      <div class="comment-input-row" style="margin-top:10px">
        <div class="comment-avatar">${USER_INIT}</div>
        <input class="comment-input" id="ci-${p.id}" placeholder="Write a comment…" onkeydown="if(event.key==='Enter'){sendComment(${p.id})}"/>
        <button class="comment-send" onclick="sendComment(${p.id})"><i class="fas fa-paper-plane"></i></button>
      </div>`:`<p style="text-align:center;font-size:12px;color:var(--text-light);padding:8px 0"><a href="login.html" style="color:var(--c1)">Log in</a> to comment</p>`}
    </div>
  </div>`;
}

function toggleDesc(id) {
  const d = document.getElementById('desc-'+id), b = document.getElementById('rmb-'+id);
  const c = d.classList.toggle('clamped');
  b.textContent = c ? 'Read more' : 'Show less';
}

async function toggleLike(postId, btn) {
  if (!LOGGED_IN) { showToast('Please log in to like posts','err'); return; }
  const fd = new FormData(); fd.append('action','toggle_like'); fd.append('post_id',postId);
  try {
    const data = await (await fetch('missing_api.php',{method:'POST',body:fd})).json();
    if (!data.success) throw new Error();
    btn.classList.toggle('liked', data.liked);
    document.getElementById('like-icon-'+postId).className = data.liked?'fas fa-heart':'far fa-heart';
    document.getElementById('like-count-'+postId).textContent = data.count;
  } catch(e) { showToast('Could not update like','err'); }
}

async function toggleComments(postId) {
  const sec  = document.getElementById('comments-'+postId);
  const open = sec.classList.toggle('open');
  if (open) {
    const fd = new FormData(); // use GET
    const data = await (await fetch(`missing_api.php?action=get_comments&post_id=${postId}`)).json();
    renderComments(postId, data.data || []);
  }
}

function renderComments(postId, comments) {
  const list = document.getElementById('comments-list-'+postId);
  if (!comments.length) { list.innerHTML='<div class="no-comments">No comments yet. Be first!</div>'; return; }
  list.innerHTML = comments.map(c=>`
    <div class="comment-item">
      <div class="comment-avatar">${esc((c.initials||'?'))}</div>
      <div class="comment-bubble">
        <div class="comment-name">${esc(c.commenter_name)}</div>
        <div class="comment-text">${esc(c.body)}</div>
        <div class="comment-time">${esc(c.time_ago)}</div>
      </div>
    </div>`).join('');
}

async function sendComment(postId) {
  if (!LOGGED_IN) { showToast('Please log in to comment','err'); return; }
  const input = document.getElementById('ci-'+postId);
  const body  = input.value.trim();
  if (!body) return;
  const fd = new FormData(); fd.append('action','add_comment'); fd.append('post_id',postId); fd.append('body',body);
  try {
    const data = await (await fetch('missing_api.php',{method:'POST',body:fd})).json();
    if (!data.success) throw new Error(data.message);
    input.value = '';
    const list = document.getElementById('comments-list-'+postId);
    const empty = list.querySelector('.no-comments'); if(empty) empty.remove();
    list.insertAdjacentHTML('beforeend',`
      <div class="comment-item">
        <div class="comment-avatar">${esc(data.initials||'?')}</div>
        <div class="comment-bubble">
          <div class="comment-name">${esc(data.commenter_name)}</div>
          <div class="comment-text">${esc(data.body)}</div>
          <div class="comment-time">Just now</div>
        </div>
      </div>`);
    const cnt = document.getElementById('comment-count-'+postId);
    if(cnt) cnt.textContent = parseInt(cnt.textContent||0)+1;
  } catch(e) { showToast(e.message||'Could not post','err'); }
}

async function markFound(postId, btn) {
  if (!LOGGED_IN) { showToast('Please log in','err'); return; }
  if (!confirm('Mark this pet as found/reunited?')) return;
  const fd = new FormData(); fd.append('action','mark_found'); fd.append('post_id',postId);
  try {
    const data = await (await fetch('missing_api.php',{method:'POST',body:fd})).json();
    if (!data.success) throw new Error(data.message);
    const card  = document.getElementById('post-'+postId);
    const badge = card.querySelector('.post-status-badge');
    badge.className='post-status-badge status-found'; badge.textContent='🟢 Found';
    btn.className='pact-found found-done'; btn.disabled=true; btn.innerHTML='<i class="fas fa-check-circle"></i> Reunited';
    showToast('🎉 Marked as found!');
    loadStats(); loadRecentlyFound();
  } catch(e) { showToast(e.message||'Error','err'); }
}

async function deletePost(postId, btn) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  const fd = new FormData(); fd.append('action','delete_post'); fd.append('post_id',postId);
  try {
    const data = await (await fetch('missing_api.php',{method:'POST',body:fd})).json();
    if (!data.success) throw new Error(data.message);
    const card = document.getElementById('post-'+postId);
    card.style.cssText = 'transition:opacity .3s,transform .3s;opacity:0;transform:scale(0.96)';
    setTimeout(()=>card.remove(),300);
    showToast('Post deleted'); loadStats();
  } catch(e) { showToast(e.message||'Error','err'); }
}

async function submitPost(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner" style="animation:spin .8s linear infinite"></i> Posting…';
  const fd = new FormData();
  fd.append('action','create_post');
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
    const data = await (await fetch('missing_api.php',{method:'POST',body:fd})).json();
    if (!data.success) throw new Error(data.message);
    closeModal('post-modal');
    document.getElementById('post-form').reset();
    removePostPhoto();
    showToast('🐾 Report posted! The community will help.');
    setFilter('all', document.querySelector('.fpill[data-filter="all"]'));
    loadStats();
  } catch(e) { showToast(e.message||'Could not post report','err'); }
  btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Post Report';
}

function previewPostPhoto(input) {
  if (!input.files[0]) return;
  const r = new FileReader();
  r.onload = e => { document.getElementById('pf-preview').src=e.target.result; document.getElementById('pf-preview-wrap').style.display='block'; };
  r.readAsDataURL(input.files[0]);
}
function removePostPhoto() {
  document.getElementById('pf-photo').value='';
  document.getElementById('pf-preview').src='';
  document.getElementById('pf-preview-wrap').style.display='none';
}

async function loadStats() {
  try {
    const [a,m,f] = await Promise.all([
      fetch('missing_api.php?action=get_posts&filter=all&offset=0').then(r=>r.json()),
      fetch('missing_api.php?action=get_posts&filter=missing&offset=0').then(r=>r.json()),
      fetch('missing_api.php?action=get_posts&filter=found&offset=0').then(r=>r.json()),
    ]);
    // First page gives us up to 8; good enough for a stat strip
    document.getElementById('stat-total').textContent   = a.data?.length  || '0';
    document.getElementById('stat-missing').textContent = m.data?.length  || '0';
    document.getElementById('stat-found').textContent   = f.data?.length  || '0';
  } catch(e){}
}

async function loadRecentlyFound() {
  const el = document.getElementById('recently-found');
  try {
    const data = await (await fetch('missing_api.php?action=get_posts&filter=found&offset=0')).json();
    if (!data.success || !data.data.length) { el.innerHTML='<div style="text-align:center;padding:14px;color:var(--text-light);font-size:13px">No reunions yet 🐾</div>'; return; }
    el.innerHTML = data.data.slice(0,4).map(p=>`
      <div class="recent-found-item">
        <div class="rfi-emoji">${emoji(p.animal_type)}</div>
        <div><div class="rfi-name">${esc(p.pet_name)}</div><div class="rfi-loc">${esc(p.last_seen||'—')}</div></div>
        <span class="rfi-badge">Found ✓</span>
      </div>`).join('');
  } catch(e) { el.innerHTML='<div style="text-align:center;padding:14px;color:var(--text-light);font-size:13px">Could not load</div>'; }
}

function emoji(type) { return {Dog:'🐕',Cat:'🐈',Bird:'🐦',Rabbit:'🐇'}[type]||'🐾'; }
function esc(s) { if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ── Reuse same patterns as script.js ── */
function showToast(message, type='success') {
  const c = document.getElementById('toast-w');
  const t = document.createElement('div');
  t.className = `toast${type==='err'?' err':''}`;
  t.innerHTML = `<i class="fas fa-${type==='err'?'exclamation-circle':'circle-check'}"></i><span>${message}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(18px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(),300); },3500);
}
function openModal(id)  { document.getElementById(id).classList.add('open');    document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }
function setupModalOverlayClose() {
  document.querySelectorAll('.mover').forEach(ov=>ov.addEventListener('click',e=>{ if(e.target===ov)closeModal(ov.id); }));
}
function setActiveNav(el) { document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active')); el.classList.add('active'); }
function toggleMobileMenu() { document.getElementById('nav-links').classList.toggle('open'); }
function observeFadeUp() {
  const obs = new IntersectionObserver(entries=>{ entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('vis'); }); },{threshold:0.07});
  document.querySelectorAll('.fu').forEach(el=>obs.observe(el));
}
function setupScrollAnimations() { observeFadeUp(); }
</script>
</body>
</html>