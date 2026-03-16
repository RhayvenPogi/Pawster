<?php
session_start();
$activePage = 'pets';
require_once 'nav.php';
// DB connection
$conn = pg_connect("host=localhost port=5432 dbname=pawster_db user=postgres password=1234");
// Fetch animals
$type   = $_GET['type']   ?? 'all';
$status = $_GET['status'] ?? 'all';
$search = trim($_GET['search'] ?? '');
$where  = []; $params = []; $pi = 1;
if ($type   !== 'all') { $where[] = "type=\$$pi";   $params[] = $type;   $pi++; }
if ($status !== 'all') { $where[] = "status=\$$pi"; $params[] = $status; $pi++; }
if ($search !== '')    { $where[] = "(name ILIKE \$$pi OR breed ILIKE \$$pi)"; $params[] = '%'.$search.'%'; $pi++; }
$whereSQL = $where ? 'WHERE '.implode(' AND ',$where) : '';
$q = $conn ? pg_query_params($conn,"SELECT * FROM animals $whereSQL ORDER BY created_at DESC LIMIT 50",$params) : false;
$animals = ($q ? pg_fetch_all($q) : false) ?: [];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Find a Pet — Pawster</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/find_a_pet.css"/>
  <style>
    .animals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.2rem;margin-top:2rem;}
    .animal-card{background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s;cursor:pointer;}
    .animal-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg);border-color:rgba(90,170,48,0.42);}
    .ac-img{height:180px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:linear-gradient(135deg,rgba(255,248,220,0.6),rgba(255,240,200,0.4));border-bottom:1.5px solid var(--border);position:relative;}
    .ac-status{position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:50px;font-size:10px;font-weight:800;text-transform:uppercase;}
    .s-available{background:rgba(88,139,65,0.88);color:#fff;}
    .s-pending  {background:rgba(180,90,34,0.88);color:#fff;}
    .s-adopted  {background:rgba(100,100,100,0.8);color:#fff;}
    .ac-body{padding:1rem 1.1rem 1.2rem;}
    .ac-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:800;color:var(--green-dark);}
    .ac-meta{font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-top:0.2rem;font-family:'DM Mono',monospace;}
    .ac-btn{display:flex;align-items:center;justify-content:center;gap:0.4rem;margin-top:0.85rem;padding:0.55rem;background:rgba(28,79,9,0.08);border:1.5px solid rgba(90,170,48,0.3);border-radius:9px;font-size:0.78rem;font-weight:800;color:var(--green-mid);transition:all 0.18s;cursor:pointer;width:100%;font-family:'Nunito',sans-serif;}
    .animal-card:hover .ac-btn{background:var(--green-mid);color:#fff;border-color:var(--green-mid);}
    .filter-bar{background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);padding:1.2rem 1.4rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;margin-bottom:0.5rem;}
    .filter-bar input,.filter-bar select{background:rgba(255,250,232,0.7);border:1.5px solid var(--border);border-radius:10px;padding:0.6rem 0.9rem;font-family:'Nunito',sans-serif;font-size:0.86rem;font-weight:600;color:var(--text);outline:none;transition:all 0.18s;}
    .filter-bar input{flex:1;min-width:180px;}
    .filter-bar input:focus,.filter-bar select:focus{border-color:var(--green-border);box-shadow:0 0 0 3px rgba(90,170,48,0.12);}
    .empty-state{text-align:center;padding:4rem 2rem;color:var(--text-muted);}
    .empty-state i{font-size:3rem;opacity:0.3;display:block;margin-bottom:1rem;}
  </style>
</head>
<body>
<div class="mesh-bg"><div class="mesh-base"></div><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div><div class="orb orb-4"></div><div class="mesh-grid"></div><div class="grain"></div><div class="vignette"></div></div>
<div id="toast-wrap"></div>

<div class="page-hero">
  <div class="hero-tag"><i class="fas fa-search"></i> Browse Animals</div>
  <h1>Find Your <em>Forever</em> Friend</h1>
  <p>All animals are health-checked, vaccinated, and ready for a loving home across the Ilocos Region.</p>
</div>

<div class="page-wrap">
  <!-- Filter Bar -->
  <form method="GET" class="filter-bar reveal">
    <i class="fas fa-search" style="color:var(--text-muted);font-size:0.85rem"></i>
    <input type="text" name="search" placeholder="Search by name or breed…" value="<?= htmlspecialchars($search) ?>"/>
    <select name="type">
      <option value="all" <?= $type==='all'?'selected':'' ?>>All Types</option>
      <option value="Dog"   <?= $type==='Dog'?'selected':'' ?>>Dogs</option>
      <option value="Cat"   <?= $type==='Cat'?'selected':'' ?>>Cats</option>
      <option value="Other" <?= $type==='Other'?'selected':'' ?>>Others</option>
    </select>
    <select name="status">
      <option value="all"       <?= $status==='all'?'selected':'' ?>>All Status</option>
      <option value="Available" <?= $status==='Available'?'selected':'' ?>>Available</option>
      <option value="Pending"   <?= $status==='Pending'?'selected':'' ?>>Pending</option>
      <option value="Adopted"   <?= $status==='Adopted'?'selected':'' ?>>Adopted</option>
    </select>
    <button type="submit" class="btn-primary" style="padding:0.6rem 1.4rem">
      <i class="fas fa-search"></i> Search
    </button>
  </form>

  <?php if (empty($animals)): ?>
    <div class="empty-state glass-card" style="padding:3rem">
      <i class="fas fa-paw"></i>
      <p style="font-size:1rem;font-weight:700">No animals found matching your search.</p>
      <a href="find_a_pet.php" class="btn-secondary" style="margin-top:1rem;display:inline-flex">Clear filters</a>
    </div>
  <?php else: ?>
    <p class="reveal" style="font-size:0.82rem;color:var(--text-muted);font-weight:700;margin-bottom:0.2rem">
      Showing <?= count($animals) ?> animal<?= count($animals)!==1?'s':'' ?>
    </p>
    <div class="animals-grid">
      <?php foreach ($animals as $i => $a):
        $emoji = ['Dog'=>'🐕','Cat'=>'🐈','Bird'=>'🐦','Rabbit'=>'🐇'][$a['type']] ?? '🐾';
        $sCls  = ['Available'=>'s-available','Pending'=>'s-pending','Adopted'=>'s-adopted'][$a['status']] ?? 's-adopted';
      ?>
      <div class="animal-card reveal" style="transition-delay:<?= ($i%4)*0.07 ?>s">
        <div class="ac-img">
          <?php if (!empty($a['image_path'])): ?>
            <img src="<?= htmlspecialchars($a['image_path']) ?>" alt="<?= htmlspecialchars($a['name']) ?>" style="width:100%;height:100%;object-fit:cover"/>
          <?php else: ?>
            <?= $emoji ?>
          <?php endif; ?>
          <span class="ac-status <?= $sCls ?>"><?= htmlspecialchars($a['status']) ?></span>
        </div>
        <div class="ac-body">
          <div class="ac-name"><?= htmlspecialchars($a['name']) ?></div>
          <div class="ac-meta"><?= htmlspecialchars($a['type']) ?> <?= $a['breed']?'· '.htmlspecialchars($a['breed']):'' ?> <?= $a['age']?'· '.htmlspecialchars($a['age']):'' ?></div>
          <?php if ($a['status']==='Available'): ?>
            <button class="ac-btn" onclick="openAdopt(<?= $a['id'] ?>, '<?= htmlspecialchars(addslashes($a['name'])) ?>')">
              <i class="fas fa-heart"></i> Adopt <?= htmlspecialchars($a['name']) ?>
            </button>
          <?php else: ?>
            <div class="ac-btn" style="cursor:default;opacity:0.55"><i class="fas fa-clock"></i> <?= htmlspecialchars($a['status']) ?></div>
          <?php endif; ?>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<!-- ADOPT MODAL -->
<div class="modal-overlay" id="adopt-modal" style="display:none" onclick="if(event.target===this)closeModal('adopt-modal')">
  <div class="modal-box">
    <div class="modal-head">
      <div class="modal-head-icon"><i class="fas fa-heart"></i></div>
      <span class="modal-title" id="adopt-title">Adoption Request</span>
      <button class="modal-close" onclick="closeModal('adopt-modal')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <form id="adopt-form" onsubmit="submitAdopt(event)">
        <input type="hidden" id="adopt-animal-id"/>
        <div class="form-grid">
          <div class="form-field full"><label>Full Name *</label><input type="text" id="af-name" required placeholder="Your full name"/></div>
          <div class="form-field"><label>Phone *</label><input type="tel" id="af-phone" required placeholder="+63 9XX XXX XXXX"/></div>
          <div class="form-field"><label>Email *</label><input type="email" id="af-email" required placeholder="you@email.com"/></div>
          <div class="form-field full"><label>Address *</label><input type="text" id="af-address" required placeholder="Your home address"/></div>
          <div class="form-field"><label>Housing Type *</label>
            <select id="af-housing" required>
              <option value="">Select…</option>
              <option>House with yard</option><option>Apartment</option><option>Condo</option><option>Other</option>
            </select>
          </div>
          <div class="form-field"><label>Pet Experience *</label>
            <select id="af-exp" required>
              <option value="">Select…</option>
              <option>First time</option><option>Some experience</option><option>Very experienced</option>
            </select>
          </div>
          <div class="form-field full"><label>Why do you want to adopt? *</label>
            <textarea id="af-reason" required placeholder="Tell us about yourself…"></textarea>
          </div>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem">
          <i class="fas fa-paper-plane"></i> Submit Request
        </button>
      </form>
    </div>
  </div>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div><div class="footer-logo"><i class="fas fa-paw"></i> Pawster</div><p class="footer-desc">Connecting loving homes with animals in need across the Ilocos Region.</p></div>
    <div class="footer-col"><h4>Navigate</h4><a href="index.php">Home</a><a href="find_a_pet.php">Find a Pet</a><a href="how_it_works.php">How It Works</a><a href="missing.php">Missing Pets</a></div>
    <div class="footer-col"><h4>Actions</h4><a href="rehome.php">Rehome a Pet</a><a href="about.php">About Us</a><?php if($loggedInNav):?><a href="<?=$navDash?>">My Dashboard</a><?php endif;?></div>
  </div>
  <div class="footer-bottom">&copy; 2025 Pawster. All rights reserved.</div>
</footer>

<script>
function openAdopt(id, name) {
  document.getElementById('adopt-animal-id').value = id;
  document.getElementById('adopt-title').textContent = 'Adopt ' + name;
  document.getElementById('adopt-modal').style.display = 'flex';
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function submitAdopt(e) {
  e.preventDefault();
  const fd = new FormData();
  fd.append('action','add_adoption');
  fd.append('animal_id', document.getElementById('adopt-animal-id').value);
  fd.append('name',    document.getElementById('af-name').value);
  fd.append('phone',   document.getElementById('af-phone').value);
  fd.append('email',   document.getElementById('af-email').value);
  fd.append('address', document.getElementById('af-address').value);
  fd.append('housing', document.getElementById('af-housing').value);
  fd.append('exp',     document.getElementById('af-exp').value);
  fd.append('reason',  document.getElementById('af-reason').value);
  try {
    const r = await fetch('adoption_api.php', { method:'POST', body:fd });
    const d = await r.json();
    if (d.success) { closeModal('adopt-modal'); document.getElementById('adopt-form').reset(); toast('Request submitted! We\'ll be in touch soon 🐾'); }
    else toast(d.message || 'Error submitting', 'err');
  } catch(e) { toast('Server error', 'err'); }
}

function toast(msg, type='ok') {
  const c = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas fa-${type==='err'?'exclamation-circle':'circle-check'}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(18px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(),300); },3500);
}

// Scroll reveal
new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); } });
}, {threshold:0.08}).observe ? document.querySelectorAll('.reveal').forEach(el =>
  new IntersectionObserver(([e]) => { if(e.isIntersecting) e.target.classList.add('visible'); },{threshold:0.08}).observe(el)
) : null;

// Nav dropdown
const btn=document.getElementById('avatarBtn'),drop=document.getElementById('profileDrop');
if(btn&&drop){btn.addEventListener('click',e=>{e.stopPropagation();drop.classList.toggle('open');btn.classList.toggle('open');});document.addEventListener('click',()=>{drop.classList.remove('open');btn.classList.remove('open');});}
</script>
</body>
</html><?php
session_start();
$activePage = 'pets';
require_once 'nav.php';
// DB connection
$conn = pg_connect("host=localhost port=5432 dbname=pawster_db user=postgres password=1234");
// Fetch animals
$type   = $_GET['type']   ?? 'all';
$status = $_GET['status'] ?? 'all';
$search = trim($_GET['search'] ?? '');
$where  = []; $params = []; $pi = 1;
if ($type   !== 'all') { $where[] = "type=\$$pi";   $params[] = $type;   $pi++; }
if ($status !== 'all') { $where[] = "status=\$$pi"; $params[] = $status; $pi++; }
if ($search !== '')    { $where[] = "(name ILIKE \$$pi OR breed ILIKE \$$pi)"; $params[] = '%'.$search.'%'; $pi++; }
$whereSQL = $where ? 'WHERE '.implode(' AND ',$where) : '';
$q = $conn ? pg_query_params($conn,"SELECT * FROM animals $whereSQL ORDER BY created_at DESC LIMIT 50",$params) : false;
$animals = ($q ? pg_fetch_all($q) : false) ?: [];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Find a Pet — Pawster</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/pawster_pages.css"/>
  <link rel="stylesheet" href="../css/find_a_pet.css"/>
</head>
<body>
<div class="mesh-bg"><div class="mesh-base"></div><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div><div class="orb orb-4"></div><div class="mesh-grid"></div><div class="grain"></div><div class="vignette"></div></div>
<div id="toast-wrap"></div>

<div class="page-hero">
  <div class="hero-tag"><i class="fas fa-search"></i> Browse Animals</div>
  <h1>Find Your <em>Forever</em> Friend</h1>
  <p>All animals are health-checked, vaccinated, and ready for a loving home across the Ilocos Region.</p>
</div>

<div class="page-wrap">
  <!-- Filter Bar -->
  <form method="GET" class="filter-bar reveal">
    <i class="fas fa-search" style="color:var(--text-muted);font-size:0.85rem"></i>
    <input type="text" name="search" placeholder="Search by name or breed…" value="<?= htmlspecialchars($search) ?>"/>
    <select name="type">
      <option value="all" <?= $type==='all'?'selected':'' ?>>All Types</option>
      <option value="Dog"   <?= $type==='Dog'?'selected':'' ?>>Dogs</option>
      <option value="Cat"   <?= $type==='Cat'?'selected':'' ?>>Cats</option>
      <option value="Other" <?= $type==='Other'?'selected':'' ?>>Others</option>
    </select>
    <select name="status">
      <option value="all"       <?= $status==='all'?'selected':'' ?>>All Status</option>
      <option value="Available" <?= $status==='Available'?'selected':'' ?>>Available</option>
      <option value="Pending"   <?= $status==='Pending'?'selected':'' ?>>Pending</option>
      <option value="Adopted"   <?= $status==='Adopted'?'selected':'' ?>>Adopted</option>
    </select>
    <button type="submit" class="btn-primary" style="padding:0.6rem 1.4rem">
      <i class="fas fa-search"></i> Search
    </button>
  </form>

  <?php if (empty($animals)): ?>
    <div class="empty-state glass-card" style="padding:3rem">
      <i class="fas fa-paw"></i>
      <p style="font-size:1rem;font-weight:700">No animals found matching your search.</p>
      <a href="find_a_pet.php" class="btn-secondary" style="margin-top:1rem;display:inline-flex">Clear filters</a>
    </div>
  <?php else: ?>
    <p class="reveal" style="font-size:0.82rem;color:var(--text-muted);font-weight:700;margin-bottom:0.2rem">
      Showing <?= count($animals) ?> animal<?= count($animals)!==1?'s':'' ?>
    </p>
    <div class="animals-grid">
      <?php foreach ($animals as $i => $a):
        $emoji = ['Dog'=>'🐕','Cat'=>'🐈','Bird'=>'🐦','Rabbit'=>'🐇'][$a['type']] ?? '🐾';
        $sCls  = ['Available'=>'s-available','Pending'=>'s-pending','Adopted'=>'s-adopted'][$a['status']] ?? 's-adopted';
      ?>
      <div class="animal-card reveal" style="transition-delay:<?= ($i%4)*0.07 ?>s">
        <div class="ac-img">
          <?php if (!empty($a['image_path'])): ?>
            <img src="<?= htmlspecialchars($a['image_path']) ?>" alt="<?= htmlspecialchars($a['name']) ?>" style="width:100%;height:100%;object-fit:cover"/>
          <?php else: ?>
            <?= $emoji ?>
          <?php endif; ?>
          <span class="ac-status <?= $sCls ?>"><?= htmlspecialchars($a['status']) ?></span>
        </div>
        <div class="ac-body">
          <div class="ac-name"><?= htmlspecialchars($a['name']) ?></div>
          <div class="ac-meta"><?= htmlspecialchars($a['type']) ?> <?= $a['breed']?'· '.htmlspecialchars($a['breed']):'' ?> <?= $a['age']?'· '.htmlspecialchars($a['age']):'' ?></div>
          <?php if ($a['status']==='Available'): ?>
            <button class="ac-btn" onclick="openAdopt(<?= $a['id'] ?>, '<?= htmlspecialchars(addslashes($a['name'])) ?>')">
              <i class="fas fa-heart"></i> Adopt <?= htmlspecialchars($a['name']) ?>
            </button>
          <?php else: ?>
            <div class="ac-btn" style="cursor:default;opacity:0.55"><i class="fas fa-clock"></i> <?= htmlspecialchars($a['status']) ?></div>
          <?php endif; ?>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<!-- ADOPT MODAL -->
<div class="modal-overlay" id="adopt-modal" style="display:none" onclick="if(event.target===this)closeModal('adopt-modal')">
  <div class="modal-box">
    <div class="modal-head">
      <div class="modal-head-icon"><i class="fas fa-heart"></i></div>
      <span class="modal-title" id="adopt-title">Adoption Request</span>
      <button class="modal-close" onclick="closeModal('adopt-modal')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <form id="adopt-form" onsubmit="submitAdopt(event)">
        <input type="hidden" id="adopt-animal-id"/>
        <div class="form-grid">
          <div class="form-field full"><label>Full Name *</label><input type="text" id="af-name" required placeholder="Your full name"/></div>
          <div class="form-field"><label>Phone *</label><input type="tel" id="af-phone" required placeholder="+63 9XX XXX XXXX"/></div>
          <div class="form-field"><label>Email *</label><input type="email" id="af-email" required placeholder="you@email.com"/></div>
          <div class="form-field full"><label>Address *</label><input type="text" id="af-address" required placeholder="Your home address"/></div>
          <div class="form-field"><label>Housing Type *</label>
            <select id="af-housing" required>
              <option value="">Select…</option>
              <option>House with yard</option><option>Apartment</option><option>Condo</option><option>Other</option>
            </select>
          </div>
          <div class="form-field"><label>Pet Experience *</label>
            <select id="af-exp" required>
              <option value="">Select…</option>
              <option>First time</option><option>Some experience</option><option>Very experienced</option>
            </select>
          </div>
          <div class="form-field full"><label>Why do you want to adopt? *</label>
            <textarea id="af-reason" required placeholder="Tell us about yourself…"></textarea>
          </div>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem">
          <i class="fas fa-paper-plane"></i> Submit Request
        </button>
      </form>
    </div>
  </div>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div><div class="footer-logo"><i class="fas fa-paw"></i> Pawster</div><p class="footer-desc">Connecting loving homes with animals in need across the Ilocos Region.</p></div>
    <div class="footer-col"><h4>Navigate</h4><a href="index.php">Home</a><a href="find_a_pet.php">Find a Pet</a><a href="how_it_works.php">How It Works</a><a href="missing.php">Missing Pets</a></div>
    <div class="footer-col"><h4>Actions</h4><a href="rehome.php">Rehome a Pet</a><a href="about.php">About Us</a><?php if($loggedInNav):?><a href="<?=$navDash?>">My Dashboard</a><?php endif;?></div>
  </div>
  <div class="footer-bottom">&copy; 2025 Pawster. All rights reserved.</div>
</footer>

<script src="../js/find_a_pet.js"></script>
</body>
</html>