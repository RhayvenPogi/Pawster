<?php
session_start();

// ── DB connection ────────────────────────────────
$conn = pg_connect("host=localhost port=5432 dbname=pawster_db user=postgres password=1234");

// ── Handle AJAX POST actions ─────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit;
    }

    if (!$conn) {
        echo json_encode(['success' => false, 'message' => 'DB connection failed']);
        exit;
    }

    $action = $_POST['action'];

    switch ($action) {

        // ── STATS ──────────────────────────────────
        case 'stats':
            $stats = [];
            $tables_exist = pg_query($conn, "SELECT to_regclass('public.animals')");
            $animals_exist = pg_fetch_row($tables_exist)[0] !== null;
            $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM users")); $stats['users'] = (int)$r['c'];
            if ($animals_exist) {
                $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM animals")); $stats['animals'] = (int)$r['c'];
                $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM animals WHERE health='Healthy'")); $stats['health_healthy'] = (int)$r['c'];
                $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM animals WHERE health='Needs Care'")); $stats['health_care'] = (int)$r['c'];
                $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM animals WHERE health='Under Treatment'")); $stats['health_treatment'] = (int)$r['c'];
            } else { $stats['animals'] = $stats['health_healthy'] = $stats['health_care'] = $stats['health_treatment'] = 0; }
            $ar = pg_query($conn, "SELECT to_regclass('public.adoption_requests')");
            if (pg_fetch_row($ar)[0] !== null) {
                $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM adoption_requests")); $stats['adoptions'] = (int)$r['c'];
                $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM adoption_requests WHERE status='Pending'")); $stats['pending_adoptions'] = (int)$r['c'];
            } else { $stats['adoptions'] = $stats['pending_adoptions'] = 0; }
            $rr = pg_query($conn, "SELECT to_regclass('public.rehome_requests')");
            if (pg_fetch_row($rr)[0] !== null) {
                $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM rehome_requests")); $stats['rehome'] = (int)$r['c'];
                $r = pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM rehome_requests WHERE status='Pending'")); $stats['pending_rehome'] = (int)$r['c'];
            } else { $stats['rehome'] = $stats['pending_rehome'] = 0; }
            $sr = pg_query($conn, "SELECT to_regclass('public.followup_surveys')");
            $stats['surveys'] = (pg_fetch_row($sr)[0] !== null) ? (int)pg_fetch_assoc(pg_query($conn, "SELECT COUNT(*) as c FROM followup_surveys"))['c'] : 0;
            echo json_encode(['success' => true, 'data' => $stats]);
            break;

        // ── GET USERS ──────────────────────────────
        case 'get_users':
            $role = trim($_POST['role'] ?? 'all');
            if ($role && $role !== 'all') {
                $q = pg_query_params($conn, "SELECT id,first_name,last_name,email,role,is_active,created_at,last_login FROM users WHERE role=$1 ORDER BY created_at DESC", [$role]);
            } else {
                $q = pg_query($conn, "SELECT id,first_name,last_name,email,role,is_active,created_at,last_login FROM users ORDER BY created_at DESC");
            }
            if (!$q) { echo json_encode(['success' => false, 'message' => pg_last_error($conn)]); break; }
            echo json_encode(['success' => true, 'data' => pg_fetch_all($q) ?: []]);
            break;

        // ── ADD USER ───────────────────────────────
        case 'add_user':
            $fname = trim($_POST['first_name'] ?? ''); $lname = trim($_POST['last_name'] ?? '');
            $email = trim($_POST['email'] ?? ''); $pass = $_POST['password'] ?? '';
            $role = trim($_POST['role'] ?? 'user'); $active = (int)($_POST['is_active'] ?? 1);
            if (!$fname||!$lname||!$email||!$pass) { echo json_encode(['success'=>false,'message'=>'All fields required']); break; }
            $dup = pg_query_params($conn, "SELECT id FROM users WHERE email=$1", [$email]);
            if (pg_fetch_assoc($dup)) { echo json_encode(['success'=>false,'message'=>'Email already registered']); break; }
            $hash = password_hash($pass, PASSWORD_BCRYPT);
            $q = pg_query_params($conn, "INSERT INTO users (first_name,last_name,email,password_hash,role,is_active,phone,address,city,province,zip_code,id_file_path,created_at) VALUES ($1,$2,$3,$4,$5,$6,'','','','','','',NOW())", [$fname,$lname,$email,$hash,$role,$active]);
            echo $q ? json_encode(['success'=>true,'message'=>'User created']) : json_encode(['success'=>false,'message'=>pg_last_error($conn)]);
            break;

        // ── UPDATE USER ────────────────────────────
        case 'update_user':
            $id = (int)($_POST['id'] ?? 0); $fname = trim($_POST['first_name'] ?? '');
            $lname = trim($_POST['last_name'] ?? ''); $email = trim($_POST['email'] ?? '');
            $pass = $_POST['password'] ?? ''; $role = trim($_POST['role'] ?? 'user');
            $active = (int)($_POST['is_active'] ?? 1);
            if (!$id||!$fname||!$lname||!$email) { echo json_encode(['success'=>false,'message'=>'Invalid data']); break; }
            $dup = pg_query_params($conn, "SELECT id FROM users WHERE email=$1 AND id<>$2", [$email,$id]);
            if (pg_fetch_assoc($dup)) { echo json_encode(['success'=>false,'message'=>'Email already in use']); break; }
            if (!empty($pass)) {
                $hash = password_hash($pass, PASSWORD_BCRYPT);
                $q = pg_query_params($conn, "UPDATE users SET first_name=$1,last_name=$2,email=$3,password_hash=$4,role=$5,is_active=$6 WHERE id=$7", [$fname,$lname,$email,$hash,$role,$active,$id]);
            } else {
                $q = pg_query_params($conn, "UPDATE users SET first_name=$1,last_name=$2,email=$3,role=$4,is_active=$5 WHERE id=$6", [$fname,$lname,$email,$role,$active,$id]);
            }
            echo $q ? json_encode(['success'=>true,'message'=>'User updated']) : json_encode(['success'=>false,'message'=>pg_last_error($conn)]);
            break;

        // ── UPDATE USER STATUS ─────────────────────
        case 'update_user_status':
            $id = (int)($_POST['id'] ?? 0); $active = (int)($_POST['is_active'] ?? 0);
            if (!$id) { echo json_encode(['success'=>false,'message'=>'Invalid ID']); break; }
            if ($id == $_SESSION['user_id']) { echo json_encode(['success'=>false,'message'=>'Cannot change your own status']); break; }
            $q = pg_query_params($conn, "UPDATE users SET is_active=$1 WHERE id=$2", [$active,$id]);
            echo $q ? json_encode(['success'=>true]) : json_encode(['success'=>false,'message'=>pg_last_error($conn)]);
            break;

        // ── UPDATE PROFILE ─────────────────────────
        case 'update_profile':
            $id = (int)$_SESSION['user_id'];
            $fname = trim($_POST['first_name'] ?? ''); $lname = trim($_POST['last_name'] ?? '');
            $email = trim($_POST['email'] ?? ''); $phone = trim($_POST['phone'] ?? '');
            if (!$fname||!$email) { echo json_encode(['success'=>false,'message'=>'Name and email required']); break; }
            $dup = pg_query_params($conn, "SELECT id FROM users WHERE email=$1 AND id<>$2", [$email,$id]);
            if (pg_fetch_assoc($dup)) { echo json_encode(['success'=>false,'message'=>'Email already in use']); break; }
            $q = pg_query_params($conn, "UPDATE users SET first_name=$1,last_name=$2,email=$3,phone=$4 WHERE id=$5", [$fname,$lname,$email,$phone,$id]);
            if ($q) {
                $_SESSION['first_name'] = $fname; $_SESSION['last_name'] = $lname; $_SESSION['email'] = $email;
                echo json_encode(['success'=>true,'message'=>'Profile updated','first_name'=>$fname,'last_name'=>$lname,'email'=>$email]);
            } else { echo json_encode(['success'=>false,'message'=>pg_last_error($conn)]); }
            break;

        // ── CHANGE PASSWORD ────────────────────────
        case 'change_password':
            $id = (int)$_SESSION['user_id'];
            $current = $_POST['current_password'] ?? ''; $new_pass = $_POST['new_password'] ?? ''; $confirm = $_POST['confirm_password'] ?? '';
            if (!$current||!$new_pass||!$confirm) { echo json_encode(['success'=>false,'message'=>'All fields required']); break; }
            if ($new_pass !== $confirm) { echo json_encode(['success'=>false,'message'=>'New passwords do not match']); break; }
            if (strlen($new_pass) < 8) { echo json_encode(['success'=>false,'message'=>'Password must be at least 8 characters']); break; }
            $row = pg_fetch_assoc(pg_query_params($conn, "SELECT password_hash FROM users WHERE id=$1", [$id]));
            if (!$row || !password_verify($current, $row['password_hash'])) { echo json_encode(['success'=>false,'message'=>'Current password is incorrect']); break; }
            $hash = password_hash($new_pass, PASSWORD_BCRYPT);
            $q = pg_query_params($conn, "UPDATE users SET password_hash=$1 WHERE id=$2", [$hash,$id]);
            echo $q ? json_encode(['success'=>true,'message'=>'Password changed successfully']) : json_encode(['success'=>false,'message'=>pg_last_error($conn)]);
            break;

        // ── UPLOAD PHOTO ───────────────────────────
        case 'upload_photo':
            $id = (int)$_SESSION['user_id'];
            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) { echo json_encode(['success'=>false,'message'=>'No file uploaded']); break; }
            $file = $_FILES['photo'];
            $allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
            if (!in_array($file['type'], $allowed)) { echo json_encode(['success'=>false,'message'=>'Invalid file type. Use JPG, PNG, GIF or WebP']); break; }
            if ($file['size'] > 2 * 1024 * 1024) { echo json_encode(['success'=>false,'message'=>'File too large. Max 2MB']); break; }
            $upload_dir = __DIR__ . '/uploads/avatars/';
            if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'avatar_' . $id . '_' . time() . '.' . $ext;
            $dest = $upload_dir . $filename;
            $old = pg_fetch_assoc(pg_query_params($conn, "SELECT avatar FROM users WHERE id=$1", [$id]));
            if ($old && $old['avatar'] && file_exists(__DIR__ . '/' . $old['avatar'])) @unlink(__DIR__ . '/' . $old['avatar']);
            if (move_uploaded_file($file['tmp_name'], $dest)) {
                $rel = 'uploads/avatars/' . $filename;
                pg_query_params($conn, "UPDATE users SET avatar=$1 WHERE id=$2", [$rel, $id]);
                $_SESSION['avatar'] = $rel;
                echo json_encode(['success'=>true,'url'=>$rel,'message'=>'Photo updated']);
            } else { echo json_encode(['success'=>false,'message'=>'Upload failed']); }
            break;

        // ── GET ANIMALS ────────────────────────────
        case 'get_animals':
            $q = pg_query($conn, "SELECT * FROM animals ORDER BY created_at DESC");
            if (!$q) { echo json_encode(['success'=>false,'message'=>pg_last_error($conn)]); break; }
            echo json_encode(['success'=>true,'data'=>pg_fetch_all($q)?:[]]);
            break;

        // ── ADD ANIMAL ─────────────────────────────
        case 'add_animal':
            $name = trim($_POST['name'] ?? ''); $type = trim($_POST['type'] ?? 'Dog');
            $breed = trim($_POST['breed'] ?? ''); $age = trim($_POST['age'] ?? '');
            $health = trim($_POST['health'] ?? 'Healthy'); $status = trim($_POST['status'] ?? 'Available');
            if (!$name) { echo json_encode(['success'=>false,'message'=>'Name required']); break; }
            $q = pg_query_params($conn, "INSERT INTO animals (name,type,breed,age,health,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())", [$name,$type,$breed,$age,$health,$status]);
            echo $q ? json_encode(['success'=>true,'message'=>'Animal added']) : json_encode(['success'=>false,'message'=>pg_last_error($conn)]);
            break;

        // ── UPDATE ANIMAL ──────────────────────────
        case 'update_animal':
            $id = (int)($_POST['id'] ?? 0); $name = trim($_POST['name'] ?? '');
            $type = trim($_POST['type'] ?? ''); $breed = trim($_POST['breed'] ?? '');
            $age = trim($_POST['age'] ?? ''); $health = trim($_POST['health'] ?? ''); $status = trim($_POST['status'] ?? '');
            if (!$id||!$name) { echo json_encode(['success'=>false,'message'=>'Invalid data']); break; }
            $q = pg_query_params($conn, "UPDATE animals SET name=$1,type=$2,breed=$3,age=$4,health=$5,status=$6 WHERE id=$7", [$name,$type,$breed,$age,$health,$status,$id]);
            echo $q ? json_encode(['success'=>true,'message'=>'Animal updated']) : json_encode(['success'=>false,'message'=>pg_last_error($conn)]);
            break;

        // ── GET REQUESTS ───────────────────────────
        case 'get_requests':
            $type = ($_POST['type'] ?? '') === 'rehome' ? 'rehome_requests' : 'adoption_requests';
            $status = trim($_POST['status'] ?? ''); $limit = (int)($_POST['limit'] ?? 100);
            $q = $status
                ? pg_query_params($conn, "SELECT * FROM $type WHERE status=$1 ORDER BY created_at DESC LIMIT $2", [$status,$limit])
                : pg_query_params($conn, "SELECT * FROM $type ORDER BY created_at DESC LIMIT $1", [$limit]);
            if (!$q) { echo json_encode(['success'=>false,'message'=>pg_last_error($conn)]); break; }
            echo json_encode(['success'=>true,'data'=>pg_fetch_all($q)?:[]]);
            break;

        // ── UPDATE REQUEST ─────────────────────────
        case 'update_request':
            $type = ($_POST['type'] ?? '') === 'rehome' ? 'rehome_requests' : 'adoption_requests';
            $id = (int)($_POST['id'] ?? 0); $status = trim($_POST['status'] ?? ''); $reason = trim($_POST['reason'] ?? '');
            if (!$id || !in_array($status,['Approved','Rejected','Pending'])) { echo json_encode(['success'=>false,'message'=>'Invalid data']); break; }
            $q = ($status === 'Rejected')
                ? pg_query_params($conn, "UPDATE $type SET status=$1,reject_note=$2 WHERE id=$3", [$status,$reason,$id])
                : pg_query_params($conn, "UPDATE $type SET status=$1 WHERE id=$2", [$status,$id]);
            echo $q ? json_encode(['success'=>true,'message'=>"Request $status"]) : json_encode(['success'=>false,'message'=>pg_last_error($conn)]);
            break;

        // ── GET SURVEYS ────────────────────────────
        case 'get_surveys':
            $q = pg_query($conn, "SELECT * FROM followup_surveys ORDER BY created_at DESC");
            if (!$q) { echo json_encode(['success'=>false,'message'=>pg_last_error($conn)]); break; }
            echo json_encode(['success'=>true,'data'=>pg_fetch_all($q)?:[]]);
            break;

        // ── DELETE ─────────────────────────────────
        case 'delete':
            $type = trim($_POST['type'] ?? ''); $id = (int)($_POST['id'] ?? 0);
            $map = ['animal'=>'animals','user'=>'users','adoption'=>'adoption_requests','rehome'=>'rehome_requests'];
            if (!$id || !isset($map[$type])) { echo json_encode(['success'=>false,'message'=>'Invalid']); break; }
            if ($type === 'user' && $id == $_SESSION['user_id']) { echo json_encode(['success'=>false,'message'=>'Cannot delete yourself']); break; }
            $q = pg_query_params($conn, "DELETE FROM {$map[$type]} WHERE id=$1", [$id]);
            echo $q ? json_encode(['success'=>true]) : json_encode(['success'=>false,'message'=>pg_last_error($conn)]);
            break;

        // ── GET ACTIVITY ───────────────────────────
        case 'get_activity':
            $at = pg_query($conn, "SELECT to_regclass('public.activity_log')");
            if (pg_fetch_row($at)[0] === null) { echo json_encode(['success'=>true,'data'=>[]]); break; }
            $q = pg_query($conn, "SELECT al.*, u.first_name||' '||COALESCE(u.last_name,'') as user_name FROM activity_log al LEFT JOIN users u ON u.id=al.user_id ORDER BY al.created_at DESC LIMIT 100");
            echo json_encode(['success'=>true,'data'=>pg_fetch_all($q)?:[]]);
            break;

        default:
            echo json_encode(['success'=>false,'message'=>'Unknown action']);
    }
    pg_close($conn);
    exit;
}

// ── HTML page ────────────────────────────────────
if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.html");
    exit;
}
$user_id    = $_SESSION['user_id'];
$first_name = htmlspecialchars($_SESSION['first_name'] ?? 'Admin');
$last_name  = htmlspecialchars($_SESSION['last_name']  ?? '');
$full_name  = trim("$first_name $last_name");
$email      = htmlspecialchars($_SESSION['email']      ?? '');
$role       = htmlspecialchars($_SESSION['role']       ?? 'user');
$avatar     = htmlspecialchars($_SESSION['avatar']     ?? '');

$profile_row = [];
if ($conn) {
    $pq = pg_query_params($conn, "SELECT * FROM users WHERE id=$1", [$user_id]);
    if ($pq) $profile_row = pg_fetch_assoc($pq) ?: [];
}
$phone     = htmlspecialchars($profile_row['phone']    ?? '');
$db_avatar = htmlspecialchars($profile_row['avatar']   ?? $avatar);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pawster — Admin Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
  <link rel="stylesheet" href="../css/dashboard.css"/>
</head>
<body>

<div class="mesh-container">
  <div class="mesh-base"></div>
  <div class="orb-wrap orb-wrap-1"><div class="orb"></div></div>
  <div class="orb-wrap orb-wrap-2"><div class="orb"></div></div>
  <div class="orb-wrap orb-wrap-3"><div class="orb"></div></div>
  <div class="orb-wrap orb-wrap-4"><div class="orb"></div></div>
  <div class="mesh-grid"></div>
  <div class="grain"></div>
  <div class="vignette"></div>
</div>

<!-- ░░ SIDEBAR ░░ -->
<aside class="sidebar" id="sidebar">
  <div class="sb-brand">
    <div class="sb-logo-wrap">
      <img src="../images/logo.png" alt="Pawster" class="sb-logo-img"/>
    </div>
    <div class="sb-brand-text">
      <span class="sb-title">Pawster</span>
      <span class="sb-tagline">Admin Panel</span>
    </div>
    <button class="sb-toggle" id="sb-toggle" onclick="toggleSidebar()" title="Collapse">
      <i class="fas fa-chevron-left"></i>
    </button>
  </div>

  <div class="sb-user-card" id="sb-user-card">
    <div class="suc-avatar" id="sb-avatar-wrap">
      <?php if ($db_avatar): ?>
        <img src="<?= $db_avatar ?>" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>
      <?php else: ?>
        <i class="fas fa-user-shield"></i>
      <?php endif; ?>
    </div>
    <div class="suc-info">
      <strong id="sb-uname"><?= $first_name ?></strong>
      <span><span class="dot-pulse"></span>Online</span>
    </div>
  </div>

  <nav class="sb-nav">
    <div class="sb-section-label">Overview</div>
    <a class="sb-link active" data-panel="overview" onclick="nav(this)">
      <div class="sb-ico ico-blue"><i class="fas fa-chart-line"></i></div><span>Dashboard</span>
    </a>
    <div class="sb-section-label">Management</div>
    <a class="sb-link" data-panel="animals" onclick="nav(this)">
      <div class="sb-ico ico-green"><i class="fas fa-paw"></i></div><span>Animals</span>
      <div class="sb-badge" id="nb-animals">0</div>
    </a>
    <a class="sb-link" data-panel="adoptions" onclick="nav(this)">
      <div class="sb-ico ico-orange"><i class="fas fa-heart"></i></div><span>Adoptions</span>
      <div class="sb-badge sb-badge-warn" id="nb-adoptions">0</div>
    </a>
    <a class="sb-link" data-panel="rehome" onclick="nav(this)">
      <div class="sb-ico ico-amber"><i class="fas fa-home"></i></div><span>Rehoming</span>
      <div class="sb-badge" id="nb-rehome">0</div>
    </a>
    <a class="sb-link" data-panel="surveys" onclick="nav(this)">
      <div class="sb-ico ico-teal"><i class="fas fa-clipboard-list"></i></div><span>Surveys</span>
      <div class="sb-badge" id="nb-surveys">0</div>
    </a>
    <div class="sb-section-label">Analytics</div>
    <a class="sb-link" data-panel="map" onclick="nav(this)">
      <div class="sb-ico ico-blue"><i class="fas fa-globe-asia"></i></div><span>Geographic Map</span>
    </a>
    <div class="sb-section-label">System</div>
    <a class="sb-link" data-panel="users" onclick="nav(this)">
      <div class="sb-ico ico-purple"><i class="fas fa-users"></i></div><span>User Management</span>
      <div class="sb-badge" id="nb-users">0</div>
    </a>
    <a class="sb-link" data-panel="activity" onclick="nav(this)">
      <div class="sb-ico ico-rose"><i class="fas fa-history"></i></div><span>Activity Log</span>
    </a>
  </nav>

  <div class="sb-bottom">
    <a href="../php/index.php" class="sb-back-link" title="Back to Site">
      <i class="fas fa-arrow-left"></i><span>Back to Site</span>
    </a>
    <a href="logout.php" class="sb-logout-link" title="Logout">
      <i class="fas fa-sign-out-alt"></i><span>Logout</span>
    </a>
  </div>
</aside>

<!-- ░░ MAIN ░░ -->
<main class="main" id="main">
  <header class="topbar">
    <div class="tb-left">
      <button class="tb-hamburger" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
      <div class="tb-crumb">
        <span class="crumb-root">
          <img src="../images/logo.png" alt="" class="crumb-logo"/> Pawster
        </span>
        <i class="fas fa-chevron-right crumb-sep"></i>
        <span class="crumb-page" id="crumb-page">Dashboard</span>
      </div>
    </div>
    <div class="tb-search">
      <i class="fas fa-search"></i>
      <input type="text" placeholder="Search…" id="tb-search-input"/>
    </div>
    <div class="tb-right">
      <button class="tb-btn" onclick="refreshDash()" title="Refresh">
        <i class="fas fa-rotate-right" id="refresh-ico"></i>
      </button>
      <button class="tb-btn tb-notif-btn" onclick="toggleNotif()" title="Notifications">
        <i class="fas fa-bell"></i>
        <span class="notif-dot" id="notif-dot" style="display:none"></span>
      </button>
      <button class="tb-btn tb-site-btn" onclick="window.open('../php/index.php','_blank')">
        <i class="fas fa-external-link-alt"></i> View Site
      </button>
      <div class="tb-profile" id="tb-profile" onclick="toggleProfileDrop()">
        <div class="tp-avatar" id="tb-avatar-wrap">
          <?php if ($db_avatar): ?>
            <img src="<?= $db_avatar ?>" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>
          <?php else: ?>
            <i class="fas fa-user-shield"></i>
          <?php endif; ?>
        </div>
        <div class="tp-meta">
          <strong id="tb-uname"><?= $first_name ?></strong>
          <span><?= ucfirst($role) ?></span>
        </div>
        <i class="fas fa-chevron-down tp-caret"></i>
        <div class="profile-drop" id="profile-drop">
          <div class="pd-user">
            <div class="pd-avatar" id="pd-avatar-wrap">
              <?php if ($db_avatar): ?>
                <img src="<?= $db_avatar ?>" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>
              <?php else: ?>
                <i class="fas fa-user-shield"></i>
              <?php endif; ?>
            </div>
            <div>
              <strong id="pd-fullname"><?= $full_name ?></strong>
              <span id="pd-email"><?= $email ?></span>
            </div>
          </div>
          <div class="pd-divider"></div>
          <a href="#" class="pd-item" onclick="navProfile('profile-settings'); return false;"><i class="fas fa-user-cog"></i>Profile Settings</a>
          <a href="#" class="pd-item" onclick="navProfile('security'); return false;"><i class="fas fa-shield-alt"></i>Security</a>
          <div class="pd-divider"></div>
          <a href="logout.php" class="pd-item pd-logout"><i class="fas fa-sign-out-alt"></i>Sign Out</a>
        </div>
      </div>
    </div>
  </header>

  <div class="notif-drawer" id="notif-drawer">
    <div class="nd-head">
      <h3><i class="fas fa-bell"></i> Notifications</h3>
      <button onclick="toggleNotif()"><i class="fas fa-times"></i></button>
    </div>
    <div class="nd-body" id="nd-body">
      <div class="nd-empty"><i class="fas fa-bell-slash"></i><p>No new notifications</p></div>
    </div>
  </div>

  <div class="content" id="content">

    <!-- OVERVIEW -->
    <div class="panel active" id="panel-overview">
      <div class="panel-title">
        <div><h2>Good day, <span id="greeting-name"><?= $first_name ?></span>! 🐾</h2><p>Here's what's happening at the shelter today.</p></div>
        <button class="action-btn" onclick="refreshDash()"><i class="fas fa-sync-alt"></i> Refresh</button>
      </div>
      <div class="stats-row">
        <div class="stat-card sc-green" onclick="nav(document.querySelector('[data-panel=animals]'))">
          <div class="sc-left"><div class="sc-val" id="sv-animals">0</div><div class="sc-lbl">Total Animals</div><div class="sc-sub"><i class="fas fa-arrow-trend-up"></i> Active listings</div></div>
          <div class="sc-right"><i class="fas fa-paw"></i></div><div class="sc-bar"><div class="sc-bar-fill" style="width:70%"></div></div>
        </div>
        <div class="stat-card sc-orange" onclick="nav(document.querySelector('[data-panel=adoptions]'))">
          <div class="sc-left"><div class="sc-val" id="sv-adopt">0</div><div class="sc-lbl">Adoption Requests</div><div class="sc-sub sc-warn"><i class="fas fa-clock"></i> Pending review</div></div>
          <div class="sc-right"><i class="fas fa-heart"></i></div><div class="sc-bar"><div class="sc-bar-fill" style="width:55%"></div></div>
        </div>
        <div class="stat-card sc-amber" onclick="nav(document.querySelector('[data-panel=rehome]'))">
          <div class="sc-left"><div class="sc-val" id="sv-rehome">0</div><div class="sc-lbl">Rehome Requests</div><div class="sc-sub"><i class="fas fa-arrow-trend-up"></i> This week</div></div>
          <div class="sc-right"><i class="fas fa-home"></i></div><div class="sc-bar"><div class="sc-bar-fill" style="width:40%"></div></div>
        </div>
        <div class="stat-card sc-purple" onclick="nav(document.querySelector('[data-panel=users]'))">
          <div class="sc-left"><div class="sc-val" id="sv-users">0</div><div class="sc-lbl">Registered Users</div><div class="sc-sub"><i class="fas fa-user-plus"></i> All accounts</div></div>
          <div class="sc-right"><i class="fas fa-users"></i></div><div class="sc-bar"><div class="sc-bar-fill" style="width:85%"></div></div>
        </div>
      </div>
      <div class="dash-grid">
        <div class="dash-card dc-wide">
          <div class="dc-head">
            <div><h3>Adoption Activity</h3><p>Monthly trends</p></div>
            <div class="dc-tabs">
              <button class="dc-tab active" onclick="setChart('weekly',this)">Weekly</button>
              <button class="dc-tab" onclick="setChart('monthly',this)">Monthly</button>
              <button class="dc-tab" onclick="setChart('yearly',this)">Yearly</button>
            </div>
          </div>
          <canvas id="chart-activity" height="170"></canvas>
        </div>
        <div class="dash-card dc-donut">
          <div class="dc-head"><div><h3>Animal Health</h3><p>Current status</p></div></div>
          <div class="donut-wrap">
            <canvas id="chart-health" width="170" height="170"></canvas>
            <div class="donut-center"><span id="donut-pct">0%</span><small>Healthy</small></div>
          </div>
          <div class="donut-legend">
            <div><span class="dl-dot" style="background:#5aaa30"></span>Healthy <b id="dl-h">0</b></div>
            <div><span class="dl-dot" style="background:#c87820"></span>Needs Care <b id="dl-c">0</b></div>
            <div><span class="dl-dot" style="background:#8957e5"></span>Treatment <b id="dl-t">0</b></div>
          </div>
        </div>
        <div class="dash-card dc-alerts">
          <div class="dc-head"><div><h3>Recent Requests</h3><p>Pending items</p></div><button class="dc-link-btn" onclick="nav(document.querySelector('[data-panel=adoptions]'))">View All</button></div>
          <div id="recent-reqs"></div>
        </div>
        <div class="dash-card dc-users">
          <div class="dc-head"><div><h3>Recent Users</h3><p>Latest signups</p></div><button class="dc-link-btn" onclick="nav(document.querySelector('[data-panel=users]'))">View All</button></div>
          <div id="recent-users-list"></div>
        </div>
      </div>
    </div>

    <!-- ANIMALS -->
    <div class="panel" id="panel-animals">
      <div class="panel-title">
        <div><h2>Manage Animals</h2><p>Add, edit or update animals in the shelter</p></div>
        <button class="action-btn btn-green" onclick="openAnimalModal()"><i class="fas fa-plus"></i> Add Animal</button>
      </div>
      <div class="filter-bar"><div class="search-wrap"><i class="fas fa-search"></i><input type="text" placeholder="Search animals…" oninput="filterTable('animals-tbody', this.value)"/></div></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Breed</th><th>Age</th><th>Health</th><th>Status</th><th>Actions</th></tr></thead><tbody id="animals-tbody"></tbody></table></div>
    </div>

    <!-- ADOPTIONS -->
    <div class="panel" id="panel-adoptions">
      <div class="panel-title">
        <div><h2>Adoption Requests</h2><p>Review and process applications</p></div>
        <div class="tab-group">
          <button class="tab-btn active" onclick="filterReqs('adoptions','all',this)">All</button>
          <button class="tab-btn" onclick="filterReqs('adoptions','Pending',this)">Pending</button>
          <button class="tab-btn" onclick="filterReqs('adoptions','Approved',this)">Approved</button>
          <button class="tab-btn" onclick="filterReqs('adoptions','Rejected',this)">Rejected</button>
        </div>
      </div>
      <div class="req-grid" id="list-adoptions"></div>
    </div>

    <!-- REHOME -->
    <div class="panel" id="panel-rehome">
      <div class="panel-title">
        <div><h2>Rehome Requests</h2><p>Owners seeking new homes for animals</p></div>
        <div class="tab-group">
          <button class="tab-btn active" onclick="filterReqs('rehome','all',this)">All</button>
          <button class="tab-btn" onclick="filterReqs('rehome','Pending',this)">Pending</button>
          <button class="tab-btn" onclick="filterReqs('rehome','Approved',this)">Approved</button>
          <button class="tab-btn" onclick="filterReqs('rehome','Rejected',this)">Rejected</button>
        </div>
      </div>
      <div class="req-grid" id="list-rehome"></div>
    </div>

    <!-- SURVEYS -->
    <div class="panel" id="panel-surveys">
      <div class="panel-title"><div><h2>Follow-up Surveys</h2><p>Post-adoption feedback</p></div></div>
      <div class="req-grid" id="list-surveys"></div>
    </div>

    <!-- USER MANAGEMENT -->
    <div class="panel" id="panel-users">
      <div class="panel-title">
        <div><h2>User Management</h2><p>Manage all registered accounts</p></div>
        <button class="action-btn btn-green" onclick="openUserModal()"><i class="fas fa-user-plus"></i> Add User</button>
      </div>
      <div class="filter-bar">
        <div class="search-wrap"><i class="fas fa-search"></i><input type="text" placeholder="Search users…" oninput="filterTable('users-tbody', this.value)"/></div>
        <div class="role-filter"><label>Role:</label>
          <select id="role-filter" onchange="loadUsers()">
            <option value="all">All Roles</option><option value="admin">Admin</option><option value="user">User</option>
          </select>
        </div>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Last Login</th><th>Actions</th></tr></thead><tbody id="users-tbody"></tbody></table></div>
    </div>

    <!-- ACTIVITY LOG -->
    <div class="panel" id="panel-activity">
      <div class="panel-title">
        <div><h2>Activity Log</h2><p>Recent system activity</p></div>
        <button class="action-btn" onclick="loadActivity()"><i class="fas fa-sync-alt"></i> Refresh</button>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>Action</th><th>User</th><th>Details</th></tr></thead><tbody id="activity-tbody"><tr><td colspan="4" class="td-empty"><i class="fas fa-history"></i> No activity yet</td></tr></tbody></table></div>
    </div>

    <!-- MAP -->
    <!-- MAP PANEL -->
    <div class="panel" id="panel-map">

      <!-- Header -->
      <div class="panel-title map-panel-title">
        <div>
          <h2><i class="fas fa-map-marked-alt" style="color:var(--amber);margin-right:8px"></i>Ilocos Region — Geographic Overview</h2>
          <p>Adoption &amp; rehoming activity across Ilocos Norte, Ilocos Sur, La Union &amp; Pangasinan</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button class="map-tab active" id="map-layer-btn-adoptions" onclick="setMapLayer('adoptions',this)"><i class="fas fa-heart"></i> Adoptions</button>
          <button class="map-tab" id="map-layer-btn-rehome" onclick="setMapLayer('rehome',this)"><i class="fas fa-home"></i> Rehoming</button>
          <button class="map-tab" id="map-layer-btn-users" onclick="setMapLayer('users',this)"><i class="fas fa-users"></i> Users</button>
        </div>
      </div>

      <!-- Province Quick-Filter Ribbon -->
      <div class="map-province-ribbon">
        <div class="mpr-card" id="mpr-all" style="border-left-color:var(--green-mid)" onclick="filterProvince('all',this)">
          <div class="mpr-name"><i class="fas fa-map-marked-alt"></i> All Provinces</div>
          <div class="mpr-count" id="mpr-count-all">—</div>
          <div class="mpr-lbl">total records</div>
        </div>
        <div class="mpr-card" id="mpr-IN" style="border-left-color:#d4a830" onclick="filterProvince('Ilocos Norte',this)">
          <div class="mpr-name">Ilocos Norte</div>
          <div class="mpr-count" id="mpr-count-IN">—</div>
          <div class="mpr-lbl">records</div>
        </div>
        <div class="mpr-card" id="mpr-IS" style="border-left-color:#e07830" onclick="filterProvince('Ilocos Sur',this)">
          <div class="mpr-name">Ilocos Sur</div>
          <div class="mpr-count" id="mpr-count-IS">—</div>
          <div class="mpr-lbl">records</div>
        </div>
        <div class="mpr-card" id="mpr-LU" style="border-left-color:#5aaa30" onclick="filterProvince('La Union',this)">
          <div class="mpr-name">La Union</div>
          <div class="mpr-count" id="mpr-count-LU">—</div>
          <div class="mpr-lbl">records</div>
        </div>
      </div>

      <!-- Stat Strip -->
      <div class="map-stats-row">
        <div class="map-stat-card">
          <div class="msc-icon" style="background:rgba(88,139,65,0.12);color:var(--green-mid)"><i class="fas fa-layer-group"></i></div>
          <div><div class="msc-val" id="msc-total">0</div><div class="msc-lbl">Total Records</div></div>
        </div>
        <div class="map-stat-card">
          <div class="msc-icon" style="background:rgba(212,136,10,0.12);color:var(--amber)"><i class="fas fa-hourglass-half"></i></div>
          <div><div class="msc-val" id="msc-pending">0</div><div class="msc-lbl">Pending</div></div>
        </div>
        <div class="map-stat-card">
          <div class="msc-icon" style="background:rgba(90,170,48,0.12);color:var(--green-border)"><i class="fas fa-check-circle"></i></div>
          <div><div class="msc-val" id="msc-approved">0</div><div class="msc-lbl">Approved</div></div>
        </div>
        <div class="map-stat-card">
          <div class="msc-icon" style="background:rgba(32,96,160,0.1);color:var(--blue)"><i class="fas fa-city"></i></div>
          <div><div class="msc-val" id="msc-regions">0</div><div class="msc-lbl">Cities / Towns</div></div>
        </div>
      </div>

      <!-- MAP BODY -->
      <div class="map-body">
        <!-- LEFT: Main map + timeline -->
        <div class="map-left">

          <!-- Map card -->
          <div class="map-main-card">

            <!-- Top bar -->
            <div class="map-header-bar">
              <div class="map-title-wrap">
                <span class="map-layer-label" id="map-layer-label">Adoption Requests</span>
                <span class="map-live-badge"><span class="map-live-dot"></span>LIVE</span>
              </div>
              <div class="map-controls">
                <button class="map-sv-btn" id="sv-toggle-btn" onclick="toggleStreetView()">
                  <i class="fas fa-street-view"></i> Street View
                </button>
                <button class="map-ctrl-btn" onclick="mapInstance && mapInstance.zoomIn()" title="Zoom In"><i class="fas fa-plus"></i></button>
                <button class="map-ctrl-btn" onclick="mapInstance && mapInstance.zoomOut()" title="Zoom Out"><i class="fas fa-minus"></i></button>
                <button class="map-ctrl-btn" onclick="resetMapView()" title="Reset View"><i class="fas fa-compress-arrows-alt"></i></button>
              </div>
            </div>


            <!-- Map container (Leaflet renders here) -->
            <div class="map-canvas-wrap">
              <div id="pawster-map"></div>

              <!-- Street View overlay (Google Maps Embed) -->
              <div id="sv-overlay" class="sv-overlay">
                <div class="sv-topbar">
                  <span class="sv-location-lbl"><i class="fas fa-street-view"></i> <span id="sv-city-name">Street View</span></span>
                  <button class="sv-close-btn" onclick="closeStreetView()"><i class="fas fa-times"></i> Back to Map</button>
                </div>
                <iframe id="sv-iframe" src="" frameborder="0" allowfullscreen></iframe>
                <div class="sv-no-coverage" id="sv-no-coverage">
                  <i class="fas fa-binoculars"></i>
                  <p>No Street View available for this location.</p>
                  <small>Try clicking a marker on the map.</small>
                </div>
              </div>

              <!-- Heat legend overlay on map bottom -->
              <div class="map-legend-overlay">
                <span class="mlo-label">Low</span>
                <div class="mlo-gradient"></div>
                <span class="mlo-label">High</span>
                <span class="mlo-region"><i class="fas fa-map-pin"></i> Ilocos Region</span>
              </div>
            </div>

          </div><!-- /map-main-card -->

          <!-- Timeline bar chart -->
          <div class="map-timeline-card">
            <div class="mtc-head">
              <h3><i class="fas fa-chart-column"></i> Monthly Activity</h3>
              <div class="mtc-legend">
                <span class="mtc-leg-dot" style="background:var(--amber)"></span><span>This Year</span>
                <span class="mtc-leg-dot" style="background:var(--green-border);margin-left:10px"></span><span>Last Year</span>
              </div>
            </div>
            <div class="mtc-chart" id="mtc-chart"></div>
          </div>

        </div><!-- /map-left -->

        <!-- RIGHT: Rankings sidebar -->
        <div class="map-right">

          <!-- Stats numbers block — like reference top-right corner -->
          <div class="map-numbers-block">
            <div class="mnb-row">
              <div class="mnb-item">
                <div class="mnb-pct" id="mnb-pct">0%</div>
                <div class="mnb-lbl">Approval Rate</div>
              </div>
              <div class="mnb-divider"></div>
              <div class="mnb-item">
                <div class="mnb-big" id="mnb-big1">0</div>
                <div class="mnb-lbl">This Month</div>
              </div>
            </div>
            <div class="mnb-row mnb-row2">
              <div class="mnb-item">
                <div class="mnb-big" id="mnb-big2">0</div>
                <div class="mnb-lbl">Last Month</div>
              </div>
              <div class="mnb-divider"></div>
              <div class="mnb-item">
                <div class="mnb-big" id="mnb-big3">0</div>
                <div class="mnb-lbl">Rejected</div>
              </div>
            </div>
          </div>

          <!-- Heatmap mini grid — like reference amber grid squares -->
          <div class="map-heatgrid-card">
            <div class="mhg-head"><i class="fas fa-th"></i> Activity Grid</div>
            <div class="mhg-grid" id="mhg-grid"></div>
            <div class="mhg-months" id="mhg-months"></div>
          </div>

          <!-- Top cities list -->
          <div class="map-side-panel">
            <div class="msp-head">
              <h3><i class="fas fa-ranking-star"></i> Top Cities</h3>
              <span class="msp-count" id="msp-count">—</span>
            </div>
            <div class="msp-list" id="msp-list">
              <div class="msp-empty"><i class="fas fa-map-marked-alt"></i><p>Loading…</p></div>
            </div>
          </div>

          <!-- Mini bar chart -->
          <div class="map-minibar-card">
            <div class="mmb-head"><i class="fas fa-chart-bar"></i> Distribution</div>
            <div class="msp-bars" id="msp-bars"></div>
          </div>

        </div><!-- /map-right -->

      </div><!-- /map-body -->

    </div><!-- /panel-map -->

    <!-- PROFILE SETTINGS -->
    <div class="panel" id="panel-profile-settings">
      <div class="panel-title">
        <div><h2>Profile Settings</h2><p>Update your personal information and photo</p></div>
        <button class="action-btn" onclick="nav(document.querySelector('[data-panel=overview]'))"><i class="fas fa-arrow-left"></i> Back</button>
      </div>
      <div class="profile-settings-grid">

        <div class="ps-card ps-photo-card">
          <h3 class="ps-card-title"><i class="fas fa-camera"></i> Profile Photo</h3>
          <div class="photo-upload-area">
            <div class="photo-preview-wrap">
              <div class="photo-preview" id="photo-preview">
                <?php if ($db_avatar): ?>
                  <img src="<?= $db_avatar ?>" alt="avatar" id="preview-img"/>
                <?php else: ?>
                  <div class="photo-placeholder" id="photo-placeholder">
                    <i class="fas fa-user-shield"></i>
                  </div>
                  <img src="" alt="avatar" id="preview-img" style="display:none"/>
                <?php endif; ?>
              </div>
              <div class="photo-overlay" onclick="document.getElementById('photo-file-input').click()">
                <i class="fas fa-camera"></i><span>Change</span>
              </div>
            </div>
            <input type="file" id="photo-file-input" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" onchange="previewPhoto(this)"/>
            <div class="photo-actions">
              <button class="action-btn" onclick="document.getElementById('photo-file-input').click()">
                <i class="fas fa-folder-open"></i> Choose File
              </button>
              <button class="action-btn btn-green" id="photo-upload-btn" onclick="uploadPhoto()" style="display:none">
                <i class="fas fa-cloud-upload-alt"></i> Save Photo
              </button>
            </div>
            <p class="photo-hint">JPG, PNG, GIF or WebP &bull; Max 2MB</p>
          </div>
        </div>

        <div class="ps-card ps-info-card">
          <h3 class="ps-card-title"><i class="fas fa-user-edit"></i> Personal Information</h3>
          <div class="ps-form">
            <div class="form-row-2">
              <div class="form-field">
                <label>First Name *</label>
                <input type="text" id="ps-fname" value="<?= $first_name ?>" placeholder="First name"/>
                <span class="field-err" id="ps-fname-err"></span>
              </div>
              <div class="form-field">
                <label>Last Name</label>
                <input type="text" id="ps-lname" value="<?= $last_name ?>" placeholder="Last name"/>
              </div>
            </div>
            <div class="form-field">
              <label>Email Address *</label>
              <input type="email" id="ps-email" value="<?= $email ?>" placeholder="your@email.com"/>
              <span class="field-err" id="ps-email-err"></span>
            </div>
            <div class="form-field">
              <label>Phone Number</label>
              <input type="text" id="ps-phone" value="<?= $phone ?>" placeholder="+63 900 000 0000"/>
            </div>
            <div class="form-field">
              <label>Role</label>
              <input type="text" value="<?= ucfirst($role) ?>" disabled style="opacity:0.6;cursor:not-allowed"/>
            </div>
            <div class="ps-form-actions">
              <button class="action-btn btn-green" onclick="saveProfile()">
                <i class="fas fa-save"></i> Save Changes
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- SECURITY -->
    <div class="panel" id="panel-security">
      <div class="panel-title">
        <div><h2>Security</h2><p>Manage your password and account security</p></div>
        <button class="action-btn" onclick="nav(document.querySelector('[data-panel=overview]'))"><i class="fas fa-arrow-left"></i> Back</button>
      </div>
      <div class="security-grid">

        <div class="ps-card">
          <h3 class="ps-card-title"><i class="fas fa-lock"></i> Change Password</h3>
          <div class="ps-form">
            <div class="form-field">
              <label>Current Password *</label>
              <div class="pw-wrap">
                <input type="password" id="sec-current" placeholder="Enter current password"/>
                <button type="button" class="pw-toggle" onclick="togglePw('sec-current',this)"><i class="fas fa-eye"></i></button>
              </div>
              <span class="field-err" id="sec-current-err"></span>
            </div>
            <div class="form-field">
              <label>New Password *</label>
              <div class="pw-wrap">
                <input type="password" id="sec-new" placeholder="Min 8 characters" oninput="checkPwStrength(this.value)"/>
                <button type="button" class="pw-toggle" onclick="togglePw('sec-new',this)"><i class="fas fa-eye"></i></button>
              </div>
              <div class="pw-strength-bar-wrap">
                <div class="pw-strength-fill" id="pw-strength-fill"></div>
              </div>
              <span class="pw-strength-label" id="pw-strength-label"></span>
              <span class="field-err" id="sec-new-err"></span>
            </div>
            <div class="form-field">
              <label>Confirm New Password *</label>
              <div class="pw-wrap">
                <input type="password" id="sec-confirm" placeholder="Repeat new password"/>
                <button type="button" class="pw-toggle" onclick="togglePw('sec-confirm',this)"><i class="fas fa-eye"></i></button>
              </div>
              <span class="field-err" id="sec-confirm-err"></span>
            </div>
            <div class="ps-form-actions">
              <button class="action-btn btn-green" onclick="changePassword()">
                <i class="fas fa-key"></i> Update Password
              </button>
            </div>
          </div>
        </div>

        <div class="ps-card">
          <h3 class="ps-card-title"><i class="fas fa-info-circle"></i> Account Info</h3>
          <div class="sec-info-list">
            <div class="sec-info-row"><div class="sir-label"><i class="fas fa-user"></i> Full Name</div><div class="sir-val"><?= $full_name ?></div></div>
            <div class="sec-info-row"><div class="sir-label"><i class="fas fa-envelope"></i> Email</div><div class="sir-val" id="sec-email-display"><?= $email ?></div></div>
            <div class="sec-info-row"><div class="sir-label"><i class="fas fa-shield-alt"></i> Role</div><div class="sir-val"><span class="badge bg-purple"><?= ucfirst($role) ?></span></div></div>
            <div class="sec-info-row"><div class="sir-label"><i class="fas fa-circle-check"></i> Status</div><div class="sir-val"><span class="badge bg-green">Active</span></div></div>
            <div class="sec-info-row"><div class="sir-label"><i class="fas fa-id-badge"></i> User ID</div><div class="sir-val">#<?= $user_id ?></div></div>
          </div>
          <div style="margin-top:20px;padding-top:16px;border-top:1.5px solid var(--border)">
            <p style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:14px">
              <i class="fas fa-triangle-exclamation" style="color:var(--amber)"></i>
              Keep your password strong and never share it with anyone.
            </p>
            <a href="logout.php" class="action-btn" style="color:var(--red);border-color:rgba(192,48,48,0.3);background:rgba(192,48,48,0.06);text-decoration:none;display:inline-flex">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </a>
          </div>
        </div>

      </div>
    </div>

  </div><!-- /content -->
</main>

<!-- MODALS -->
<div class="modal-overlay" id="user-modal">
  <div class="modal-box">
    <div class="modal-head"><h3 id="user-modal-title"><i class="fas fa-user-plus"></i> Add User</h3><button onclick="closeModal('user-modal')"><i class="fas fa-times"></i></button></div>
    <div class="modal-body">
      <input type="hidden" id="um-id"/>
      <div class="form-row-2">
        <div class="form-field"><label>First Name *</label><input type="text" id="um-fname" placeholder="First name"/><span class="field-err" id="um-fname-err"></span></div>
        <div class="form-field"><label>Last Name *</label><input type="text" id="um-lname" placeholder="Last name"/><span class="field-err" id="um-lname-err"></span></div>
      </div>
      <div class="form-field"><label>Email Address *</label><input type="email" id="um-email" placeholder="user@pawster.com"/><span class="field-err" id="um-email-err"></span></div>
      <div class="form-row-2">
        <div class="form-field"><label>Password <span id="um-pw-note">(leave blank to keep)</span></label><input type="password" id="um-password" placeholder="••••••••"/><span class="field-err" id="um-pw-err"></span></div>
        <div class="form-field"><label>Role *</label><select id="um-role"><option value="user">User</option><option value="admin">Admin</option></select></div>
      </div>
      <div class="form-field"><label>Status</label><select id="um-status"><option value="1">Active</option><option value="0">Inactive</option></select></div>
    </div>
    <div class="modal-foot"><button class="mb-cancel" onclick="closeModal('user-modal')">Cancel</button><button class="mb-confirm" id="um-submit" onclick="saveUser()"><i class="fas fa-save"></i> Save User</button></div>
  </div>
</div>

<div class="modal-overlay" id="animal-modal">
  <div class="modal-box">
    <div class="modal-head"><h3 id="am-title"><i class="fas fa-paw"></i> Add Animal</h3><button onclick="closeModal('animal-modal')"><i class="fas fa-times"></i></button></div>
    <div class="modal-body">
      <input type="hidden" id="am-id"/>
      <div class="form-row-2">
        <div class="form-field"><label>Name *</label><input type="text" id="am-name" placeholder="Animal name"/></div>
        <div class="form-field"><label>Type *</label><select id="am-type"><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Other</option></select></div>
      </div>
      <div class="form-row-2">
        <div class="form-field"><label>Breed</label><input type="text" id="am-breed" placeholder="Breed"/></div>
        <div class="form-field"><label>Age</label><input type="text" id="am-age" placeholder="e.g. 2 years"/></div>
      </div>
      <div class="form-row-2">
        <div class="form-field"><label>Health Status</label><select id="am-health"><option>Healthy</option><option>Needs Care</option><option>Under Treatment</option></select></div>
        <div class="form-field"><label>Availability</label><select id="am-status"><option>Available</option><option>Pending</option><option>Adopted</option><option>Not Available</option></select></div>
      </div>
    </div>
    <div class="modal-foot"><button class="mb-cancel" onclick="closeModal('animal-modal')">Cancel</button><button class="mb-confirm" onclick="saveAnimal()"><i class="fas fa-save"></i> Save Animal</button></div>
  </div>
</div>

<div class="modal-overlay" id="reject-modal">
  <div class="modal-box" style="max-width:440px">
    <div class="modal-head"><h3><i class="fas fa-times-circle" style="color:#c03030"></i> Rejection Reason</h3><button onclick="closeModal('reject-modal')"><i class="fas fa-times"></i></button></div>
    <div class="modal-body"><div class="form-field"><label>Please provide a reason *</label><textarea id="reject-reason" rows="4" placeholder="Enter reason for rejection…"></textarea></div></div>
    <div class="modal-foot"><button class="mb-cancel" onclick="closeModal('reject-modal')">Cancel</button><button class="mb-confirm" style="background:#c03030" onclick="confirmReject()"><i class="fas fa-times"></i> Confirm Reject</button></div>
  </div>
</div>

<div class="modal-overlay" id="delete-modal">
  <div class="modal-box" style="max-width:400px">
    <div class="modal-head"><h3><i class="fas fa-trash-alt" style="color:#c03030"></i> Confirm Delete</h3><button onclick="closeModal('delete-modal')"><i class="fas fa-times"></i></button></div>
    <div class="modal-body"><p id="delete-msg" style="color:#3a5020;font-weight:700;line-height:1.6">Are you sure you want to delete this record? This action cannot be undone.</p></div>
    <div class="modal-foot"><button class="mb-cancel" onclick="closeModal('delete-modal')">Cancel</button><button class="mb-confirm" style="background:#c03030" id="delete-confirm-btn"><i class="fas fa-trash-alt"></i> Delete</button></div>
  </div>
</div>

<div id="toast-wrap"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
  var PAWSTER_USER = {
    id:     <?= (int)$user_id ?>,
    name:   "<?= $first_name ?>",
    full:   "<?= $full_name ?>",
    email:  "<?= $email ?>",
    role:   "<?= $role ?>",
    avatar: "<?= $db_avatar ?>",
  };
</script>
<script src="../js/admin_dashboard.js"></script>
</body>
</html>