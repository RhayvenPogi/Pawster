<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'user') {
    header("Location: ../login.html"); exit;
}
$host="localhost";$port="5432";$dbname="pawster_db";$db_user="postgres";$db_pass="1234";
$dbconn=pg_connect("host=$host port=$port dbname=$dbname user=$db_user password=$db_pass");
pg_query($dbconn,"ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'");
pg_query($dbconn,"ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
pg_query($dbconn,"ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)");
pg_query($dbconn,"ALTER TABLE users ADD COLUMN IF NOT EXISTS province VARCHAR(100)");
pg_query($dbconn,"ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT");
pg_query($dbconn,"ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20)");
$uid=(int)$_SESSION['user_id'];
$result=pg_query_params($dbconn,"SELECT first_name,last_name,email,phone,address,city,province,zip_code,status,created_at FROM users WHERE id=\$1",[$uid]);
$me=($result?pg_fetch_assoc($result):false)?:[];
$firstName=htmlspecialchars($me['first_name']??$_SESSION['first_name']??'User');
$lastName=htmlspecialchars($me['last_name']??'');
$fullName=trim("$firstName $lastName");
$email=htmlspecialchars($me['email']??'');
$phone=htmlspecialchars($me['phone']??'');
$city=htmlspecialchars($me['city']??'');
$province=htmlspecialchars($me['province']??'');
$zipCode=htmlspecialchars($me['zip_code']??'');
$status=$me['status']??'pending';
$joinDate=!empty($me['created_at'])?date('F j, Y',strtotime($me['created_at'])):'—';
$initials=strtoupper(substr($me['first_name']??'U',0,1).substr($me['last_name']??'',0,1));
$filledFields=0;
foreach(['first_name','last_name','email','phone','address','city','province'] as $f){if(!empty($me[$f]))$filledFields++;}
$profilePct=(int)round(($filledFields/7)*100);
$daysSince=0;
if(!empty($me['created_at'])){$daysSince=(int)(new DateTime())->diff(new DateTime($me['created_at']))->days;}
$statusMap=['pending'=>'Under Review','approved'=>'Approved','rejected'=>'Rejected'];
$statusLabel=$statusMap[$status]??ucfirst($status);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pawster — My Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/user_dashboard.css"/>
</head>
<body>

<div class="mesh-bg">
  <div class="mesh-base"></div>
  <div class="orb orb-1"></div><div class="orb orb-2"></div>
  <div class="orb orb-3"></div><div class="orb orb-4"></div>
  <div class="mesh-grid"></div><div class="grain"></div><div class="vignette"></div>
</div>

<nav class="topnav">
  <a class="nav-brand" href="../index.html">
    <img src="../images/logo.png" alt="Pawster"/>
    <span class="nav-brand-text">Paw<em>ster</em></span>
  </a>
  <div class="nav-divider"></div>
  <div class="nav-links">
    <a class="nav-link home-link" href="../index.html"><i class="fas fa-house"></i> Home</a>
    <a class="nav-link active" href="dashboard.php"><i class="fas fa-th-large"></i> Dashboard</a>
    <a class="nav-link" href="#"><i class="fas fa-search"></i> Explore Pets</a>
    <a class="nav-link" href="#"><i class="fas fa-heart"></i> Favourites <span class="nl-badge">4</span></a>
    <a class="nav-link" href="#"><i class="fas fa-file-alt"></i> Applications <span class="nl-badge">1</span></a>
  </div>
  <div class="nav-right">
    <div class="nav-avatar-btn" id="avatarBtn">
      <div class="nav-avatar"><?= $initials ?></div>
      <div>
        <div class="nav-avatar-name"><?= $firstName ?></div>
        <div class="nav-avatar-role">Member</div>
      </div>
      <i class="fas fa-chevron-down nav-caret"></i>
      <div class="profile-drop" id="profileDrop">
        <div class="pd-user">
          <div class="pd-avatar"><?= $initials ?></div>
          <div><strong><?= $fullName ?></strong><span><?= $email ?></span></div>
        </div>
        <div class="pd-divider"></div>
        <a class="pd-item" href="../index.html"><i class="fas fa-house"></i>Homepage</a>
        <button class="pd-item" onclick="openEdit()"><i class="fas fa-user-edit"></i>Edit Profile</button>
        <button class="pd-item" onclick="openPwd()"><i class="fas fa-lock"></i>Change Password</button>
        <div class="pd-divider"></div>
        <a class="pd-item danger" href="logout.php"><i class="fas fa-sign-out-alt"></i>Log Out</a>
      </div>
    </div>
    <a class="nav-logout" href="logout.php"><i class="fas fa-sign-out-alt"></i> Log Out</a>
  </div>
</nav>

<div class="page-wrap">

  <div class="welcome">
    <div class="welcome-tag"><i class="fas fa-paw"></i> Member Dashboard</div>
    <h1>Good day, <em><?= $firstName ?></em>!</h1>
    <p class="welcome-sub">Here's your Pawster account overview.</p>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div class="sc-icon green"><i class="fas fa-user"></i></div>
      <div style="flex:1">
        <div class="sc-val"><?= $profilePct ?>%</div>
        <div class="sc-lbl">Profile Complete</div>
        <div class="sc-bar-wrap"><div class="sc-bar" style="width:<?= $profilePct ?>%"></div></div>
      </div>
    </div>
    <div class="stat-card">
      <div class="sc-icon orange"><i class="fas fa-calendar-alt"></i></div>
      <div><div class="sc-val"><?= $daysSince ?></div><div class="sc-lbl">Days as Member</div></div>
    </div>
    <div class="stat-card">
      <div class="sc-icon blue"><i class="fas fa-shield-alt"></i></div>
      <div>
        <div class="sc-val" style="font-size:1.2rem;font-family:'Nunito',sans-serif"><?= $statusLabel ?></div>
        <div class="sc-lbl">Account Status</div>
      </div>
    </div>
  </div>

  <div class="sec-lbl">Your Profile</div>
  <div class="profile-grid">
    <div class="panel identity">
      <div class="id-avatar"><?= $initials ?><div class="id-status-ring <?= $status ?>"></div></div>
      <div class="id-name"><?= $fullName ?: $firstName ?></div>
      <div class="id-email"><?= $email ?></div>
      <div class="id-badge <?= $status ?>"><span class="badge-dot"></span><?= $statusLabel ?></div>
      <div class="id-divider"></div>
      <div class="id-meta"><i class="fas fa-calendar-alt"></i> Joined <?= $joinDate ?></div>
      <?php if($city): ?>
      <div class="id-meta"><i class="fas fa-map-marker-alt"></i> <?= $city.($province?', '.$province:'') ?></div>
      <?php endif; ?>
    </div>
    <div class="panel details">
      <div class="details-title">Account Information</div>
      <div class="detail-grid">
        <div><div class="detail-lbl">First Name</div><div class="detail-val"><?= htmlspecialchars($me['first_name']??'—') ?></div></div>
        <div><div class="detail-lbl">Last Name</div><div class="detail-val"><?= htmlspecialchars($me['last_name']??'—') ?></div></div>
        <div style="grid-column:span 2"><div class="detail-lbl">Email Address</div><div class="detail-val"><?= $email?:'—' ?></div></div>
        <div><div class="detail-lbl">Phone</div><div class="detail-val"><?= $phone?:'—' ?></div></div>
        <div><div class="detail-lbl">City</div><div class="detail-val"><?= $city?:'—' ?></div></div>
        <div><div class="detail-lbl">Province</div><div class="detail-val"><?= $province?:'—' ?></div></div>
        <div><div class="detail-lbl">Zip Code</div><div class="detail-val"><?= $zipCode?:'—' ?></div></div>
      </div>
    </div>
  </div>

  <div class="sec-lbl" style="margin-top:1.8rem">Account Actions</div>
  <div class="actions-row">
    <a class="action-card" href="#" onclick="openEdit();return false;">
      <div class="ac-icon green"><i class="fas fa-user-edit"></i></div>
      <div><div class="ac-title">Edit Profile</div><div class="ac-sub">Update your personal information</div></div>
    </a>
    <a class="action-card" href="#" onclick="openPwd();return false;">
      <div class="ac-icon orange"><i class="fas fa-lock"></i></div>
      <div><div class="ac-title">Change Password</div><div class="ac-sub">Keep your account secure</div></div>
    </a>
  </div>

</div>

<!-- Edit Modal -->
<div class="modal-overlay" id="mEdit" style="display:none" onclick="if(event.target===this)closeAll()">
  <div class="modal-box">
    <div class="modal-head">
      <div class="modal-head-icon"><i class="fas fa-user-edit"></i></div>
      <span class="modal-title">Edit Profile</span>
      <button class="modal-close" onclick="closeAll()"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row2">
        <div class="form-field"><label>First Name *</label><input type="text" id="eFirst" value="<?= htmlspecialchars($me['first_name']??'') ?>" placeholder="First name"/><span class="field-err" id="eFirstErr"></span></div>
        <div class="form-field"><label>Last Name *</label><input type="text" id="eLast" value="<?= htmlspecialchars($me['last_name']??'') ?>" placeholder="Last name"/><span class="field-err" id="eLastErr"></span></div>
      </div>
      <div class="form-field"><label>Email Address *</label><input type="email" id="eEmail" value="<?= htmlspecialchars($me['email']??'') ?>" placeholder="your@email.com"/><span class="field-err" id="eEmailErr"></span></div>
      <div class="form-field"><label>Phone Number</label><input type="tel" id="ePhone" value="<?= $phone ?>" placeholder="+63 900 000 0000"/></div>
      <div class="form-row2">
        <div class="form-field"><label>City</label><input type="text" id="eCity" value="<?= $city ?>" placeholder="Your city"/></div>
        <div class="form-field"><label>Province</label><input type="text" id="eProvince" value="<?= $province ?>" placeholder="Province"/></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="mBtn mBtn-ghost" onclick="closeAll()">Cancel</button>
      <button class="mBtn mBtn-green" onclick="saveEdit()"><i class="fas fa-save"></i> Save Changes</button>
    </div>
  </div>
</div>

<!-- Password Modal -->
<div class="modal-overlay" id="mPwd" style="display:none" onclick="if(event.target===this)closeAll()">
  <div class="modal-box sm">
    <div class="modal-head">
      <div class="modal-head-icon"><i class="fas fa-lock" style="color:var(--c2)"></i></div>
      <span class="modal-title">Change Password</span>
      <button class="modal-close" onclick="closeAll()"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-field"><label>Current Password *</label><div class="pw-wrap"><input type="password" id="pCur" placeholder="Current password"/><button class="pw-eye" onclick="togglePw('pCur',this)"><i class="fas fa-eye"></i></button></div><span class="field-err" id="pCurErr"></span></div>
      <div class="form-field"><label>New Password *</label><div class="pw-wrap"><input type="password" id="pNew" placeholder="Min. 8 characters"/><button class="pw-eye" onclick="togglePw('pNew',this)"><i class="fas fa-eye"></i></button></div><span class="field-err" id="pNewErr"></span></div>
      <div class="form-field"><label>Confirm New Password *</label><div class="pw-wrap"><input type="password" id="pConf" placeholder="Repeat new password"/><button class="pw-eye" onclick="togglePw('pConf',this)"><i class="fas fa-eye"></i></button></div><span class="field-err" id="pConfErr"></span></div>
    </div>
    <div class="modal-foot">
      <button class="mBtn mBtn-ghost" onclick="closeAll()">Cancel</button>
      <button class="mBtn mBtn-orange" onclick="savePwd()"><i class="fas fa-key"></i> Update Password</button>
    </div>
  </div>
</div>

<div id="toast-wrap"></div>

<div id="dc">
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
      <circle cx="42" cy="8" r="2.2" fill="#2a1a08"/><circle cx="42.8" cy="7.3" r=".7" fill="#fff"/>
      <g id="dog-ear"><path d="M36 4 Q40 0 44 3 Q42 8 38 9Z" fill="#b87840" stroke="#7a5530" stroke-width="1" stroke-linejoin="round"/></g>
      <rect x="31" y="16" width="10" height="3.5" rx="1.8" fill="#2a7a40" stroke="#1a5030" stroke-width=".8"/>
      <circle cx="36" cy="17.8" r="1.2" fill="#f0c830"/>
    </g>
  </svg>
</div>

<script src="../js/user_dashboard.js"></script>
</body>
</html>