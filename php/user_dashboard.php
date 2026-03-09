<?php
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'user') {
    header("Location: ../login.html");
    exit;
}

$host = "localhost"; $port = "5432"; $dbname = "pawster_db";
$db_user = "postgres"; $db_pass = "1234";
$dbconn = pg_connect("host=$host port=$port dbname=$dbname user=$db_user password=$db_pass");

// Auto-add missing columns
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS province VARCHAR(100)");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT");
pg_query($dbconn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20)");

$uid    = (int) $_SESSION['user_id'];
$result = pg_query_params($dbconn,
    "SELECT first_name, last_name, email, phone, address, city, province, zip_code, status, created_at
     FROM users WHERE id = $1", [$uid]);

$me        = ($result ? pg_fetch_assoc($result) : false) ?: [];
$firstName = htmlspecialchars($me['first_name'] ?? $_SESSION['first_name'] ?? 'User');
$fullName  = trim(htmlspecialchars(($me['first_name'] ?? '') . ' ' . ($me['last_name'] ?? '')));
$email     = htmlspecialchars($me['email'] ?? '');
$status    = $me['status'] ?? 'pending';
$joinDate  = !empty($me['created_at']) ? date('F j, Y', strtotime($me['created_at'])) : '—';
$initials  = strtoupper(substr($me['first_name'] ?? 'U', 0, 1) . substr($me['last_name'] ?? '', 0, 1));

// ── Real account stats ─────────────────────────────────────────────
$filledFields = 0;
foreach (['first_name','last_name','email','phone','address','city','province'] as $f) {
    if (!empty($me[$f])) $filledFields++;
}
$profilePct = (int) round(($filledFields / 7) * 100);

$daysSince = 0;
if (!empty($me['created_at'])) {
    $daysSince = (int) (new DateTime())->diff(new DateTime($me['created_at']))->days;
}

$statusLabel = ['pending'=>'Under Review','approved'=>'Approved','rejected'=>'Rejected'][$status] ?? ucfirst($status);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pawster — Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    /* ════════════════════════════════════
       RESET & ROOT TOKENS
    ════════════════════════════════════ */
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

    :root {
      --c1: #588B41;
      --c2: #B45A22;
      --c3: #e8e0d0;
      --c4: #588B41;
      --c5: #B45A22;
      --c6: #d4c9b0;
      --green-dark:   #1a4a08;
      --green-mid:    #1c4f09;
      --green-border: #5aaa30;
      --orange-link:  #c87820;
      --orange:       #e07820;
      --glass:        rgba(255,248,225,0.38);
      --glass2:       rgba(255,248,225,0.55);
      --panel-border: rgba(255,238,190,0.50);
    }

    html, body {
      height: 100%;
      font-family: 'Nunito', sans-serif;
      background: #EDDABB;
      color: var(--green-dark);
      overflow-x: hidden;
    }

    /* ════════════════════════════════════
       MESH BACKGROUND  (identical to register)
    ════════════════════════════════════ */
    .mesh-container { position:fixed; inset:0; overflow:hidden; z-index:0; }
    .mesh-base { position:absolute; inset:0; background:#EDDABB; }

    .orb-wrap { position:absolute; border-radius:50%; }
    .orb { width:100%; height:100%; border-radius:50%; filter:blur(110px); mix-blend-mode:multiply; opacity:0.7; }

    .orb-wrap-1 { width:1100px; height:1100px; top:-25%; left:-20%;
      background: radial-gradient(circle, var(--c1) 0%, transparent 70%);
      animation: float1 8s ease-in-out infinite; }
    .orb-wrap-2 { width:1000px; height:1000px; top:10%; right:-20%;
      background: radial-gradient(circle, var(--c2) 0%, transparent 70%);
      animation: float2 10s ease-in-out infinite; }
    .orb-wrap-3 { width:950px; height:950px; bottom:-20%; left:10%;
      background: radial-gradient(circle, var(--c3) 0%, transparent 60%);
      animation: float3 7s ease-in-out infinite; }
    .orb-wrap-4 { width:900px; height:900px; top:30%; left:25%;
      background: radial-gradient(circle, var(--c4) 0%, transparent 70%);
      animation: float4 9s ease-in-out infinite; }
    .orb-wrap-5 { width:850px; height:850px; bottom:0%; right:-5%;
      background: radial-gradient(circle, var(--c5) 0%, transparent 70%);
      animation: float5 11s ease-in-out infinite; }
    .orb-wrap-6 { width:800px; height:800px; top:5%; left:35%;
      background: radial-gradient(circle, var(--c6) 0%, transparent 70%);
      animation: float6 8.5s ease-in-out infinite; }

    .mesh-grid {
      position:absolute; inset:0;
      background-image:
        linear-gradient(rgba(100,70,30,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(100,70,30,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .grain {
      position:absolute; inset:-50%; width:200%; height:200%;
      opacity:0.06;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:256px 256px;
      animation: grain 0.4s steps(1) infinite;
    }

    .vignette {
      position:absolute; inset:0;
      background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(150,100,40,0.2) 100%);
    }

    /* ════════════════════════════════════
       SIDEBAR LAYOUT
    ════════════════════════════════════ */
    .layout {
      position: relative; z-index:10;
      display: flex; min-height: 100vh;
    }

    /* ── SIDEBAR ── */
    .sidebar {
      width: 260px; flex-shrink:0;
      position: fixed; top:0; left:0; bottom:0;
      display: flex; flex-direction:column;
      background: rgba(255,248,220,0.45);
      backdrop-filter: blur(22px); -webkit-backdrop-filter:blur(22px);
      border-right: 1.5px solid rgba(255,238,190,0.55);
      box-shadow: 4px 0 28px rgba(160,105,30,0.10);
      z-index: 200; overflow-y:auto;
    }

    .sb-top {
      padding: 1.5rem 1.3rem 1.2rem;
      border-bottom: 1.5px solid rgba(255,238,190,0.45);
    }

    .sb-logo {
      display:flex; align-items:center; gap:0.6rem;
      text-decoration:none; margin-bottom:1.3rem;
    }
    .sb-logo img { width:42px; height:42px; object-fit:cover; }
    .sb-logo-text { font-size:1.15rem; font-weight:900; color:var(--green-dark); }
    .sb-logo-text em { color:var(--orange); font-style:italic; }

    .sb-user {
      display:flex; align-items:center; gap:0.7rem;
      background: rgba(255,248,225,0.65);
      border: 1.5px solid rgba(90,170,48,0.22);
      border-radius: 13px; padding:0.65rem 0.85rem;
    }
    .sb-avatar {
      width:36px; height:36px; border-radius:9px; flex-shrink:0;
      background: linear-gradient(135deg, var(--green-mid), #3a8a18);
      display:flex; align-items:center; justify-content:center;
      font-size:0.78rem; font-weight:900; color:#fff;
      box-shadow: 0 3px 10px rgba(28,79,9,0.22);
    }
    .sb-user-name  { font-size:0.85rem; font-weight:800; color:var(--green-dark); line-height:1.2; }
    .sb-user-email {
      font-size:0.65rem; font-family:'DM Mono',monospace; color:#7aaa50;
      line-height:1.2; white-space:nowrap; overflow:hidden;
      text-overflow:ellipsis; max-width:140px;
    }

    .sb-nav { padding:1rem 0.85rem; flex:1; }

    .sb-section-lbl {
      font-size:0.62rem; font-weight:800; font-style:italic;
      text-transform:uppercase; letter-spacing:0.1em; color:#8aaa60;
      padding:0 0.5rem; margin:1rem 0 0.4rem;
    }
    .sb-section-lbl:first-child { margin-top:0; }

    .sb-link {
      display:flex; align-items:center; gap:0.65rem;
      padding:0.58rem 0.75rem; border-radius:10px;
      font-size:0.87rem; font-weight:700; color:#3a6020;
      text-decoration:none; cursor:none;
      transition:background 0.15s, color 0.15s, border-color 0.15s;
      margin-bottom:0.12rem;
      border-left: 3px solid transparent;
    }
    .sb-link:hover { background:rgba(28,79,9,0.07); color:var(--green-dark); }
    .sb-link.active {
      background:rgba(28,79,9,0.10); color:var(--green-dark); font-weight:800;
      border-left-color: var(--green-border);
    }
    .sb-link svg { flex-shrink:0; opacity:0.65; }
    .sb-link.active svg, .sb-link:hover svg { opacity:1; }
    .sb-link.danger { color:#b03030; }
    .sb-link.danger:hover { background:rgba(208,64,64,0.08); }

    .sb-bottom {
      padding:0.85rem 0.85rem 1.3rem;
      border-top:1.5px solid rgba(255,238,190,0.45);
    }

    /* ── MAIN CONTENT ── */
    .main {
      margin-left: 260px;
      flex:1; min-width:0;
      padding: 2.4rem 2.6rem 4rem;
    }

    /* ── TOPBAR ── */
    .topbar { margin-bottom:2rem; }
    .topbar-title {
      font-size:clamp(1.7rem,2.8vw,2.6rem); font-weight:900;
      color:var(--green-dark); text-transform:uppercase;
      letter-spacing:-0.3px; line-height:1.05;
      text-shadow: 0 2px 12px rgba(255,255,255,0.3);
    }
    .topbar-title em { color:var(--orange); font-style:italic; }
    .topbar-sub { font-size:0.9rem; font-weight:700; color:#3a6020; margin-top:0.3rem; }

    /* PAGE — legacy wrapper, now transparent */
    .page { display:contents; }

    /* ════════════════════════════════════
       WELCOME HEADER
    ════════════════════════════════════ */
    .welcome {
      margin-bottom: 2.4rem;
      animation: fadeUp 0.5s ease both;
    }

    .welcome-tag {
      display:inline-flex; align-items:center; gap:0.45rem;
      background: rgba(28,79,9,0.09);
      border: 1.5px solid rgba(90,170,48,0.3);
      border-radius: 50px; padding: 0.28rem 0.9rem;
      font-size: 0.72rem; font-weight:800; color:var(--green-mid);
      text-transform: uppercase; letter-spacing: 0.09em;
      font-style: italic; margin-bottom: 0.85rem;
    }

    .welcome h1 {
      font-size: clamp(2.2rem,4vw,3.4rem);
      font-weight: 900;
      color: var(--green-dark);
      line-height: 1.05;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 12px rgba(255,255,255,0.35);
    }

    .welcome h1 em { font-style:italic; color: var(--orange); }

    .welcome p {
      margin-top: 0.55rem;
      font-size: 1rem; font-weight:700; color: #3a6020;
    }

    /* ════════════════════════════════════
       STAT CARDS ROW
    ════════════════════════════════════ */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3,1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--glass);
      backdrop-filter: blur(18px); -webkit-backdrop-filter:blur(18px);
      border: 1.5px solid var(--panel-border);
      border-radius: 20px;
      padding: 1.4rem 1.3rem;
      display: flex; align-items:center; gap:1rem;
      transition: transform 0.25s, background 0.25s;
      animation: fadeUp 0.5s ease both;
      position: relative; overflow:hidden;
    }

    .stat-card::before {
      content:''; position:absolute; inset:0;
      background: linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 55%);
      pointer-events:none; border-radius:20px;
    }

    .stat-card:nth-child(1) { animation-delay:.07s; }
    .stat-card:nth-child(2) { animation-delay:.13s; }
    .stat-card:nth-child(3) { animation-delay:.19s; }

    .stat-card:hover { transform:translateY(-4px); background:var(--glass2); }

    .stat-icon {
      width:54px; height:54px; border-radius:14px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:1.6rem;
    }
    .stat-icon.green  { background:rgba(28,79,9,0.12); box-shadow:0 0 18px rgba(88,139,65,0.15); }
    .stat-icon.orange { background:rgba(180,90,34,0.12); box-shadow:0 0 18px rgba(180,90,34,0.15); }
    .stat-icon.blue   { background:rgba(40,100,180,0.10); box-shadow:0 0 18px rgba(40,100,180,0.10); }

    .stat-val { font-size:2.2rem; font-weight:900; color:var(--green-dark); line-height:1; font-family:'DM Mono',monospace; }
    .stat-lbl { font-size:0.8rem; font-weight:700; color:#3a6020; margin-top:0.2rem; }
    .stat-val-sm { font-size:1.25rem; font-family:'Nunito',sans-serif; font-weight:900; letter-spacing:-0.01em; }
    .stat-bar-wrap { margin-top:0.55rem; height:5px; background:rgba(28,79,9,0.12); border-radius:99px; width:100%; min-width:80px; overflow:hidden; }
    .stat-bar { height:100%; background:linear-gradient(90deg, var(--green-mid), #5aaa30); border-radius:99px; transition:width 1s ease; }
    .stat-icon.red { background:rgba(208,64,64,0.10); box-shadow:0 0 18px rgba(208,64,64,0.10); }

    /* ════════════════════════════════════
       SECTION LABEL
    ════════════════════════════════════ */
    .section-lbl {
      font-size: 0.72rem; font-weight:800; font-style:italic;
      color: var(--green-mid); text-transform:uppercase; letter-spacing:0.1em;
      margin-bottom: 0.9rem;
    }

    /* ════════════════════════════════════
       PROFILE GRID
    ════════════════════════════════════ */
    .profile-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1.2rem;
      margin-bottom: 1.2rem;
      animation: fadeUp 0.5s ease 0.25s both;
    }

    .panel {
      background: var(--glass);
      backdrop-filter: blur(18px); -webkit-backdrop-filter:blur(18px);
      border: 1.5px solid var(--panel-border);
      border-radius: 22px;
      position:relative; overflow:hidden;
      box-shadow: 0 8px 32px rgba(160,105,30,0.1);
    }

    .panel::before {
      content:''; position:absolute; inset:0;
      background:linear-gradient(145deg,rgba(255,255,255,0.20) 0%,transparent 55%);
      pointer-events:none;
    }

    /* Identity panel */
    .identity { padding:2rem 1.5rem; text-align:center; }

    .id-avatar {
      width:82px; height:82px; border-radius:20px;
      background: linear-gradient(135deg, var(--green-mid), #3a8a18);
      display:flex; align-items:center; justify-content:center;
      font-size:1.8rem; font-weight:900; color:#fff;
      box-shadow: 0 8px 24px rgba(28,79,9,0.25);
      margin: 0 auto 1rem;
      position:relative;
    }

    .id-status-ring {
      position:absolute; bottom:-4px; right:-4px;
      width:24px; height:24px; border-radius:50%;
      border:3px solid #EDDABB;
    }
    .id-status-ring.approved { background:#5aaa30; }
    .id-status-ring.pending  { background:var(--orange); }
    .id-status-ring.rejected { background:#d04040; }

    .id-name  { font-size:1.15rem; font-weight:900; color:var(--green-dark); }
    .id-email { font-size:0.74rem; font-family:'DM Mono',monospace; color:#5a7a40; margin-top:0.2rem; margin-bottom:0.9rem; }

    .id-badge {
      display:inline-flex; align-items:center; gap:0.3rem;
      padding:0.25rem 0.75rem; border-radius:50px;
      font-size:0.72rem; font-weight:800; font-style:italic;
      text-transform:uppercase; letter-spacing:0.05em;
    }
    .id-badge.approved { background:rgba(88,139,65,0.15); color:#276010; border:1.5px solid rgba(90,170,48,0.35); }
    .id-badge.pending  { background:rgba(224,120,32,0.12); color:var(--orange); border:1.5px solid rgba(224,120,32,0.3); }
    .id-badge.rejected { background:rgba(208,64,64,0.10); color:#b03030; border:1.5px solid rgba(208,64,64,0.25); }

    .badge-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }

    .id-divider { width:40px; height:2px; background:rgba(90,170,48,0.25); border-radius:99px; margin:1.1rem auto; }

    .id-meta {
      display:flex; align-items:center; justify-content:center; gap:0.45rem;
      font-size:0.8rem; font-weight:700; color:#4a6a30; margin-bottom:0.4rem;
    }
    .id-meta svg { color:#7aaa50; flex-shrink:0; }

    /* Details panel */
    .details { padding:1.8rem 1.7rem; }
    .details-title {
      font-size:1.05rem; font-weight:900; color:var(--green-dark);
      text-transform:uppercase; font-style:italic; letter-spacing:0.02em;
      margin-bottom:1.3rem;
    }

    .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.9rem 1.2rem; }

    .detail-item {}
    .detail-lbl {
      font-size:0.68rem; font-weight:800; font-style:italic;
      text-transform:uppercase; letter-spacing:0.09em; color:#276010;
      margin-bottom:0.28rem;
      text-shadow: 0 1px 4px rgba(255,250,232,0.5);
    }
    .detail-val {
      font-size:0.87rem; font-weight:700; color:#1a3a08;
      background:rgba(255,250,232,0.52); border:2px solid rgba(90,170,48,0.35);
      border-radius:10px; padding:0.5rem 0.85rem;
      font-family:'DM Mono',monospace;
    }

    /* ════════════════════════════════════
       ACTION BUTTONS ROW  (now 2 columns)
    ════════════════════════════════════ */
    .actions-row {
      display:grid; grid-template-columns:repeat(2,1fr); gap:1rem;
      animation: fadeUp 0.5s ease 0.33s both;
    }

    .action-card {
      background: var(--glass);
      backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px);
      border: 1.5px solid var(--panel-border);
      border-radius: 20px; padding:1.3rem 1.2rem;
      display:flex; align-items:center; gap:0.9rem;
      cursor:none; text-decoration:none; color:inherit;
      transition:transform 0.22s, background 0.22s, border-color 0.22s;
      position:relative; overflow:hidden;
    }

    .action-card::before {
      content:''; position:absolute; inset:0; border-radius:20px;
      background:linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 55%);
      pointer-events:none;
    }

    .action-card:hover { transform:translateY(-4px); background:var(--glass2); }

    .ac-icon {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    .ac-icon.green  { background:rgba(28,79,9,0.12); }
    .ac-icon.orange { background:rgba(180,90,34,0.12); }

    .ac-title { font-size:0.92rem; font-weight:900; color:var(--green-dark); text-transform:uppercase; font-style:italic; }
    .ac-sub   { font-size:0.75rem; font-weight:700; color:#5a7a40; margin-top:0.1rem; }

    /* ════════════════════════════════════
       MODAL (matches register modal style)
    ════════════════════════════════════ */
    .modal-overlay {
      position:fixed; inset:0; z-index:10000;
      background:rgba(20,35,15,0.55);
      backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
      display:flex; align-items:center; justify-content:center;
      padding:1.5rem; animation:modalFadeIn 0.22s ease;
    }

    @keyframes modalFadeIn { from{opacity:0} to{opacity:1} }

    .modal-box {
      background:#fff; border-radius:22px; width:100%; max-width:520px;
      max-height:90vh; display:flex; flex-direction:column;
      box-shadow:0 24px 64px rgba(60,100,30,0.2);
      animation:modalSlideUp 0.26s cubic-bezier(0.34,1.3,0.64,1);
      overflow:hidden;
    }
    .modal-box.sm { max-width:400px; }

    @keyframes modalSlideUp {
      from{transform:translateY(28px) scale(0.97);opacity:0}
      to{transform:translateY(0) scale(1);opacity:1}
    }

    .modal-header {
      display:flex; align-items:center; gap:0.9rem;
      padding:1.3rem 1.6rem 1.1rem;
      border-bottom:1.5px solid #e8f0e2;
      background:linear-gradient(135deg,#f4faf0,#edf7e5);
      flex-shrink:0;
    }
    .modal-header-icon {
      width:44px; height:44px; background:#fff; border-radius:11px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 8px rgba(90,138,48,0.15); flex-shrink:0;
    }
    .modal-title { font-size:1rem; font-weight:900; color:#2a4a18; font-style:italic; }
    .modal-close {
      margin-left:auto; background:none; border:none;
      font-size:1.5rem; color:#6a8a58; cursor:none;
      padding:0.2rem 0.4rem; border-radius:7px; transition:background 0.15s;
      line-height:1; display:flex;
    }
    .modal-close:hover { background:#e0f0d0; color:#2a4a18; }

    .modal-body { overflow-y:auto; padding:1.4rem 1.6rem; flex:1; }
    .modal-body::-webkit-scrollbar { width:5px; }
    .modal-body::-webkit-scrollbar-thumb { background:#b0d890; border-radius:99px; }

    /* Modal form fields styled like register */
    .mf { margin-bottom:1rem; position:relative; }
    .mf:last-child { margin-bottom:0; }
    .mf-row { display:grid; grid-template-columns:1fr 1fr; gap:0.9rem; margin-bottom:0; }
    .mf-row .mf { margin-bottom:0; }
    .mf-lbl {
      display:block; font-size:0.72rem; font-weight:800; font-style:italic;
      text-transform:uppercase; letter-spacing:0.09em; color:#276010;
      margin-bottom:0.3rem;
      text-shadow: 0 1px 3px rgba(255,250,232,0.6);
    }
    .mf-input {
      width:100%; background:rgba(255,250,232,0.6);
      border:2px solid var(--green-border); border-radius:10px;
      color:#222; font-family:'Nunito',sans-serif; font-size:0.9rem; font-weight:600;
      padding:0.65rem 0.9rem; outline:none; transition:border-color 0.18s,box-shadow 0.18s;
    }
    .mf-input::placeholder { color:#a09060; font-style:italic; }
    .mf-input:focus { border-color:var(--green-mid); box-shadow:0 0 0 3px rgba(28,79,9,0.09); background:rgba(255,252,238,0.85); }
    .mf-err { font-size:0.75rem; font-weight:700; color:#c03030; margin-top:0.25rem; min-height:1rem; display:block; }

    .modal-footer {
      display:flex; gap:0.7rem; justify-content:flex-end;
      padding:1rem 1.6rem 1.3rem; border-top:1.5px solid #e8f0e2;
      background:#fafdf8; flex-shrink:0;
    }

    .mBtn {
      padding:0.65rem 1.2rem; border-radius:11px;
      font-family:'Nunito',sans-serif; font-size:0.88rem; font-weight:800;
      cursor:none; border:none; transition:all 0.15s;
    }
    .mBtn-ghost {
      background:#fff; border:2px solid #c8ddb8; color:#5a7a48;
    }
    .mBtn-ghost:hover { background:#f0f8e8; }
    .mBtn-green {
      background:var(--green-mid); color:#fff;
      box-shadow:0 4px 14px rgba(28,79,9,0.22);
    }
    .mBtn-green:hover { background:#143806; transform:translateY(-1px); }
    .mBtn-orange {
      background:var(--orange); color:#fff;
      box-shadow:0 4px 14px rgba(224,120,32,0.25);
    }
    .mBtn-orange:hover { background:#c06010; transform:translateY(-1px); }

    /* ════════════════════════════════════
       TOAST
    ════════════════════════════════════ */
    #toastBox { position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999; display:flex; flex-direction:column; gap:0.5rem; }

    .toast {
      background:rgba(255,250,232,0.96); border:1.5px solid rgba(90,170,48,0.3);
      border-radius:11px; padding:0.7rem 1.1rem;
      font-size:0.83rem; font-weight:700; color:var(--green-dark);
      display:flex; align-items:center; gap:0.55rem;
      box-shadow:0 8px 30px rgba(160,105,30,0.18); min-width:210px;
      animation:slideInR 0.2s ease;
    }
    .toast.ok  { border-left:3.5px solid #5aaa30; }
    .toast.err { border-left:3.5px solid #d04040; }

    @keyframes slideInR { from{transform:translateX(22px);opacity:0} to{transform:translateX(0);opacity:1} }

    /* ════════════════════════════════════
       RESPONSIVE
    ════════════════════════════════════ */
    @media(max-width:900px) {
      .sidebar { transform:translateX(-100%); }
      .sidebar.open { transform:translateX(0); }
      .main { margin-left:0; padding:1.5rem 1.2rem 3rem; }
      .sb-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.3); z-index:199; display:none; }
      .sb-overlay.show { display:block; }
    }
    @media(max-width:820px) {
      .profile-grid { grid-template-columns:1fr; }
      .stats-row    { grid-template-columns:1fr 1fr; }
      .actions-row  { grid-template-columns:1fr; }
    }
    @media(max-width:500px) {
      .stats-row  { grid-template-columns:1fr; }
      .detail-grid { grid-template-columns:1fr; }
    }

    /* ════════════════════════════════════
       KEYFRAMES
    ════════════════════════════════════ */
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

    @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(12%,16%) scale(1.15)} 66%{transform:translate(-8%,8%) scale(0.9)} }
    @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-14%,10%) scale(0.9)} 66%{transform:translate(8%,-15%) scale(1.15)} }
    @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 25%{transform:translate(14%,-10%) scale(1.12)} 75%{transform:translate(-10%,8%) scale(0.9)} }
    @keyframes float4 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-15%,-12%) scale(1.18)} }
    @keyframes float5 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-10%,-18%) scale(1.1)} 80%{transform:translate(8%,-8%) scale(0.9)} }
    @keyframes float6 { 0%,100%{transform:translate(0,0) scale(1)} 30%{transform:translate(15%,12%) scale(1.15)} 70%{transform:translate(-8%,18%) scale(0.88)} }
    @keyframes grain  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-2%,2%)} }

    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-thumb { background:rgba(90,170,48,0.3); border-radius:99px; }
  </style>
</head>
<body>

<!-- ════════════ MESH BACKGROUND ════════════ -->
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

<!-- ════════════ SIDEBAR OVERLAY (mobile) ════════════ -->
<div class="sb-overlay" id="sbOverlay" onclick="closeSidebar()"></div>

<!-- ════════════ SIDEBAR ════════════ -->
<aside class="sidebar" id="sidebar">
  <div class="sb-top">
    <a class="sb-logo" href="../index.html">
      <img src="../images/logo.png" alt="Pawster" />
      <span class="sb-logo-text">Paw<em>ster</em></span>
    </a>
    <div class="sb-user">
      <div class="sb-avatar"><?= $initials ?></div>
      <div>
        <div class="sb-user-name"><?= $fullName ?: $firstName ?></div>
        <div class="sb-user-email"><?= $email ?></div>
      </div>
    </div>
  </div>

  <nav class="sb-nav">
    <div class="sb-section-lbl">Menu</div>
    <a class="sb-link active" href="dashboard.php">
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
      <span style="margin-left:auto;background:rgba(28,79,9,0.12);color:var(--green-mid);font-size:0.68rem;font-weight:800;padding:0.1rem 0.5rem;border-radius:99px;">4</span>
    </a>
    <a class="sb-link" href="#">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Applications
      <span style="margin-left:auto;background:rgba(224,120,32,0.12);color:var(--orange);font-size:0.68rem;font-weight:800;padding:0.1rem 0.5rem;border-radius:99px;">1</span>
    </a>

    <div class="sb-section-lbl">Account</div>
    <a class="sb-link" href="#" onclick="openEdit();return false;">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Edit Profile
    </a>
    <a class="sb-link" href="#" onclick="openPwd();return false;">
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

<!-- ════════════ MAIN ════════════ -->
<div class="layout">
<div class="main">

<div class="topbar">
  <div class="topbar-title">Welcome back, <em><?= $firstName ?></em>!</div>
  <div class="topbar-sub">Here's your account overview and profile information.</div>
</div>

<div class="page">
  <!-- STATS -->
  <div class="stats-row">

    <div class="stat-card">
      <div class="stat-icon green">
        <svg width="22" height="22" fill="none" stroke="var(--green-mid)" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div>
        <div class="stat-val"><?= $profilePct ?>%</div>
        <div class="stat-lbl">Profile Complete</div>
        <div class="stat-bar-wrap">
          <div class="stat-bar" style="width:<?= $profilePct ?>%"></div>
        </div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon orange">
        <svg width="22" height="22" fill="none" stroke="var(--orange)" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div>
        <div class="stat-val"><?= $daysSince ?></div>
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
        <?= $initials ?>
        <div class="id-status-ring <?= $status ?>"></div>
      </div>
      <div class="id-name"><?= $fullName ?: $firstName ?></div>
      <div class="id-email"><?= $email ?></div>
      <div class="id-divider"></div>
      <div class="id-meta">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Joined <?= $joinDate ?>
      </div>
      <?php if (!empty($me['city'])): ?>
      <div class="id-meta">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <?= htmlspecialchars($me['city']) ?><?= !empty($me['province']) ? ', ' . htmlspecialchars($me['province']) : '' ?>
      </div>
      <?php endif; ?>
    </div>

    <!-- Details Panel -->
    <div class="panel details">
      <div class="details-title">Account Information</div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-lbl">First Name</div>
          <div class="detail-val"><?= htmlspecialchars($me['first_name'] ?? '—') ?></div>
        </div>
        <div class="detail-item">
          <div class="detail-lbl">Last Name</div>
          <div class="detail-val"><?= htmlspecialchars($me['last_name'] ?? '—') ?></div>
        </div>
        <div class="detail-item" style="grid-column:span 2">
          <div class="detail-lbl">Email Address</div>
          <div class="detail-val"><?= $email ?: '—' ?></div>
        </div>
        <div class="detail-item">
          <div class="detail-lbl">Phone</div>
          <div class="detail-val"><?= htmlspecialchars($me['phone'] ?? '—') ?></div>
        </div>
        <div class="detail-item">
          <div class="detail-lbl">City</div>
          <div class="detail-val"><?= htmlspecialchars($me['city'] ?? '—') ?></div>
        </div>
        <div class="detail-item">
          <div class="detail-lbl">Province</div>
          <div class="detail-val"><?= htmlspecialchars($me['province'] ?? '—') ?></div>
        </div>
      </div>
    </div>

  </div>

  <!-- ACTIONS -->
  <div class="section-lbl" style="margin-top:1.8rem;">Account Actions</div>

  <div class="actions-row">
    <a class="action-card" href="#" onclick="openEdit();return false;">
      <div class="ac-icon green">
        <svg width="20" height="20" fill="none" stroke="var(--green-mid)" stroke-width="2.2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>
      <div>
        <div class="ac-title">Edit Profile</div>
        <div class="ac-sub">Update your information</div>
      </div>
    </a>

    <a class="action-card" href="#" onclick="openPwd();return false;">
      <div class="ac-icon orange">
        <svg width="20" height="20" fill="none" stroke="var(--orange)" stroke-width="2.2" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
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

<!-- ════════════ EDIT MODAL ════════════ -->
<div class="modal-overlay" id="mEdit" style="display:none;" onclick="if(event.target===this)closeAll()">
  <div class="modal-box">
    <div class="modal-header">
      <div class="modal-header-icon">
        <svg width="20" height="20" fill="none" stroke="var(--green-mid)" stroke-width="2.2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </div>
      <span class="modal-title">Edit Profile</span>
      <button class="modal-close" onclick="closeAll()">&#x2715;</button>
    </div>
    <div class="modal-body">
      <div class="mf-row" style="margin-bottom:1rem;">
        <div class="mf">
          <label class="mf-lbl">First Name</label>
          <input class="mf-input" type="text" id="eFirst" value="<?= htmlspecialchars($me['first_name'] ?? '') ?>" placeholder="First name" />
          <span class="mf-err" id="eFirstErr"></span>
        </div>
        <div class="mf">
          <label class="mf-lbl">Last Name</label>
          <input class="mf-input" type="text" id="eLast" value="<?= htmlspecialchars($me['last_name'] ?? '') ?>" placeholder="Last name" />
          <span class="mf-err" id="eLastErr"></span>
        </div>
      </div>
      <div class="mf">
        <label class="mf-lbl">Email Address</label>
        <input class="mf-input" type="email" id="eEmail" value="<?= htmlspecialchars($me['email'] ?? '') ?>" placeholder="your@email.com" />
        <span class="mf-err" id="eEmailErr"></span>
      </div>
      <div class="mf">
        <label class="mf-lbl">Phone Number</label>
        <input class="mf-input" type="tel" id="ePhone" value="<?= htmlspecialchars($me['phone'] ?? '') ?>" placeholder="+1 234 567 8900" />
      </div>
      <div class="mf-row" style="margin-bottom:0;">
        <div class="mf">
          <label class="mf-lbl">City</label>
          <input class="mf-input" type="text" id="eCity" value="<?= htmlspecialchars($me['city'] ?? '') ?>" placeholder="Your city" />
        </div>
        <div class="mf">
          <label class="mf-lbl">Province</label>
          <input class="mf-input" type="text" id="eProvince" value="<?= htmlspecialchars($me['province'] ?? '') ?>" placeholder="Province" />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="mBtn mBtn-ghost" onclick="closeAll()">Cancel</button>
      <button class="mBtn mBtn-green" onclick="saveEdit()">Save Changes</button>
    </div>
  </div>
</div>

<!-- ════════════ PASSWORD MODAL ════════════ -->
<div class="modal-overlay" id="mPwd" style="display:none;" onclick="if(event.target===this)closeAll()">
  <div class="modal-box sm">
    <div class="modal-header">
      <div class="modal-header-icon">
        <svg width="20" height="20" fill="none" stroke="var(--orange)" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <span class="modal-title">Change Password</span>
      <button class="modal-close" onclick="closeAll()">&#x2715;</button>
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
      <button class="mBtn mBtn-ghost" onclick="closeAll()">Cancel</button>
      <button class="mBtn mBtn-orange" onclick="savePwd()">Update Password</button>
    </div>
  </div>
</div>

<!-- ════════════ TOAST ════════════ -->
<div id="toastBox"></div>

<script>
/* ── SIDEBAR ───────────────────── */
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('show');
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sbOverlay').classList.toggle('show');
}

/* ── MESH PARALLAX ─────────────── */
const orbs = [
  { el:document.getElementById('o1'), fx:0.10, fy:0.07 },
  { el:document.getElementById('o2'), fx:-0.12, fy:0.09 },
  { el:document.getElementById('o3'), fx:0.14, fy:-0.08 },
  { el:document.getElementById('o4'), fx:-0.08, fy:-0.11 },
  { el:document.getElementById('o5'), fx:0.09, fy:0.13 },
  { el:document.getElementById('o6'), fx:-0.13, fy:0.07 },
];
let mx=0,my=0,cx=0,cy=0;
document.addEventListener('mousemove',e=>{ mx=(e.clientX/innerWidth-.5)*80; my=(e.clientY/innerHeight-.5)*80; });
(function anim(){
  cx+=(mx-cx)*.08; cy+=(my-cy)*.08;
  orbs.forEach(({el,fx,fy})=>{ el.style.marginLeft=(cx*fx)+'px'; el.style.marginTop=(cy*fy)+'px'; });
  requestAnimationFrame(anim);
})();

/* ── DOG CURSOR ────────────────── */
(function(){
  const s=document.createElement('style');
  s.textContent=`
    *,*::before,*::after{cursor:none!important}
    #dc{position:fixed;z-index:99999;pointer-events:none;width:28px;height:28px;transform:translate(-50%,-50%)}
    #dc svg{overflow:visible}
    @keyframes lfw{0%,100%{transform-origin:30px 28px;transform:rotate(-22deg)}50%{transform-origin:30px 28px;transform:rotate(22deg)}}
    @keyframes lbw{0%,100%{transform-origin:14px 28px;transform:rotate(22deg)}50%{transform-origin:14px 28px;transform:rotate(-22deg)}}
    @keyframes tw{0%,100%{transform-origin:8px 18px;transform:rotate(-18deg)}50%{transform-origin:8px 18px;transform:rotate(18deg)}}
    @keyframes bb{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
    @keyframes ef{0%,100%{transform-origin:36px 10px;transform:rotate(0)}50%{transform-origin:36px 10px;transform:rotate(8deg)}}
    @keyframes ss{0%{transform:translateY(0)}40%{transform:translateY(-3px)}100%{transform:translateY(0)}}
    @keyframes pt{0%,100%{transform-origin:30px 28px;transform:rotate(0)}50%{transform-origin:30px 28px;transform:rotate(-30deg)}}
    #dc.walking #dog-body{animation:bb .28s ease-in-out infinite}
    #dc.walking #dog-leg-front{animation:lfw .28s ease-in-out infinite}
    #dc.walking #dog-leg-back{animation:lbw .28s ease-in-out infinite}
    #dc.walking #dog-tail{animation:tw .28s ease-in-out infinite}
    #dc.walking #dog-ear{animation:ef .32s ease-in-out infinite}
    #dc.idle #dog-tail{animation:tw .6s ease-in-out infinite}
    #dc.clicking #dog-body{animation:ss .2s ease-out forwards}
    #dc.clicking #dog-leg-front{animation:pt .18s ease-in-out 2}
  `;
  document.head.appendChild(s);
  const el=document.createElement('div'); el.id='dc';
  el.innerHTML=`<svg id="dog-svg" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
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
      <circle cx="42" cy="8" r="2.2" fill="#2a1a08"/>
      <circle cx="42.8" cy="7.3" r=".7" fill="#fff"/>
      <g id="dog-ear"><path d="M36 4 Q40 0 44 3 Q42 8 38 9Z" fill="#b87840" stroke="#7a5530" stroke-width="1" stroke-linejoin="round"/></g>
      <rect x="31" y="16" width="10" height="3.5" rx="1.8" fill="#2a7a40" stroke="#1a5030" stroke-width=".8"/>
      <circle cx="36" cy="17.8" r="1.2" fill="#f0c830"/>
    </g></svg>`;
  document.body.appendChild(el);
  let mX=innerWidth/2,mY=innerHeight/2,dX=mX,dY=mY,fr=true,ic=false;
  document.addEventListener('mousemove',e=>{mX=e.clientX;mY=e.clientY;});
  document.addEventListener('mousedown',()=>{ic=true;el.className='clicking';setTimeout(()=>ic=false,300);});
  (function loop(){
    if(!ic){
      const dx=mX-dX,dy=mY-dY,d=Math.sqrt(dx*dx+dy*dy);
      if(d>5){
        dX+=(dx/d)*Math.min(d*.13,18); dY+=(dy/d)*Math.min(d*.13,18);
        const right=dx>0;
        if(right!==fr){fr=right;document.getElementById('dog-svg').style.transform=fr?'scaleX(1)':'scaleX(-1)';}
        el.className=d>7?'walking':'idle';
      }else{el.className='idle';}
    }
    el.style.left=dX+'px'; el.style.top=dY+'px';
    requestAnimationFrame(loop);
  })();
}());

/* ── MODAL HELPERS ─────────────── */
function openEdit()  { show('mEdit'); }
function openPwd()   { show('mPwd'); }
function closeAll()  { ['mEdit','mPwd'].forEach(id=>{ document.getElementById(id).style.display='none'; }); document.body.style.overflow=''; }
function show(id)    { document.getElementById(id).style.display='flex'; document.body.style.overflow='hidden'; }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeAll(); });

/* ── SAVE EDIT ─────────────────── */
function saveEdit() {
  let ok = true;
  const fn = document.getElementById('eFirst').value.trim();
  const ln = document.getElementById('eLast').value.trim();
  const em = document.getElementById('eEmail').value.trim();

  document.getElementById('eFirstErr').textContent = '';
  document.getElementById('eLastErr').textContent  = '';
  document.getElementById('eEmailErr').textContent = '';

  if (!fn) { document.getElementById('eFirstErr').textContent = 'Required.'; ok=false; }
  if (!ln) { document.getElementById('eLastErr').textContent  = 'Required.'; ok=false; }
  if (!em) { document.getElementById('eEmailErr').textContent = 'Required.'; ok=false; }
  else if (!/\S+@\S+\.\S+/.test(em)) { document.getElementById('eEmailErr').textContent = 'Invalid email.'; ok=false; }
  if (!ok) return;

  const fd = new FormData();
  fd.append('action','update_profile');
  fd.append('firstName', fn);
  fd.append('lastName',  ln);
  fd.append('email',     em);
  fd.append('phone',     document.getElementById('ePhone').value.trim());
  fd.append('city',      document.getElementById('eCity').value.trim());
  fd.append('province',  document.getElementById('eProvince').value.trim());

  fetch('update_profile.php',{method:'POST',body:fd})
    .then(r=>r.json())
    .then(d=>{ if(d.success){toast('Profile updated!','ok');closeAll();setTimeout(()=>location.reload(),1000);}else toast(d.message||'Update failed.','err'); })
    .catch(()=>toast('Server error.','err'));
}

/* ── SAVE PASSWORD ─────────────── */
function savePwd() {
  const cur  = document.getElementById('pCur').value;
  const nw   = document.getElementById('pNew').value;
  const conf = document.getElementById('pConf').value;
  document.getElementById('pCurErr').textContent = '';
  document.getElementById('pNewErr').textContent = '';
  document.getElementById('pConfErr').textContent = '';

  let ok=true;
  if (!cur)        { document.getElementById('pCurErr').textContent='Required.'; ok=false; }
  if (nw.length<8) { document.getElementById('pNewErr').textContent='Min 8 characters.'; ok=false; }
  if (nw!==conf)   { document.getElementById('pConfErr').textContent='Passwords do not match.'; ok=false; }
  if (!ok) return;

  const fd=new FormData();
  fd.append('action','change_password');
  fd.append('current',cur); fd.append('new',nw);

  fetch('update_profile.php',{method:'POST',body:fd})
    .then(r=>r.json())
    .then(d=>{ if(d.success){toast('Password changed!','ok');closeAll();}else toast(d.message||'Failed.','err'); })
    .catch(()=>toast('Server error.','err'));
}

/* ── TOAST ─────────────────────── */
function toast(msg,type='ok'){
  const icons={
    ok:`<svg width="14" height="14" fill="none" stroke="#5aaa30" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
    err:`<svg width="14" height="14" fill="none" stroke="#d04040" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.innerHTML=`${icons[type]||icons.ok}<span>${msg}</span>`;
  document.getElementById('toastBox').appendChild(el);
  setTimeout(()=>el.remove(),3200);
}
</script>
</body>
</html>