<?php
/* =============================================
   PAWSTER — USER DASHBOARD POPUP
   php/user_dashboard.php
   ============================================= */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Block direct access — this file must be included, not accessed directly
if (basename($_SERVER['PHP_SELF']) === 'user_dashboard.php') {
    header('Location: index.php');
    exit;
}

if (empty($_SESSION['user_id'])) {
    return;
}

$_dc = @pg_connect("host=localhost port=5432 dbname=pawster_db user=postgres password=1234");

if ($_dc) {
    pg_query($_dc, "ALTER TABLE users ADD COLUMN IF NOT EXISTS status     VARCHAR(20)  NOT NULL DEFAULT 'pending'");
    pg_query($_dc, "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
    pg_query($_dc, "ALTER TABLE users ADD COLUMN IF NOT EXISTS city       VARCHAR(100)");
    pg_query($_dc, "ALTER TABLE users ADD COLUMN IF NOT EXISTS province   VARCHAR(100)");
    pg_query($_dc, "ALTER TABLE users ADD COLUMN IF NOT EXISTS address    TEXT");
    pg_query($_dc, "ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code   VARCHAR(20)");
}

$_duid = (int)$_SESSION['user_id'];
$_dres = $_dc ? pg_query_params($_dc,
    "SELECT first_name, last_name, email, phone, address, city, province, zip_code, status, created_at
     FROM users WHERE id = \$1",
    [$_duid]) : false;

$_du = ($_dres && pg_num_rows($_dres) > 0) ? pg_fetch_assoc($_dres) : [];

$_dFN   = htmlspecialchars($_du['first_name'] ?? ($_SESSION['first_name'] ?? 'User'));
$_dLN   = htmlspecialchars($_du['last_name']  ?? ($_SESSION['last_name']  ?? ''));
$_dFull = trim("$_dFN $_dLN");
$_dEM   = htmlspecialchars($_du['email']    ?? ($_SESSION['email'] ?? ''));
$_dPH   = htmlspecialchars($_du['phone']    ?? '');
$_dCI   = htmlspecialchars($_du['city']     ?? '');
$_dPR   = htmlspecialchars($_du['province'] ?? '');
$_dZP   = htmlspecialchars($_du['zip_code'] ?? '');
$_dST   = $_du['status'] ?? 'pending';
$_dJN   = !empty($_du['created_at']) ? date('F j, Y', strtotime($_du['created_at'])) : '—';
$_dIN   = strtoupper(
    substr($_du['first_name'] ?? ($_SESSION['first_name'] ?? 'U'), 0, 1) .
    substr($_du['last_name']  ?? ($_SESSION['last_name']  ?? ''),  0, 1)
);

$_dFilled = 0;
foreach (['first_name','last_name','email','phone','address','city','province'] as $_f) {
    if (!empty($_du[$_f])) $_dFilled++;
}
$_dPCT  = (int)round(($_dFilled / 7) * 100);
$_dDays = 0;
if (!empty($_du['created_at'])) {
    try { $_dDays = (int)(new DateTime())->diff(new DateTime($_du['created_at']))->days; } catch(Exception $e) {}
}
$_dSLB = ['pending' => 'Under Review', 'approved' => 'Approved', 'rejected' => 'Rejected'][$_dST] ?? ucfirst($_dST);
?>

<!-- DASHBOARD OVERLAY -->
<div id="dash-overlay">
<div id="dash-modal">

  <!-- HEADER -->
  <div class="dm-header">
    <a class="dm-brand" href="index.php">
      <img src="../images/logo.png" alt="Pawster"/>
      <span class="dm-brand-text">Paw<em>ster</em></span>
    </a>
    <div class="dm-vdiv"></div>
    <span class="dm-header-lbl">
      <i class="fas fa-th-large"></i> My Dashboard
    </span>
    <div class="dm-tabs">
      <button class="dm-tab active" data-tab="overview" onclick="dmTab('overview')">Overview</button>
      <button class="dm-tab" data-tab="favs"     onclick="dmTab('favs')">Favourites</button>
      <button class="dm-tab" data-tab="apps"     onclick="dmTab('apps')">Applications</button>
      <button class="dm-tab" data-tab="settings" onclick="dmTab('settings')">Settings</button>
    </div>
    <button class="dm-close" onclick="closeDashboard()">
      <i class="fas fa-times"></i>
    </button>
  </div>

  <!-- BODY -->
  <div class="dm-body">

    <!-- OVERVIEW TAB -->
    <div class="dm-panel active" id="dmp-overview">

      <div class="dm-welcome">
        <div class="dm-welcome-av">
          <?= $_dIN ?>
          <div class="dm-status-dot <?= htmlspecialchars($_dST) ?>"></div>
        </div>
        <div class="dm-welcome-text">
          <h2>Good day, <em><?= $_dFN ?></em>!</h2>
          <p>Here's your Pawster account overview.</p>
        </div>
        <div class="dm-sbadge <?= htmlspecialchars($_dST) ?>">
          <span class="dm-bdot"></span><?= $_dSLB ?>
        </div>
      </div>

      <div class="dm-stats">
        <div class="dm-stat">
          <div class="dm-stat-icon g"><i class="fas fa-user"></i></div>
          <div style="flex:1">
            <div class="dm-stat-val"><?= $_dPCT ?>%</div>
            <div class="dm-stat-lbl">Profile Complete</div>
            <div class="dm-bar-wrap"><div class="dm-bar" style="width:<?= $_dPCT ?>%"></div></div>
          </div>
        </div>
        <div class="dm-stat">
          <div class="dm-stat-icon o"><i class="fas fa-calendar-alt"></i></div>
          <div>
            <div class="dm-stat-val"><?= $_dDays ?></div>
            <div class="dm-stat-lbl">Days as Member</div>
          </div>
        </div>
        <div class="dm-stat">
          <div class="dm-stat-icon b"><i class="fas fa-shield-alt"></i></div>
          <div>
            <div class="dm-stat-val" style="font-size:1rem;font-family:'Nunito',sans-serif;margin-top:3px"><?= $_dSLB ?></div>
            <div class="dm-stat-lbl">Account Status</div>
          </div>
        </div>
      </div>

      <div class="dm-sec-lbl" style="margin-top:0">Quick Links</div>
      <div class="dm-quick">
        <a class="dm-qcard g" href="find_a_pet.php"><i class="fas fa-search"></i><span>Find a Pet</span></a>
        <a class="dm-qcard o" href="missing.php"><i class="fas fa-search-location"></i><span>Missing Pets</span></a>
        <a class="dm-qcard b" href="rehome.php"><i class="fas fa-home"></i><span>Rehome</span></a>
        <a class="dm-qcard a" href="how_it_works.php"><i class="fas fa-info-circle"></i><span>How It Works</span></a>
      </div>

      <div class="dm-sec-lbl">Profile Summary</div>
      <div class="dm-profile-grid">

        <div class="dm-box dm-identity">
          <div class="dm-id-av">
            <?= $_dIN ?>
            <div class="dm-id-ring <?= htmlspecialchars($_dST) ?>"></div>
          </div>
          <div class="dm-id-name"><?= $_dFull ?: $_dFN ?></div>
          <div class="dm-id-email"><?= $_dEM ?></div>
          <div class="dm-id-badge <?= htmlspecialchars($_dST) ?>">
            <span class="dm-bdot"></span><?= $_dSLB ?>
          </div>
          <div class="dm-id-sep"></div>
          <div class="dm-id-row"><i class="fas fa-calendar-alt"></i>&nbsp;Joined <?= $_dJN ?></div>
          <?php if ($_dCI): ?>
          <div class="dm-id-row"><i class="fas fa-map-marker-alt"></i>&nbsp;<?= $_dCI . ($_dPR ? ", $_dPR" : '') ?></div>
          <?php endif; ?>
          <?php if ($_dPH): ?>
          <div class="dm-id-row"><i class="fas fa-phone"></i>&nbsp;<?= $_dPH ?></div>
          <?php endif; ?>
        </div>

        <div class="dm-box dm-details-box">
          <div class="dm-details-title">Account Information</div>
          <div class="dm-detail-grid">
            <div>
              <div class="dm-dlbl">First Name</div>
              <div class="dm-dval"><?= htmlspecialchars($_du['first_name'] ?? '—') ?></div>
            </div>
            <div>
              <div class="dm-dlbl">Last Name</div>
              <div class="dm-dval"><?= htmlspecialchars($_du['last_name'] ?? '—') ?></div>
            </div>
            <div style="grid-column:span 2">
              <div class="dm-dlbl">Email Address</div>
              <div class="dm-dval"><?= $_dEM ?: '—' ?></div>
            </div>
            <div>
              <div class="dm-dlbl">Phone</div>
              <div class="dm-dval"><?= $_dPH ?: '—' ?></div>
            </div>
            <div>
              <div class="dm-dlbl">City</div>
              <div class="dm-dval"><?= $_dCI ?: '—' ?></div>
            </div>
            <div>
              <div class="dm-dlbl">Province</div>
              <div class="dm-dval"><?= $_dPR ?: '—' ?></div>
            </div>
            <div>
              <div class="dm-dlbl">Zip Code</div>
              <div class="dm-dval"><?= $_dZP ?: '—' ?></div>
            </div>
          </div>
        </div>

      </div>
    </div><!-- end overview -->

    <!-- FAVOURITES TAB -->
    <div class="dm-panel" id="dmp-favs">
      <div class="dm-sec-lbl" style="margin-top:0">My Favourites</div>
      <div class="dm-box">
        <div class="dm-empty">
          <div class="dm-empty-icon g"><i class="fas fa-heart"></i></div>
          <div class="dm-empty-title">No favourites yet</div>
          <div class="dm-empty-sub">Heart a pet on the Explore page and they'll show up here for quick access.</div>
          <a class="dm-empty-btn g" href="find_a_pet.php"><i class="fas fa-search"></i> Browse Animals</a>
        </div>
      </div>
    </div>

    <!-- APPLICATIONS TAB -->
    <div class="dm-panel" id="dmp-apps">
      <div class="dm-sec-lbl" style="margin-top:0">Adoption Applications</div>
      <div class="dm-box" style="margin-bottom:14px">
        <div class="dm-empty">
          <div class="dm-empty-icon b"><i class="fas fa-paw"></i></div>
          <div class="dm-empty-title">No adoption applications yet</div>
          <div class="dm-empty-sub">Browse pets and submit an application — status tracked here.</div>
          <a class="dm-empty-btn b" href="find_a_pet.php"><i class="fas fa-search"></i> Explore Pets</a>
        </div>
      </div>
      <div class="dm-sec-lbl">Rehome Listings</div>
      <div class="dm-box">
        <div class="dm-empty">
          <div class="dm-empty-icon o"><i class="fas fa-home"></i></div>
          <div class="dm-empty-title">No rehome listings yet</div>
          <div class="dm-empty-sub">Need to find a new home for your pet? We'll help connect you.</div>
          <a class="dm-empty-btn o" href="rehome.php"><i class="fas fa-home"></i> Rehome a Pet</a>
        </div>
      </div>
    </div>

    <!-- SETTINGS TAB -->
    <div class="dm-panel" id="dmp-settings">

      <div class="dm-sec-lbl" style="margin-top:0">Edit Profile</div>
      <div class="dm-box">
        <div class="dm-form">
          <div class="dm-form-row2">
            <div class="dm-field">
              <label>First Name *</label>
              <input type="text" id="sFirst" value="<?= htmlspecialchars($_du['first_name'] ?? '') ?>" placeholder="First name"/>
              <span class="dm-ferr" id="sFirstErr"></span>
            </div>
            <div class="dm-field">
              <label>Last Name *</label>
              <input type="text" id="sLast" value="<?= htmlspecialchars($_du['last_name'] ?? '') ?>" placeholder="Last name"/>
              <span class="dm-ferr" id="sLastErr"></span>
            </div>
          </div>
          <div class="dm-field">
            <label>Email Address *</label>
            <input type="email" id="sEmail" value="<?= $_dEM ?>" placeholder="your@email.com"/>
            <span class="dm-ferr" id="sEmailErr"></span>
          </div>
          <div class="dm-field">
            <label>Phone Number</label>
            <input type="tel" id="sPhone" value="<?= $_dPH ?>" placeholder="+63 900 000 0000"/>
          </div>
          <div class="dm-form-row2">
            <div class="dm-field">
              <label>City</label>
              <input type="text" id="sCity" value="<?= $_dCI ?>" placeholder="Your city"/>
            </div>
            <div class="dm-field">
              <label>Province</label>
              <input type="text" id="sProvince" value="<?= $_dPR ?>" placeholder="Province"/>
            </div>
          </div>
          <div class="dm-form-btns">
            <button class="dm-btn dm-btn-green" onclick="dmSaveEdit()">
              <i class="fas fa-save"></i> Save Changes
            </button>
          </div>
        </div>
      </div>

      <div class="dm-sec-lbl">Change Password</div>
      <div class="dm-box">
        <div class="dm-form">
          <div class="dm-field">
            <label>Current Password *</label>
            <div class="dm-pw-wrap">
              <input type="password" id="sCur" placeholder="Current password"/>
              <button class="dm-pw-eye" onclick="dmTogglePw('sCur',this)"><i class="fas fa-eye"></i></button>
            </div>
            <span class="dm-ferr" id="sCurErr"></span>
          </div>
          <div class="dm-field">
            <label>New Password *</label>
            <div class="dm-pw-wrap">
              <input type="password" id="sNew" placeholder="Min. 8 characters"/>
              <button class="dm-pw-eye" onclick="dmTogglePw('sNew',this)"><i class="fas fa-eye"></i></button>
            </div>
            <span class="dm-ferr" id="sNewErr"></span>
          </div>
          <div class="dm-field">
            <label>Confirm New Password *</label>
            <div class="dm-pw-wrap">
              <input type="password" id="sConf" placeholder="Repeat new password"/>
              <button class="dm-pw-eye" onclick="dmTogglePw('sConf',this)"><i class="fas fa-eye"></i></button>
            </div>
            <span class="dm-ferr" id="sConfErr"></span>
          </div>
          <div class="dm-form-btns">
            <button class="dm-btn dm-btn-orange" onclick="dmSavePwd()">
              <i class="fas fa-key"></i> Update Password
            </button>
          </div>
        </div>
      </div>

      <div class="dm-sec-lbl">Account</div>
      <a class="dm-logout-btn" href="logout.php">
        <i class="fas fa-sign-out-alt"></i> Log Out of Pawster
      </a>

    </div><!-- end settings -->

  </div><!-- end dm-body -->
</div><!-- end dash-modal -->
</div><!-- end dash-overlay -->

<div id="dm-toasts"></div>

<script>
/* ── DASHBOARD POPUP JS — globally available ── */

function openDashboard() {
  var overlay = document.getElementById('dash-overlay');
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeDashboard() {
  var overlay = document.getElementById('dash-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* Backdrop click closes */
(function() {
  var overlay = document.getElementById('dash-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeDashboard();
  });
})();

/* Escape key closes */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeDashboard();
});

/* Tab switcher */
function dmTab(name) {
  document.querySelectorAll('#dash-modal .dm-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('#dash-modal .dm-panel').forEach(function(p) {
    p.classList.toggle('active', p.id === 'dmp-' + name);
  });
}

/* Password eye toggle */
function dmTogglePw(id, btn) {
  var inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'text' ? 'password' : 'text';
  btn.innerHTML = inp.type === 'text'
    ? '<i class="fas fa-eye-slash"></i>'
    : '<i class="fas fa-eye"></i>';
}

/* Save profile */
function dmSaveEdit() {
  var fn = document.getElementById('sFirst').value.trim();
  var ln = document.getElementById('sLast').value.trim();
  var em = document.getElementById('sEmail').value.trim();

  ['sFirstErr','sLastErr','sEmailErr'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.textContent = '';
  });

  var ok = true;
  if (!fn) { document.getElementById('sFirstErr').textContent = 'Required.'; ok = false; }
  if (!ln) { document.getElementById('sLastErr').textContent  = 'Required.'; ok = false; }
  if (!em) { document.getElementById('sEmailErr').textContent = 'Required.'; ok = false; }
  else if (!/\S+@\S+\.\S+/.test(em)) {
    document.getElementById('sEmailErr').textContent = 'Invalid email.'; ok = false;
  }
  if (!ok) return;

  var fd = new FormData();
  fd.append('action',    'update_profile');
  fd.append('firstName', fn);
  fd.append('lastName',  ln);
  fd.append('email',     em);
  fd.append('phone',     document.getElementById('sPhone').value.trim());
  fd.append('city',      document.getElementById('sCity').value.trim());
  fd.append('province',  document.getElementById('sProvince').value.trim());

  fetch('update_profile.php', { method: 'POST', body: fd })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success) {
        dmToast('Profile updated!', 'ok');
        setTimeout(function() { location.reload(); }, 900);
      } else {
        dmToast(d.message || 'Update failed.', 'err');
      }
    })
    .catch(function() { dmToast('Server error.', 'err'); });
}

/* Change password */
function dmSavePwd() {
  var cur  = document.getElementById('sCur').value;
  var nw   = document.getElementById('sNew').value;
  var conf = document.getElementById('sConf').value;

  ['sCurErr','sNewErr','sConfErr'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.textContent = '';
  });

  var ok = true;
  if (!cur)          { document.getElementById('sCurErr').textContent  = 'Required.';               ok = false; }
  if (nw.length < 8) { document.getElementById('sNewErr').textContent  = 'Min 8 characters.';       ok = false; }
  if (nw !== conf)   { document.getElementById('sConfErr').textContent = 'Passwords do not match.'; ok = false; }
  if (!ok) return;

  var fd = new FormData();
  fd.append('action',  'change_password');
  fd.append('current', cur);
  fd.append('new',     nw);

  fetch('update_profile.php', { method: 'POST', body: fd })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success) {
        dmToast('Password changed!', 'ok');
        ['sCur','sNew','sConf'].forEach(function(id) {
          var el = document.getElementById(id); if (el) el.value = '';
        });
      } else {
        dmToast(d.message || 'Failed.', 'err');
      }
    })
    .catch(function() { dmToast('Server error.', 'err'); });
}

/* Toast */
function dmToast(msg, type) {
  var icons = {
    ok:  '<i class="fas fa-circle-check"></i>',
    err: '<i class="fas fa-circle-xmark"></i>'
  };
  var el = document.createElement('div');
  el.className = 'dm-toast ' + (type || 'ok');
  el.innerHTML = (icons[type] || icons.ok) + '<span>' + msg + '</span>';
  var wrap = document.getElementById('dm-toasts');
  if (wrap) wrap.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, 3500);
}
</script>