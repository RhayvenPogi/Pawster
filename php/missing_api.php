<?php
/* =============================================
   PAWSTER — MISSING ANIMALS API
   missing_api.php
   Handles all AJAX for the missing pets feed.
   ============================================= */
session_start();
header('Content-Type: application/json');

$conn = pg_connect("host=localhost port=5432 dbname=pawster_db user=postgres password=1234");
if (!$conn) { echo json_encode(['success'=>false,'message'=>'DB error']); exit; }

$loggedIn = isset($_SESSION['user_id']);
$uid      = $loggedIn ? (int)$_SESSION['user_id'] : 0;
$action   = $_POST['action'] ?? $_GET['action'] ?? '';

/* ── AUTO-CREATE TABLES ─────────────────────── */
pg_query($conn, "
  CREATE TABLE IF NOT EXISTS missing_posts (
    id          SERIAL PRIMARY KEY,
    user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pet_name    VARCHAR(120) NOT NULL,
    animal_type VARCHAR(60)  NOT NULL DEFAULT 'Dog',
    breed       VARCHAR(120),
    color       VARCHAR(120),
    last_seen   VARCHAR(255),
    description TEXT,
    contact     VARCHAR(180),
    photo_path  VARCHAR(400),
    status      VARCHAR(20)  NOT NULL DEFAULT 'missing',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )
");
pg_query($conn, "
  CREATE TABLE IF NOT EXISTS missing_likes (
    id      SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES missing_posts(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
  )
");
pg_query($conn, "
  CREATE TABLE IF NOT EXISTS missing_comments (
    id         SERIAL PRIMARY KEY,
    post_id    INT  NOT NULL REFERENCES missing_posts(id) ON DELETE CASCADE,
    user_id    INT  NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
");

/* ═══════════════════════════════════════════════
   ACTIONS
═══════════════════════════════════════════════ */
switch ($action) {

  /* ── GET POSTS ────────────────────────────── */
  case 'get_posts':
    $filter = trim($_GET['filter'] ?? 'all');
    $search = trim($_GET['search'] ?? '');
    $type   = trim($_GET['type']   ?? 'all');
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $limit  = 8;

    $where  = [];
    $params = [];
    $pi     = 1;

    if ($filter === 'missing') { $where[] = "mp.status='missing'"; }
    if ($filter === 'found')   { $where[] = "mp.status='found'";   }
    if ($type !== 'all')       { $where[] = "mp.animal_type=\$$pi"; $params[] = $type; $pi++; }
    if ($search !== '') {
      $where[]  = "(mp.pet_name ILIKE \$$pi OR mp.last_seen ILIKE \$$pi OR mp.description ILIKE \$$pi OR mp.color ILIKE \$$pi)";
      $params[] = '%'.$search.'%'; $pi++;
    }

    $whereSQL = $where ? 'WHERE '.implode(' AND ',$where) : '';

    // liked flag requires uid param
    if ($loggedIn) {
      $likedSQL  = ", EXISTS(SELECT 1 FROM missing_likes ml2 WHERE ml2.post_id=mp.id AND ml2.user_id=\$$pi::int) AS user_liked";
      $params[]  = $uid; $pi++;
    } else {
      $likedSQL  = ", false::bool AS user_liked";
    }

    $params[] = $limit;  $limitPos  = $pi++;
    $params[] = $offset; $offsetPos = $pi++;

    $sql = "
      SELECT mp.*,
             TRIM(u.first_name||' '||COALESCE(u.last_name,'')) AS poster_name,
             (SELECT COUNT(*) FROM missing_likes   ml WHERE ml.post_id=mp.id) AS like_count,
             (SELECT COUNT(*) FROM missing_comments mc WHERE mc.post_id=mp.id) AS comment_count
             $likedSQL
      FROM missing_posts mp
      JOIN users u ON u.id=mp.user_id
      $whereSQL
      ORDER BY mp.created_at DESC
      LIMIT \$$limitPos OFFSET \$$offsetPos
    ";

    $q = pg_query_params($conn, $sql, $params);
    if (!$q) { echo json_encode(['success'=>false,'message'=>pg_last_error($conn)]); exit; }

    $posts = pg_fetch_all($q) ?: [];
    foreach ($posts as &$p) {
      $p['like_count']    = (int)$p['like_count'];
      $p['comment_count'] = (int)$p['comment_count'];
      $p['user_liked']    = ($p['user_liked'] === 't');
      $p['is_owner']      = $loggedIn && (int)$p['user_id'] === $uid;
      $p['time_ago']      = timeAgo($p['created_at']);
    }
    echo json_encode(['success'=>true,'data'=>$posts,'has_more'=>count($posts)===$limit]);
    break;

  /* ── GET COMMENTS ─────────────────────────── */
  case 'get_comments':
    $postId = (int)($_GET['post_id'] ?? 0);
    if (!$postId) { echo json_encode(['success'=>false]); exit; }
    $q = pg_query_params($conn,
      "SELECT mc.id, mc.body, mc.created_at,
              TRIM(u.first_name||' '||COALESCE(u.last_name,'')) AS commenter_name,
              SUBSTR(UPPER(u.first_name),1,1)||SUBSTR(UPPER(COALESCE(u.last_name,'')),1,1) AS initials
       FROM missing_comments mc
       JOIN users u ON u.id=mc.user_id
       WHERE mc.post_id=\$1 ORDER BY mc.created_at ASC", [$postId]);
    $rows = pg_fetch_all($q) ?: [];
    foreach ($rows as &$r) $r['time_ago'] = timeAgo($r['created_at']);
    echo json_encode(['success'=>true,'data'=>$rows]);
    break;

  /* ── CREATE POST ───────────────────────────── */
  case 'create_post':
    if (!$loggedIn) { echo json_encode(['success'=>false,'message'=>'Login required']); exit; }

    $petName  = trim($_POST['pet_name']    ?? '');
    $type     = trim($_POST['animal_type'] ?? 'Dog');
    $breed    = trim($_POST['breed']       ?? '');
    $color    = trim($_POST['color']       ?? '');
    $lastSeen = trim($_POST['last_seen']   ?? '');
    $desc     = trim($_POST['description'] ?? '');
    $contact  = trim($_POST['contact']     ?? '');

    if (!$petName) { echo json_encode(['success'=>false,'message'=>'Pet name is required']); exit; }

    $photoPath = null;
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
      $file    = $_FILES['photo'];
      $allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
      if (!in_array($file['type'], $allowed)) { echo json_encode(['success'=>false,'message'=>'Invalid image type']); exit; }
      if ($file['size'] > 5*1024*1024) { echo json_encode(['success'=>false,'message'=>'Max 5MB image']); exit; }
      $dir = __DIR__.'/uploads/missing/';
      if (!is_dir($dir)) mkdir($dir,0755,true);
      $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
      $filename = 'missing_'.$uid.'_'.time().'.'.$ext;
      if (move_uploaded_file($file['tmp_name'], $dir.$filename)) {
        $photoPath = 'uploads/missing/'.$filename;
      }
    }

    $q = pg_query_params($conn,
      "INSERT INTO missing_posts (user_id,pet_name,animal_type,breed,color,last_seen,description,contact,photo_path)
       VALUES (\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8,\$9) RETURNING id",
      [$uid,$petName,$type,$breed,$color,$lastSeen,$desc,$contact,$photoPath]);
    if (!$q) { echo json_encode(['success'=>false,'message'=>pg_last_error($conn)]); exit; }
    $row = pg_fetch_assoc($q);
    echo json_encode(['success'=>true,'post_id'=>(int)$row['id']]);
    break;

  /* ── TOGGLE LIKE ───────────────────────────── */
  case 'toggle_like':
    if (!$loggedIn) { echo json_encode(['success'=>false,'message'=>'Login required']); exit; }
    $postId = (int)($_POST['post_id'] ?? 0);
    if (!$postId) { echo json_encode(['success'=>false]); exit; }

    $exists = pg_fetch_assoc(pg_query_params($conn,
      "SELECT id FROM missing_likes WHERE post_id=\$1 AND user_id=\$2",[$postId,$uid]));
    if ($exists) {
      pg_query_params($conn,"DELETE FROM missing_likes WHERE post_id=\$1 AND user_id=\$2",[$postId,$uid]);
      $liked = false;
    } else {
      pg_query_params($conn,"INSERT INTO missing_likes (post_id,user_id) VALUES (\$1,\$2)",[$postId,$uid]);
      $liked = true;
    }
    $cnt = pg_fetch_assoc(pg_query_params($conn,
      "SELECT COUNT(*) AS c FROM missing_likes WHERE post_id=\$1",[$postId]));
    echo json_encode(['success'=>true,'liked'=>$liked,'count'=>(int)$cnt['c']]);
    break;

  /* ── ADD COMMENT ───────────────────────────── */
  case 'add_comment':
    if (!$loggedIn) { echo json_encode(['success'=>false,'message'=>'Login required']); exit; }
    $postId = (int)($_POST['post_id'] ?? 0);
    $body   = trim($_POST['body']    ?? '');
    if (!$postId || !$body) { echo json_encode(['success'=>false,'message'=>'Missing data']); exit; }

    $q = pg_query_params($conn,
      "INSERT INTO missing_comments (post_id,user_id,body) VALUES (\$1,\$2,\$3) RETURNING id,created_at",
      [$postId,$uid,$body]);
    if (!$q) { echo json_encode(['success'=>false,'message'=>pg_last_error($conn)]); exit; }
    $row  = pg_fetch_assoc($q);
    $fn   = $_SESSION['first_name'] ?? '';
    $ln   = $_SESSION['last_name']  ?? '';
    $init = strtoupper(substr($fn,0,1).substr($ln,0,1));
    echo json_encode([
      'success'        => true,
      'comment_id'     => (int)$row['id'],
      'commenter_name' => trim("$fn $ln"),
      'initials'       => $init,
      'body'           => $body,
      'time_ago'       => 'Just now',
    ]);
    break;

  /* ── MARK FOUND ────────────────────────────── */
  case 'mark_found':
    if (!$loggedIn) { echo json_encode(['success'=>false,'message'=>'Login required']); exit; }
    $postId = (int)($_POST['post_id'] ?? 0);
    $role   = $_SESSION['role'] ?? 'user';
    $own    = pg_fetch_assoc(pg_query_params($conn,
      "SELECT id FROM missing_posts WHERE id=\$1 AND user_id=\$2",[$postId,$uid]));
    if (!$own && $role !== 'admin') { echo json_encode(['success'=>false,'message'=>'Not authorized']); exit; }
    pg_query_params($conn,"UPDATE missing_posts SET status='found' WHERE id=\$1",[$postId]);
    echo json_encode(['success'=>true]);
    break;

  /* ── DELETE POST ───────────────────────────── */
  case 'delete_post':
    if (!$loggedIn) { echo json_encode(['success'=>false,'message'=>'Login required']); exit; }
    $postId = (int)($_POST['post_id'] ?? 0);
    $role   = $_SESSION['role'] ?? 'user';
    $own    = pg_fetch_assoc(pg_query_params($conn,
      "SELECT id,photo_path FROM missing_posts WHERE id=\$1 AND user_id=\$2",[$postId,$uid]));
    if (!$own && $role !== 'admin') { echo json_encode(['success'=>false,'message'=>'Not authorized']); exit; }
    if ($own && $own['photo_path'] && file_exists(__DIR__.'/'.$own['photo_path'])) {
      @unlink(__DIR__.'/'.$own['photo_path']);
    }
    pg_query_params($conn,"DELETE FROM missing_posts WHERE id=\$1",[$postId]);
    echo json_encode(['success'=>true]);
    break;

  default:
    echo json_encode(['success'=>false,'message'=>'Unknown action']);
}

pg_close($conn);

function timeAgo($datetime) {
  $diff = time() - strtotime($datetime);
  if ($diff < 60)     return 'just now';
  if ($diff < 3600)   return floor($diff/60).'m ago';
  if ($diff < 86400)  return floor($diff/3600).'h ago';
  if ($diff < 604800) return floor($diff/86400).'d ago';
  return date('M j, Y', strtotime($datetime));
}