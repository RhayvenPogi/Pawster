<?php
session_start();
$activePage = 'pets';
require_once 'nav.php';

$conn   = pg_connect("host=localhost port=5432 dbname=pawster_db user=postgres password=1234");
$type   = $_GET['type']   ?? 'all';
$status = $_GET['status'] ?? 'all';
$search = trim($_GET['search'] ?? '');
$where  = []; $params = []; $pi = 1;
if ($type   !== 'all') { $where[] = "type=\$$pi";   $params[] = $type;   $pi++; }
if ($status !== 'all') { $where[] = "status=\$$pi"; $params[] = $status; $pi++; }
if ($search !== '')    { $where[] = "(name ILIKE \$$pi OR breed ILIKE \$$pi)"; $params[] = '%'.$search.'%'; $pi++; }
$whereSQL = $where ? 'WHERE '.implode(' AND ', $where) : '';
$q        = $conn ? pg_query_params($conn, "SELECT * FROM animals $whereSQL ORDER BY created_at DESC LIMIT 50", $params) : false;
$animals  = ($q ? pg_fetch_all($q) : false) ?: [];
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
  <?php if ($loggedIn && !$isAdmin): ?>
  <link rel="stylesheet" href="../css/user_dashboard.css"/>
  <?php endif; ?>
  <style>
    .animals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.2rem;margin-top:1.5rem;}
    .animal-card{background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);transition:transform .22s,box-shadow .22s,border-color .22s;}
    .animal-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg);border-color:rgba(90,170,48,0.42);}
    .ac-img{height:190px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:linear-gradient(135deg,rgba(255,248,220,.6),rgba(255,240,200,.4));border-bottom:1.5px solid var(--border);position:relative;overflow:hidden;}
    .ac-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
    .ac-status{position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:50px;font-size:10px;font-weight:800;text-transform:uppercase;z-index:1;}
    .s-available{background:rgba(88,139,65,.88);color:#fff;}
    .s-pending{background:rgba(180,90,34,.88);color:#fff;}
    .s-adopted{background:rgba(100,100,100,.8);color:#fff;}
    .ac-body{padding:1rem 1.1rem 1.2rem;}
    .ac-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:800;color:var(--green-dark);}
    .ac-meta{font-size:.72rem;font-weight:700;color:var(--text-muted);margin-top:.2rem;font-family:'DM Mono',monospace;}
    .ac-desc{font-size:.82rem;font-weight:700;color:var(--text-mid);margin-top:.5rem;line-height:1.6;}
    .ac-btn{display:flex;align-items:center;justify-content:center;gap:.4rem;margin-top:.85rem;padding:.55rem;background:rgba(28,79,9,.08);border:1.5px solid rgba(90,170,48,.3);border-radius:9px;font-size:.78rem;font-weight:800;color:var(--green-mid);transition:all .18s;cursor:pointer;width:100%;font-family:'Nunito',sans-serif;}
    .animal-card:hover .ac-btn{background:var(--green-mid);color:#fff;border-color:var(--green-mid);}
    .ac-btn.disabled{opacity:.55;pointer-events:none;cursor:default;}
    .filter-bar{background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);padding:1.2rem 1.4rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;margin-bottom:.5rem;}
    .filter-bar input,.filter-bar select{background:rgba(255,250,232,.7);border:1.5px solid var(--border);border-radius:10px;padding:.6rem .9rem;font-family:'Nunito',sans-serif;font-size:.86rem;font-weight:600;color:var(--text);outline:none;transition:all .18s;}
    .filter-bar input{flex:1;min-width:180px;}
    .filter-bar input:focus,.filter-bar select:focus{border-color:var(--green-border);box-shadow:0 0 0 3px rgba(90,170,48,.12);}
    .empty-state{text-align:center;padding:4rem 2rem;background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);}
    .empty-state i{font-size:3rem;opacity:.3;display:block;margin-bottom:1rem;color:var(--green-mid);}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
    .form-grid .full{grid-column:1/-1;}
    .form-field{display:flex;flex-direction:column;gap:5px;}
    .form-field label{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);}
    .form-field input,.form-field select,.form-field textarea{background:rgba(255,250,232,.7);border:1.5px solid var(--border);border-radius:10px;padding:.65rem .9rem;font-family:'Nunito',sans-serif;font-size:.88rem;font-weight:600;color:var(--text);outline:none;transition:all .18s;}
    .form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:var(--green-border);box-shadow:0 0 0 3px rgba(90,170,48,.12);}
    .form-field textarea{resize:vertical;min-height:100px;}
    @media(max-width:600px){.form-grid{grid-template-columns:1fr;}.filter-bar{flex-direction:column;}}
  </style>
</head>
<body>
<div class="mesh-bg">
  <div class="mesh-base"></div>
  <div class="orb orb-1"></div><div class="orb orb-2"></div>
  <div class="orb orb-3"></div><div class="orb orb-4"></div>
  <div class="mesh-grid"></div><div class="grain"></div><div class="vignette"></div>
</div>
<div id="toast-wrap"></div>

<div class="page-hero">
  <div class="hero-tag"><i class="fas fa-search"></i> Browse Animals</div>
  <h1>Find Your <em>Forever</em> Friend</h1>
  <p>All animals are health-checked, vaccinated, and ready for a loving home across the Ilocos Region.</p>
</div>

<div class="page-wrap">

  <form method="GET" class="filter-bar reveal">
    <i class="fas fa-search" style="color:var(--text-muted);font-size:.85rem;flex-shrink:0"></i>
    <input type="text" name="search" placeholder="Search by name or breed…" value="<?= htmlspecialchars($search) ?>"/>
    <select name="type">
      <option value="all"    <?= $type==='all'   ?'selected':'' ?>>All Types</option>
      <option value="Dog"    <?= $type==='Dog'   ?'selected':'' ?>>Dogs</option>
      <option value="Cat"    <?= $type==='Cat'   ?'selected':'' ?>>Cats</option>
      <option value="Bird"   <?= $type==='Bird'  ?'selected':'' ?>>Birds</option>
      <option value="Rabbit" <?= $type==='Rabbit'?'selected':'' ?>>Rabbits</option>
      <option value="Other"  <?= $type==='Other' ?'selected':'' ?>>Others</option>
    </select>
    <select name="status">
      <option value="all"       <?= $status==='all'      ?'selected':'' ?>>All Status</option>
      <option value="Available" <?= $status==='Available'?'selected':'' ?>>Available</option>
      <option value="Pending"   <?= $status==='Pending'  ?'selected':'' ?>>Pending</option>
      <option value="Adopted"   <?= $status==='Adopted'  ?'selected':'' ?>>Adopted</option>
    </select>
    <button type="submit" class="btn-primary" style="padding:.6rem 1.4rem;white-space:nowrap">
      <i class="fas fa-search"></i> Search
    </button>
    <?php if ($search || $type !== 'all' || $status !== 'all'): ?>
    <a href="find_a_pet.php" class="btn-secondary" style="padding:.6rem 1rem;white-space:nowrap">
      <i class="fas fa-times"></i> Clear
    </a>
    <?php endif; ?>
  </form>

  <?php if (empty($animals)): ?>
    <div class="empty-state reveal">
      <i class="fas fa-paw"></i>
      <p style="font-size:1rem;font-weight:700;color:var(--text-mid)">No animals found matching your search.</p>
      <a href="find_a_pet.php" class="btn-secondary" style="margin-top:1rem;display:inline-flex">
        <i class="fas fa-times"></i> Clear filters
      </a>
    </div>
  <?php else: ?>
    <p class="reveal" style="font-size:.82rem;color:var(--text-muted);font-weight:700;margin-bottom:.2rem">
      Showing <?= count($animals) ?> animal<?= count($animals) !== 1 ? 's' : '' ?>
      <?= $search ? ' for "'.htmlspecialchars($search).'"' : '' ?>
    </p>
    <div class="animals-grid">
      <?php foreach ($animals as $i => $a):
        $emoji   = ['Dog'=>'🐕','Cat'=>'🐈','Bird'=>'🐦','Rabbit'=>'🐇'][$a['type']] ?? '🐾';
        $sCls    = ['Available'=>'s-available','Pending'=>'s-pending','Adopted'=>'s-adopted'][$a['status']] ?? 's-adopted';
        $isAvail = $a['status'] === 'Available';
      ?>
      <div class="animal-card reveal" style="transition-delay:<?= ($i % 4) * 0.07 ?>s">
        <div class="ac-img">
          <?php if (!empty($a['image_path'])): ?>
            <img src="<?= htmlspecialchars($a['image_path']) ?>" alt="<?= htmlspecialchars($a['name']) ?>"/>
          <?php else: ?>
            <?= $emoji ?>
          <?php endif; ?>
          <span class="ac-status <?= $sCls ?>"><?= htmlspecialchars($a['status']) ?></span>
        </div>
        <div class="ac-body">
          <div class="ac-name"><?= htmlspecialchars($a['name']) ?></div>
          <div class="ac-meta">
            <?= htmlspecialchars($a['type']) ?>
            <?= !empty($a['breed'])  ? ' · ' . htmlspecialchars($a['breed'])  : '' ?>
            <?= !empty($a['age'])    ? ' · ' . htmlspecialchars($a['age'])    : '' ?>
            <?= !empty($a['gender']) ? ' · ' . htmlspecialchars($a['gender']) : '' ?>
          </div>
          <?php if (!empty($a['description'])): ?>
          <div class="ac-desc">
            <?= htmlspecialchars(mb_substr($a['description'], 0, 90)) . (mb_strlen($a['description']) > 90 ? '…' : '') ?>
          </div>
          <?php endif; ?>
          <?php if ($isAvail): ?>
            <button class="ac-btn" onclick="openAdopt(<?= (int)$a['id'] ?>, '<?= htmlspecialchars(addslashes($a['name'])) ?>')">
              <i class="fas fa-heart"></i> Adopt <?= htmlspecialchars($a['name']) ?>
            </button>
          <?php else: ?>
            <div class="ac-btn disabled">
              <i class="fas fa-clock"></i> <?= htmlspecialchars($a['status']) ?>
            </div>
          <?php endif; ?>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

</div><!-- /page-wrap -->

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
          <div class="form-field full"><label>Address *</label><input type="text" id="af-address" required placeholder="Your complete home address"/></div>
          <div class="form-field"><label>Housing Type *</label>
            <select id="af-housing" required>
              <option value="">Select…</option>
              <option>House with yard</option><option>Apartment</option><option>Condo</option><option>Other</option>
            </select>
          </div>
          <div class="form-field"><label>Pet Experience *</label>
            <select id="af-exp" required>
              <option value="">Select…</option>
              <option>First time owner</option><option>Some experience</option><option>Very experienced</option>
            </select>
          </div>
          <div class="form-field full"><label>Why do you want to adopt? *</label>
            <textarea id="af-reason" required placeholder="Tell us about yourself and your home environment…"></textarea>
          </div>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;justify-content:center;margin-top:.5rem">
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
    <div class="footer-col"><h4>Actions</h4><a href="rehome.php">Rehome a Pet</a><a href="about.php">About Us</a>
      <?php if ($loggedInNav): ?>
        <?php if ($isAdmin): ?>
          <a href="admin_dashboard.php">My Dashboard</a>
        <?php else: ?>
          <a href="#" onclick="openDashboard();return false;">My Dashboard</a>
        <?php endif; ?>
      <?php else: ?>
        <a href="login.php">Log In</a>
      <?php endif; ?>
    </div>
  </div>
  <div class="footer-bottom">&copy; 2025 Pawster. All rights reserved.</div>
</footer>

<script src="../js/find_a_pet.js"></script>
<script src="../js/pawster_pages.js"></script>

<?php
/* ── Dashboard popup — non-admin users only ── */
if ($loggedIn && !$isAdmin) {
    include 'user_dashboard.php';
}
?>
</body>
</html>