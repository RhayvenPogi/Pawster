<?php
session_start();
$activePage  = 'missing';
$loggedIn    = isset($_SESSION['user_id']);
$isAdminNav  = $loggedIn && ($_SESSION['role'] ?? '') === 'admin';
$isAdmin     = $isAdminNav; // alias so dashboard include works
$navFirst    = htmlspecialchars($_SESSION['first_name'] ?? '');
$navInit     = strtoupper(substr($_SESSION['first_name'] ?? 'U', 0, 1) . substr($_SESSION['last_name'] ?? '', 0, 1));
$navEmail    = htmlspecialchars($_SESSION['email'] ?? '');
$initials    = $navInit;
$loggedInNav = $loggedIn;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pawster — Missing Animals</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/pawster_pages.css"/>
  <link rel="stylesheet" href="../css/missing.css"/>
  <?php if ($loggedIn && !$isAdminNav): ?>
  <link rel="stylesheet" href="../css/user_dashboard.css"/>
  <?php endif; ?>
  <style>
    body, body * {
      opacity: 1 !important;
      transform: none !important;
      visibility: visible !important;
    }
    .post-img-wrap img       { transition: transform 0.35s !important; }
    .pact-btn, .fpill,
    .btn-post, .btn-o        { transition: all 0.2s !important; }
    .mover                   { transition: none !important; }
    @keyframes spin          { to { transform: rotate(360deg) !important; } }

    .missing-hero {
      position: relative; z-index: 10;
      background: linear-gradient(135deg, var(--green-mid), #2a6010);
      padding: 4rem 2rem 3.5rem; text-align: center;
    }
    .missing-hero .sec-tag {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(255,255,255,0.18); color: #fff;
      border: 1px solid rgba(255,255,255,0.3); border-radius: 50px;
      padding: 0.26rem 0.85rem; font-size: 0.68rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 1rem;
    }
    .missing-hero h1 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2rem, 4.5vw, 3.5rem);
      font-weight: 900; color: #fff; line-height: 1.05; margin-bottom: 0.9rem;
    }
    .missing-hero h1 span { color: rgba(255,220,140,1); }
    .missing-hero p {
      color: rgba(255,255,255,0.85); font-size: 1rem; font-weight: 700;
      max-width: 560px; margin: 0 auto 2rem; line-height: 1.65;
    }
    .hero-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn-post {
      display: inline-flex; align-items: center; gap: 0.55rem;
      background: #fff; color: var(--green-mid); border: none;
      padding: 0.85rem 2rem; border-radius: 50px; font-weight: 900;
      font-size: 0.95rem; cursor: pointer; font-family: 'Nunito', sans-serif;
      box-shadow: 0 6px 24px rgba(0,0,0,0.18);
    }
    .btn-post:hover { background: var(--cream); transform: translateY(-3px) !important; }
    .btn-o {
      display: inline-flex; align-items: center; gap: 0.55rem;
      padding: 0.85rem 2rem; border-radius: 50px; font-weight: 800;
      font-size: 0.95rem; cursor: pointer; font-family: 'Nunito', sans-serif;
    }
    .btn-o:hover { background: rgba(255,255,255,0.25) !important; transform: translateY(-3px) !important; }

    .missing-strip { position: relative; z-index: 10; background: rgba(26,74,8,0.95); padding: 1.2rem 2rem; }
    .missing-strip-in { max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 3rem; flex-wrap: wrap; }
    .mstrip-stat { text-align: center; }
    .mstrip-val { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: #fff; line-height: 1; }
    .mstrip-lbl { font-size: 0.68rem; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.07em; margin-top: 0.3rem; }
    .mstrip-div { width: 1px; height: 40px; background: rgba(255,255,255,0.2); }

    .missing-fbar { position: sticky; top: var(--nav-h); z-index: 100; background: rgba(255,252,240,0.97); backdrop-filter: blur(14px); border-bottom: 1.5px solid var(--border); padding: 1rem 2rem; }
    .missing-fbar-inner { max-width: 1100px; margin: 0 auto; display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap; }
    .filter-pills { display: flex; gap: 6px; }
    .fpill { padding: 0.45rem 1.1rem; border-radius: 50px; border: 1.5px solid var(--border); background: rgba(255,248,220,0.8); font-size: 0.8rem; font-weight: 700; color: var(--text-mid); cursor: pointer; font-family: 'Nunito', sans-serif; }
    .fpill:hover, .fpill.active { background: var(--green-mid); color: #fff; border-color: var(--green-mid); }
    .fpill.orange:hover, .fpill.orange.active { background: var(--c2); border-color: var(--c2); color: #fff; }
    .sw { display: flex; align-items: center; gap: 0.6rem; background: rgba(255,250,232,0.8); border: 1.5px solid var(--border); border-radius: 10px; padding: 0 0.9rem; }
    .sw i { color: var(--text-muted); font-size: 0.85rem; flex-shrink: 0; }
    .sw input { flex: 1; border: none; background: transparent; padding: 0.6rem 0; font-family: 'Nunito', sans-serif; font-size: 0.86rem; font-weight: 600; color: var(--text); outline: none; }
    .fsel { background: rgba(255,250,232,0.8); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.6rem 0.9rem; font-family: 'Nunito', sans-serif; font-size: 0.84rem; font-weight: 600; color: var(--text); outline: none; cursor: pointer; }

    .missing-layout { position: relative; z-index: 10; max-width: 1100px; margin: 0 auto; padding: 2rem 2rem 5rem; display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; }
    .feed { display: flex; flex-direction: column; gap: 1.2rem; }

    .missing-sidebar { display: flex; flex-direction: column; gap: 1.2rem; }
    .sidebar-card { background: rgba(255,252,235,0.95); backdrop-filter: blur(14px); border-radius: var(--radius); border: 1.5px solid var(--border); overflow: hidden; box-shadow: var(--shadow); }
    .sidebar-card-head { padding: 1rem 1.2rem 0.75rem; border-bottom: 1.5px solid var(--border); font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 800; color: var(--green-dark); display: flex; align-items: center; gap: 0.6rem; }
    .sidebar-card-head i { color: var(--c1); }
    .sidebar-card-body { padding: 1rem 1.2rem; }
    .tip-item { display: flex; gap: 10px; margin-bottom: 0.9rem; align-items: flex-start; }
    .tip-item:last-child { margin-bottom: 0; }
    .tip-num { width: 24px; height: 24px; border-radius: 50%; background: rgba(88,139,65,0.12); color: var(--c1); font-size: 0.72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .tip-text { font-size: 0.82rem; color: var(--text-mid); line-height: 1.55; font-weight: 700; }
    .recent-found-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1.5px solid var(--border); }
    .recent-found-item:last-child { border-bottom: none; padding-bottom: 0; }
    .rfi-emoji { width: 44px; height: 44px; border-radius: 10px; background: rgba(88,139,65,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
    .rfi-name { font-weight: 800; font-size: 0.84rem; color: var(--green-dark); }
    .rfi-loc { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; }
    .rfi-badge { margin-left: auto; background: rgba(88,139,65,0.12); color: var(--c1); font-size: 0.65rem; font-weight: 800; padding: 3px 9px; border-radius: 50px; }
    .btn-p { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--green-mid); color: #fff; border: none; padding: 0.65rem 1.2rem; border-radius: 10px; font-size: 0.84rem; font-weight: 800; cursor: pointer; font-family: 'Nunito', sans-serif; box-shadow: 0 3px 12px rgba(28,79,9,0.28); }
    .btn-p:hover { background: #143806; }

    .post-card { background: rgba(255,252,235,0.95); backdrop-filter: blur(14px); border-radius: var(--radius); border: 1.5px solid var(--border); overflow: hidden; box-shadow: var(--shadow); }
    .post-card:hover { box-shadow: var(--shadow-lg); border-color: var(--border-strong); }
    .post-head { display: flex; align-items: center; gap: 12px; padding: 1rem 1.2rem 0.75rem; }
    .post-avatar { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--green-mid), var(--green-dark)); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; }
    .post-meta { flex: 1; min-width: 0; }
    .post-poster { font-weight: 800; font-size: 0.88rem; color: var(--green-dark); }
    .post-time { font-size: 0.72rem; color: var(--text-muted); margin-top: 1px; display: flex; align-items: center; gap: 4px; }
    .post-status-badge { padding: 4px 12px; border-radius: 50px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; flex-shrink: 0; }
    .status-missing { background: rgba(180,90,34,0.12); color: var(--c2); border: 1.5px solid rgba(180,90,34,0.28); }
    .status-found   { background: rgba(88,139,65,0.12); color: var(--c1); border: 1.5px solid rgba(88,139,65,0.28); }
    .post-img-wrap { position: relative; max-height: 380px; overflow: hidden; background: rgba(255,248,220,0.6); }
    .post-img-wrap img { width: 100%; max-height: 380px; object-fit: cover; display: block; }
    .post-card:hover .post-img-wrap img { transform: scale(1.02) !important; }
    .post-img-wrap.no-img { height: 90px; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; }
    .post-img-label { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.55); color: #fff; padding: 3px 10px; border-radius: 50px; font-size: 0.68rem; font-weight: 700; }
    .post-body { padding: 1rem 1.2rem 0; }
    .post-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 800; color: var(--green-dark); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .type-chip { background: rgba(88,139,65,0.12); color: var(--c1); border-radius: 50px; padding: 2px 10px; font-size: 0.65rem; font-weight: 800; font-family: 'Nunito', sans-serif; }
    .post-detail-row { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 0.7rem; }
    .post-detail-item { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: var(--text-muted); font-weight: 700; }
    .post-detail-item i { color: var(--c1); font-size: 0.7rem; }
    .post-desc { font-size: 0.88rem; color: var(--text-mid); line-height: 1.65; margin-bottom: 0.75rem; font-weight: 600; }
    .post-desc.clamped { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .read-more-btn { background: none; border: none; color: var(--c1); font-size: 0.78rem; font-weight: 800; cursor: pointer; font-family: 'Nunito', sans-serif; padding: 0; margin-bottom: 0.75rem; display: block; }
    .post-actions { display: flex; align-items: center; gap: 4px; padding: 0.6rem 1.2rem; border-top: 1.5px solid var(--border); flex-wrap: wrap; }
    .pact-btn { display: flex; align-items: center; gap: 6px; padding: 0.45rem 0.9rem; border-radius: 50px; border: none; background: none; font-size: 0.82rem; font-weight: 700; color: var(--text-muted); cursor: pointer; font-family: 'Nunito', sans-serif; }
    .pact-btn:hover { background: rgba(90,170,48,0.1); color: var(--green-dark); }
    .pact-btn.liked, .pact-btn.liked i { color: var(--c2); }
    .pact-found { margin-left: auto; padding: 0.45rem 0.9rem; border-radius: 50px; border: 1.5px solid rgba(88,139,65,0.3); background: rgba(88,139,65,0.06); color: var(--c1); font-size: 0.78rem; font-weight: 700; cursor: pointer; font-family: 'Nunito', sans-serif; }
    .pact-found:hover { background: var(--c1); color: #fff; border-color: var(--c1); }
    .pact-found.found-done { background: var(--c1); color: #fff; border-color: var(--c1); cursor: default; }
    .pact-delete { padding: 0.45rem 0.9rem; border-radius: 50px; border: 1.5px solid rgba(220,50,50,0.25); background: rgba(220,50,50,0.05); color: #c03030; font-size: 0.78rem; font-weight: 700; cursor: pointer; font-family: 'Nunito', sans-serif; }
    .pact-delete:hover { background: #c03030; color: #fff; border-color: #c03030; }

    .comments-section { display: none; padding: 0 1.2rem 1rem; }
    .comments-section.open { display: block; }
    .comments-divider { height: 1.5px; background: var(--border); margin-bottom: 0.9rem; }
    .comment-item { display: flex; gap: 10px; margin-bottom: 0.9rem; }
    .comment-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--c2), #8a3010); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.72rem; font-weight: 700; }
    .comment-bubble { background: rgba(255,248,220,0.8); border-radius: 0 12px 12px 12px; padding: 0.6rem 0.85rem; flex: 1; }
    .comment-name { font-size: 0.78rem; font-weight: 800; color: var(--green-dark); }
    .comment-text { font-size: 0.84rem; color: var(--text-mid); margin-top: 2px; line-height: 1.5; font-weight: 600; }
    .comment-time { font-size: 0.65rem; color: var(--text-muted); margin-top: 4px; }
    .comment-input-row { display: flex; gap: 9px; align-items: center; margin-top: 0.7rem; }
    .comment-input { flex: 1; padding: 0.6rem 1rem; border: 1.5px solid var(--border); border-radius: 50px; font-size: 0.84rem; font-family: 'Nunito', sans-serif; background: rgba(255,248,220,0.7); font-weight: 600; outline: none; }
    .comment-input:focus { border-color: var(--green-border); background: #fff; }
    .comment-send { width: 36px; height: 36px; border-radius: 50%; background: var(--green-mid); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; }
    .comment-send:hover { background: var(--green-dark); }
    .no-comments { text-align: center; padding: 0.8rem; color: var(--text-muted); font-size: 0.82rem; }
    .login-to-comment { text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem 0; font-weight: 700; }
    .login-to-comment a { color: var(--c1); }

    .load-more-wrap { text-align: center; }
    .load-more-btn { background: rgba(255,248,220,0.8); border: 1.5px solid var(--border); color: var(--text-mid); padding: 0.7rem 2rem; border-radius: 50px; font-size: 0.88rem; font-weight: 700; cursor: pointer; font-family: 'Nunito', sans-serif; }
    .load-more-btn:hover { background: var(--green-mid); color: #fff; border-color: var(--green-mid); }
    .feed-empty { background: rgba(255,252,235,0.95); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 4rem 2rem; text-align: center; color: var(--text-muted); }
    .feed-empty i { font-size: 3rem; margin-bottom: 1rem; display: block; }
    .feed-empty p { font-size: 0.95rem; font-weight: 700; line-height: 1.6; }
    .feed-empty a { color: var(--c1); }
    .feed-loading { text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.9rem; font-weight: 700; }
    .feed-loading i { font-size: 1.5rem; animation: spin 0.8s linear infinite !important; margin-right: 0.5rem; }
    @keyframes spin { to { transform: rotate(360deg) !important; } }

    .mover { display: none; position: fixed; inset: 0; z-index: 10000; background: rgba(180,140,60,0.22); backdrop-filter: blur(8px); align-items: center; justify-content: center; padding: 1.5rem; }
    .mover.open { display: flex; }
    .mbox { background: rgba(255,252,235,0.98); border: 1.5px solid var(--border-strong); border-radius: 18px; width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); overflow: hidden; }
    .mhead { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.4rem; border-bottom: 1.5px solid var(--border); background: rgba(255,248,210,0.88); flex-shrink: 0; }
    .mhead h2 { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 800; color: var(--green-dark); display: flex; align-items: center; }
    .mcls { background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer; line-height: 1; padding: 0 4px; }
    .mcls:hover { color: var(--red); }
    .mbody { overflow-y: auto; padding: 1.4rem; flex: 1; }
    .fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .fg { display: flex; flex-direction: column; gap: 5px; }
    .fg.full { grid-column: 1 / -1; }
    .fg label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }
    .fg input, .fg select, .fg textarea { background: rgba(255,250,232,0.7); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.65rem 0.9rem; font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 600; color: var(--text); outline: none; }
    .fg input:focus, .fg select:focus, .fg textarea:focus { border-color: var(--green-border); box-shadow: 0 0 0 3px rgba(90,170,48,0.12); }
    .fg textarea { resize: vertical; min-height: 90px; }
    .sbm { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1.8rem; border-radius: 12px; font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 900; border: none; cursor: pointer; width: 100%; justify-content: center; }
    .sbm.org { background: var(--c2); color: #fff; box-shadow: 0 5px 20px rgba(180,90,34,0.28); }
    .sbm.org:hover { background: #8a3010; }
    .photo-upload-label { display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 2rem 1rem; border: 2px dashed var(--green-border); border-radius: 10px; cursor: pointer; color: var(--green-mid); font-size: 0.84rem; font-weight: 700; background: rgba(88,139,65,0.04); position: relative; }
    .photo-upload-label input { position: absolute; inset: 0; opacity: 0 !important; cursor: pointer; width: 100%; }
    .photo-preview-wrap { margin-top: 0.8rem; border-radius: 10px; overflow: hidden; position: relative; display: none; }
    .photo-preview-wrap img { width: 100%; max-height: 200px; object-fit: cover; display: block; }
    .photo-remove { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.55); color: #fff; border: none; border-radius: 50%; width: 26px; height: 26px; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    footer { position: relative; z-index: 10; background: rgba(26,74,8,0.95); color: #fff; padding: 3rem 2rem 1.5rem; margin-top: 4rem; }
    .foot-in { max-width: 1100px; margin: 0 auto; }
    .foot-top { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3rem; margin-bottom: 2rem; }
    .foot-logo { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.7rem; }
    .foot-logo i { color: var(--green-border); }
    .foot-brand p { font-size: 0.82rem; color: rgba(255,255,255,0.6); line-height: 1.7; max-width: 260px; margin-bottom: 1rem; }
    .srow { display: flex; gap: 0.6rem; }
    .sbtn { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7); font-size: 0.8rem; text-decoration: none; }
    .sbtn:hover { background: rgba(255,255,255,0.2); color: #fff; }
    .foot-col h4 { font-size: 0.72rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.09em; color: var(--green-border); margin-bottom: 1rem; }
    .foot-col ul { list-style: none; }
    .foot-col ul li a { display: block; font-size: 0.83rem; font-weight: 700; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 0.5rem; }
    .foot-col ul li a:hover { color: #fff; }
    .foot-bot { padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; font-size: 0.75rem; color: rgba(255,255,255,0.45); }

    @media(max-width:900px) { .missing-layout { grid-template-columns: 1fr; } .missing-sidebar { display: none; } .foot-top { grid-template-columns: 1fr 1fr; } }
    @media(max-width:600px) { .missing-layout { padding: 1.5rem 1.2rem 4rem; } .missing-hero { padding: 3rem 1.2rem 2.5rem; } .fgrid { grid-template-columns: 1fr; } .foot-top { grid-template-columns: 1fr; } }
  </style>
</head>
<body>

<div class="mesh-bg">
  <div class="mesh-base"></div>
  <div class="orb orb-1"></div><div class="orb orb-2"></div>
  <div class="orb orb-3"></div><div class="orb orb-4"></div>
  <div class="mesh-grid"></div><div class="grain"></div><div class="vignette"></div>
</div>

<div id="toast-w"></div>

<?php require_once 'nav.php'; ?>

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
      <button class="btn-post" onclick="window.location.href='login.php'">
        <i class="fas fa-sign-in-alt"></i> Log In to Post
      </button>
    <?php endif; ?>
    <button class="btn-o" style="border-color:rgba(255,255,255,0.5);color:#fff;background:rgba(255,255,255,0.12)"
            onclick="document.querySelector('.missing-layout').scrollIntoView({behavior:'smooth'})">
      <i class="fas fa-list"></i> Browse Reports
    </button>
  </div>
</div>

<div class="missing-strip">
  <div class="missing-strip-in">
    <div class="mstrip-stat"><div class="mstrip-val" id="stat-total">—</div><div class="mstrip-lbl">Total Reports</div></div>
    <div class="mstrip-div"></div>
    <div class="mstrip-stat"><div class="mstrip-val" id="stat-missing">—</div><div class="mstrip-lbl">Still Missing</div></div>
    <div class="mstrip-div"></div>
    <div class="mstrip-stat"><div class="mstrip-val" id="stat-found">—</div><div class="mstrip-lbl">Reunited</div></div>
  </div>
</div>

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

<div class="missing-layout">
  <div>
    <div class="feed" id="feed">
      <div class="feed-loading"><i class="fas fa-spinner"></i> Loading reports…</div>
    </div>
    <div class="load-more-wrap" id="load-more-wrap" style="display:none;margin-top:16px">
      <button class="load-more-btn" onclick="loadMore()"><i class="fas fa-arrow-down"></i> Load More</button>
    </div>
  </div>

  <aside class="missing-sidebar">
    <div class="sidebar-card">
      <div class="sidebar-card-head"><i class="fas fa-lightbulb"></i> Tips for Finding Lost Pets</div>
      <div class="sidebar-card-body">
        <div class="tip-item"><div class="tip-num">1</div><div class="tip-text">Search within a 3–5 block radius immediately. Lost pets often hide nearby.</div></div>
        <div class="tip-item"><div class="tip-num">2</div><div class="tip-text">Post on barangay Facebook groups and Pawster's feed with a clear photo.</div></div>
        <div class="tip-item"><div class="tip-num">3</div><div class="tip-text">Place used clothing near your door — your scent can guide them home.</div></div>
        <div class="tip-item"><div class="tip-num">4</div><div class="tip-text">Contact local vets and animal shelters with a description and photo.</div></div>
        <div class="tip-item"><div class="tip-num">5</div><div class="tip-text">Check at dusk and dawn — animals are more active and less afraid then.</div></div>
      </div>
    </div>
    <div class="sidebar-card">
      <div class="sidebar-card-head"><i class="fas fa-heart"></i> Recently Reunited</div>
      <div class="sidebar-card-body" id="recently-found">
        <div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">
          <i class="fas fa-spinner" style="animation:spin .8s linear infinite !important;font-size:18px;margin-bottom:8px;display:block"></i>Loading…
        </div>
      </div>
    </div>
    <?php if ($loggedIn): ?>
    <div class="sidebar-card">
      <div class="sidebar-card-body" style="text-align:center;padding:22px 18px">
        <div style="font-size:36px;margin-bottom:12px">🐾</div>
        <h3 style="font-family:'Playfair Display',serif;font-size:17px;margin-bottom:8px;color:var(--green-dark)">Missing a Pet?</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;line-height:1.55">Post a report and let the community help find your furry friend.</p>
        <button class="btn-p" style="width:100%;justify-content:center" onclick="openModal('post-modal')">
          <i class="fas fa-plus"></i> Post Report
        </button>
      </div>
    </div>
    <?php endif; ?>
  </aside>
</div>

<div class="mover" id="post-modal">
  <div class="mbox">
    <div class="mhead">
      <h2><i class="fas fa-exclamation-circle" style="color:var(--c2);margin-right:8px;font-size:20px"></i>Report Missing Pet</h2>
      <button class="mcls" onclick="closeModal('post-modal')">&times;</button>
    </div>
    <div class="mbody">
      <form id="post-form" onsubmit="submitPost(event)">
        <div class="fgrid">
          <div class="fg"><label>Pet Name *</label><input type="text" id="pf-name" required placeholder="e.g. Max"/></div>
          <div class="fg"><label>Animal Type *</label>
            <select id="pf-type" required>
              <option value="Dog">Dog</option><option value="Cat">Cat</option>
              <option value="Bird">Bird</option><option value="Rabbit">Rabbit</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="fg"><label>Breed</label><input type="text" id="pf-breed" placeholder="e.g. Labrador"/></div>
          <div class="fg"><label>Color / Markings</label><input type="text" id="pf-color" placeholder="e.g. Brown with white patch"/></div>
          <div class="fg full"><label>Last Seen Location *</label><input type="text" id="pf-location" required placeholder="e.g. Near SM Laoag, Ilocos Norte"/></div>
          <div class="fg full"><label>Description *</label><textarea id="pf-desc" required placeholder="Describe your pet, when they went missing, any distinctive features…" style="min-height:90px"></textarea></div>
          <div class="fg full"><label>Contact Number / Info *</label><input type="text" id="pf-contact" required placeholder="e.g. 09XX-XXX-XXXX"/></div>
          <div class="fg full">
            <label>Upload Photo <span style="color:var(--text-muted);font-weight:400">(recommended)</span></label>
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
          <li><a href="index.php">Home</a></li>
          <li><a href="find_a_pet.php">Browse Animals</a></li>
          <li><a href="missing.php">Missing Pets</a></li>
          <li><a href="about.php">Contact Us</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>Actions</h4>
        <ul>
          <li><a href="find_a_pet.php">Apply to Adopt</a></li>
          <li><a href="rehome.php">Rehome a Pet</a></li>
          <li><a href="missing.php">Report Missing Pet</a></li>
          <?php if ($loggedIn): ?>
            <li>
              <?php if ($isAdminNav): ?>
                <a href="admin_dashboard.php">My Dashboard</a>
              <?php else: ?>
                <a href="#" onclick="openDashboard();return false;">My Dashboard</a>
              <?php endif; ?>
            </li>
          <?php endif; ?>
        </ul>
      </div>
    </div>
    <div class="foot-bot">
      &copy; 2025 Pawster. All rights reserved. Made with <i class="fas fa-heart" style="color:#ef4444"></i> for every animal.
    </div>
  </div>
</footer>

<script>
  const LOGGED_IN = <?= $loggedIn ? 'true' : 'false' ?>;
  const USER_INIT = <?= json_encode($initials) ?>;
</script>
<script src="../js/missing.js"></script>

<?php if ($loggedIn && !$isAdminNav) { include 'user_dashboard.php'; } ?>
</body>
</html>