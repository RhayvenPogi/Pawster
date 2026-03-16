<?php
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'user') {
    header("Location: ../login.html");
    exit;
}

/* ── Database connection ──────────────────────────────── */
$host    = "localhost"; $port = "5432"; $dbname = "pawster_db";
$db_user = "postgres";  $db_pass = "1234";
$dbconn  = pg_connect("host=$host port=$port dbname=$dbname user=$db_user password=$db_pass");

// Auto-add missing columns
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS status     VARCHAR(20)  NOT NULL DEFAULT 'pending'");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS city       VARCHAR(100)");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS province   VARCHAR(100)");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS address    TEXT");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code   VARCHAR(20)");

/* ── Fetch user row ───────────────────────────────────── */
$uid    = (int) $_SESSION['user_id'];
$result = pg_query_params($dbconn,
    "SELECT first_name, last_name, email, phone, address, city, province, zip_code, status, created_at
     FROM users WHERE id = $1", [$uid]);

$me       = ($result ? pg_fetch_assoc($result) : false) ?: [];
$status   = $me['status'] ?? 'pending';
$joinDate = !empty($me['created_at']) ? date('F j, Y', strtotime($me['created_at'])) : '';
$initials = strtoupper(
    substr($me['first_name'] ?? 'U', 0, 1) .
    substr($me['last_name']  ?? '',  0, 1)
);

// Profile completion %
$filledFields = 0;
foreach (['first_name','last_name','email','phone','address','city','province'] as $f) {
    if (!empty($me[$f])) $filledFields++;
}
$profilePct = (int) round(($filledFields / 7) * 100);

// Days as member
$daysSince = 0;
if (!empty($me['created_at'])) {
    $daysSince = (int) (new DateTime())->diff(new DateTime($me['created_at']))->days;
}

/* ── Serialise to JSON for JavaScript ────────────────── */
$jsData = json_encode([
    'firstName'  => $me['first_name'] ?? $_SESSION['first_name'] ?? 'User',
    'lastName'   => $me['last_name']  ?? '',
    'fullName'   => trim(($me['first_name'] ?? '') . ' ' . ($me['last_name'] ?? '')),
    'email'      => $me['email']    ?? '',
    'phone'      => $me['phone']    ?? '',
    'address'    => $me['address']  ?? '',
    'city'       => $me['city']     ?? '',
    'province'   => $me['province'] ?? '',
    'zipCode'    => $me['zip_code'] ?? '',
    'status'     => $status,
    'statusLabel'=> ['pending'=>'Under Review','approved'=>'Approved','rejected'=>'Rejected'][$status] ?? ucfirst($status),
    'joinDate'   => $joinDate,
    'initials'   => $initials,
    'profilePct' => $profilePct,
    'daysSince'  => $daysSince,
], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);

// Store in session so the HTML file can access it via this PHP file
$_SESSION['dashboard_data'] = $jsData;

// Inject USER constant then serve the real HTML page
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pawster — Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="user_dashboard.css"/>
</head>
<body>
  <!-- PHP injects server-side user data as a JS constant -->
  <script>const USER = <?= $jsData ?>;</script>

  <!-- ════════ MESH BACKGROUND ════════ -->
  <div class="mesh-container">
    <div class="mesh-base"></div>
    <div class="orb-wrap orb-wrap-1"><div class="orb" id="o1"></div></div>
    <div class="orb-wrap orb-wrap-2"><div class="orb" id="o2"></div></div>
    <div class="orb-wrap orb-wrap-3"><div class="orb" id="o3"></div></div>
    <div class="orb-wrap orb-wrap-4"><div class="orb" id="o4"></div></div>
    <div class="orb-wrap orb-wrap-5"><div class="orb" id="o5"></div></div>
    <div class="orb-wrap orb-wrap-6"><div class="orb" id="o6"></div></div>
    <div class="mesh-grid"></div>
    <div class="grain"></div>
    <div class="vignette"></div>
  </div>

  <!-- ════════ SIDEBAR OVERLAY (mobile) ════════ -->
  <div class="sb-overlay" id="sbOverlay"></div>

  <!-- ════════ SIDEBAR ════════ -->
  <aside class="sidebar" id="sidebar">
    <div class="sb-top">
      <a class="sb-logo" href="../index.html">
        <img src="../images/logo.png" alt="Pawster" />
        <span class="sb-logo-text">Paw<em>ster</em></span>
      </a>
      <div class="sb-user">
        <div class="sb-avatar" id="sbInitials"></div>
        <div>
          <div class="sb-user-name" id="sbFullName"></div>
          <div class="sb-user-email" id="sbEmail"></div>
        </div>
      </div>
    </div>

    <nav class="sb-nav">
      <div class="sb-section-lbl">Menu</div>
      <a class="sb-link active" href="user_dashboard.php">
        <svg width="16" height="16" fill="none" stroke="var(--green-mid)" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        Dashboard
      </a>
      <a class="sb-link" href="#">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        Explore Pets
      </a>
      <a class="sb-link" href="#">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Favourites
        <span class="sb-badge green">4</span>
      </a>
      <a class="sb-link" href="#">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Applications
        <span class="sb-badge orange">1</span>
      </a>

      <div class="sb-section-lbl">Account</div>
      <a class="sb-link" href="#" id="sbEditLink">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Edit Profile
      </a>
      <a class="sb-link" href="#" id="sbPwdLink">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Change Password
      </a>
    </nav>

    <div class="sb-bottom">
      <a class="sb-link danger" href="logout.php">
        <svg width="16" height="16" fill="none" stroke="#c03030" stroke-width="2.2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Log Out
      </a>
    </div>
  </aside>

  <!-- ════════ MAIN ════════ -->
  <div class="layout">
    <div class="main">

      <div class="topbar">
        <div class="topbar-title">Welcome back, <em id="topFirstName"></em>!</div>
        <div class="topbar-sub">Here's your account overview and profile information.</div>
      </div>

      <div class="page">

        <!-- STAT CARDS -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon green">
              <svg width="22" height="22" fill="none" stroke="var(--green-mid)" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <div class="stat-val" id="statPct"></div>
              <div class="stat-lbl">Profile Complete</div>
              <div class="stat-bar-wrap"><div class="stat-bar" id="statBar"></div></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="22" height="22" fill="none" stroke="var(--orange)" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div class="stat-val" id="statDays"></div>
              <div class="stat-lbl">Days as Member</div>
            </div>
          </div>
        </div>

        <!-- PROFILE SECTION -->
        <div class="section-lbl">Your Profile</div>

        <div class="profile-grid">
          <!-- Identity Panel -->
          <div class="panel identity">
            <div class="id-avatar">
              <span id="idInitials"></span>
              <div class="id-status-ring" id="idStatusRing"></div>
            </div>
            <div class="id-name" id="idFullName"></div>
            <div class="id-email" id="idEmail"></div>
            <div class="id-divider"></div>
            <div class="id-meta">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Joined <span id="idJoinDate"></span>
            </div>
            <div class="id-meta" id="idLocationRow" style="display:none;">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span id="idLocation"></span>
            </div>
          </div>

          <!-- Details Panel -->
          <div class="panel details">
            <div class="details-title">Account Information</div>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-lbl">First Name</div>
                <div class="detail-val" id="dFirst"></div>
              </div>
              <div class="detail-item">
                <div class="detail-lbl">Last Name</div>
                <div class="detail-val" id="dLast"></div>
              </div>
              <div class="detail-item" style="grid-column:span 2">
                <div class="detail-lbl">Email Address</div>
                <div class="detail-val" id="dEmail"></div>
              </div>
              <div class="detail-item">
                <div class="detail-lbl">Phone</div>
                <div class="detail-val" id="dPhone"></div>
              </div>
              <div class="detail-item">
                <div class="detail-lbl">City</div>
                <div class="detail-val" id="dCity"></div>
              </div>
              <div class="detail-item">
                <div class="detail-lbl">Province</div>
                <div class="detail-val" id="dProvince"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ACCOUNT ACTIONS -->
        <div class="section-lbl" style="margin-top:1.8rem;">Account Actions</div>
        <div class="actions-row">
          <a class="action-card" href="#" id="btnEdit">
            <div class="ac-icon green">
              <svg width="20" height="20" fill="none" stroke="var(--green-mid)" stroke-width="2.2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <div>
              <div class="ac-title">Edit Profile</div>
              <div class="ac-sub">Update your information</div>
            </div>
          </a>
          <a class="action-card" href="#" id="btnPwd">
            <div class="ac-icon orange">
              <svg width="20" height="20" fill="none" stroke="var(--orange)" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <div class="ac-title">Change Password</div>
              <div class="ac-sub">Keep your account secure</div>
            </div>
          </a>
        </div>

      </div><!-- /page -->
    </div><!-- /main -->
  </div><!-- /layout -->

  <!-- ════════ EDIT PROFILE MODAL ════════ -->
  <div class="modal-overlay" id="mEdit" style="display:none;">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-header-icon">
          <svg width="20" height="20" fill="none" stroke="var(--green-mid)" stroke-width="2.2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <span class="modal-title">Edit Profile</span>
        <button class="modal-close" id="closeEdit">&#x2715;</button>
      </div>
      <div class="modal-body">
        <div class="mf-row" style="margin-bottom:1rem;">
          <div class="mf">
            <label class="mf-lbl">First Name</label>
            <input class="mf-input" type="text" id="eFirst" placeholder="First name" />
            <span class="mf-err" id="eFirstErr"></span>
          </div>
          <div class="mf">
            <label class="mf-lbl">Last Name</label>
            <input class="mf-input" type="text" id="eLast" placeholder="Last name" />
            <span class="mf-err" id="eLastErr"></span>
          </div>
        </div>
        <div class="mf">
          <label class="mf-lbl">Email Address</label>
          <input class="mf-input" type="email" id="eEmail" placeholder="your@email.com" />
          <span class="mf-err" id="eEmailErr"></span>
        </div>
        <div class="mf">
          <label class="mf-lbl">Phone Number</label>
          <input class="mf-input" type="tel" id="ePhone" placeholder="+1 234 567 8900" />
        </div>
        <div class="mf-row">
          <div class="mf">
            <label class="mf-lbl">City</label>
            <input class="mf-input" type="text" id="eCity" placeholder="Your city" />
          </div>
          <div class="mf">
            <label class="mf-lbl">Province</label>
            <input class="mf-input" type="text" id="eProvince" placeholder="Province" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="mBtn mBtn-ghost" id="cancelEdit">Cancel</button>
        <button class="mBtn mBtn-green" id="saveEditBtn">Save Changes</button>
      </div>
    </div>
  </div>

  <!-- ════════ CHANGE PASSWORD MODAL ════════ -->
  <div class="modal-overlay" id="mPwd" style="display:none;">
    <div class="modal-box sm">
      <div class="modal-header">
        <div class="modal-header-icon">
          <svg width="20" height="20" fill="none" stroke="var(--orange)" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="modal-title">Change Password</span>
        <button class="modal-close" id="closePwd">&#x2715;</button>
      </div>
      <div class="modal-body">
        <div class="mf">
          <label class="mf-lbl">Current Password</label>
          <input class="mf-input" type="password" id="pCur" placeholder="Enter current password" />
          <span class="mf-err" id="pCurErr"></span>
        </div>
        <div class="mf">
          <label class="mf-lbl">New Password</label>
          <input class="mf-input" type="password" id="pNew" placeholder="Min. 8 characters" />
          <span class="mf-err" id="pNewErr"></span>
        </div>
        <div class="mf">
          <label class="mf-lbl">Confirm New Password</label>
          <input class="mf-input" type="password" id="pConf" placeholder="Repeat new password" />
          <span class="mf-err" id="pConfErr"></span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="mBtn mBtn-ghost" id="cancelPwd">Cancel</button>
        <button class="mBtn mBtn-orange" id="savePwdBtn">Update Password</button>
      </div>
    </div>
  </div>

  <!-- ════════ TOAST ════════ -->
  <div id="toastBox"></div>

  <script src="js/user_dashboard.js"></script>
</body>
</html>