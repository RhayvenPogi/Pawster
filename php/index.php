<?php
/* =============================================
   PAWSTER — HOMEPAGE
   php/index.php
   ============================================= */
session_start();
$loggedIn  = isset($_SESSION['user_id']);
$isAdmin   = $loggedIn && ($_SESSION['role'] ?? '') === 'admin';
$firstName = '';
$initials  = '';
if ($loggedIn) {
    $firstName = htmlspecialchars($_SESSION['first_name'] ?? 'User');
    $lastName  = htmlspecialchars($_SESSION['last_name']  ?? '');
    $initials  = strtoupper(substr($_SESSION['first_name'] ?? 'U', 0, 1) . substr($_SESSION['last_name'] ?? '', 0, 1));
}
$email = htmlspecialchars($_SESSION['email'] ?? '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pawster — Find Your Forever Friend</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/index.css"/>
  <?php if ($loggedIn && !$isAdmin): ?>
  <link rel="stylesheet" href="../css/user_dashboard.css"/>
  <?php endif; ?>
  <style>
  .hero-right{flex-shrink:0;width:380px;animation:heroCardIn 0.9s cubic-bezier(.22,.68,0,1.1) 0.35s both;}
  @keyframes heroCardIn{from{opacity:0;transform:translateY(32px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)}}
  .hero-pet-card{position:relative;width:100%;height:520px;border-radius:28px;overflow:hidden;background:#12100a;box-shadow:0 24px 64px rgba(40,20,5,.40),0 8px 24px rgba(40,20,5,.22),0 0 0 1.5px rgba(255,220,100,.12) inset;cursor:pointer;animation:cardFloat 6s ease-in-out infinite;transition:transform 0.55s cubic-bezier(.22,.68,0,1.15),box-shadow 0.55s ease;}
  @keyframes cardFloat{0%,100%{transform:translateY(0px) rotate(0deg)}33%{transform:translateY(-8px) rotate(0.4deg)}66%{transform:translateY(-4px) rotate(-0.3deg)}}
  .hero-pet-card:hover{animation-play-state:paused;transform:translateY(-12px) scale(1.025) rotate(0deg);box-shadow:0 40px 80px rgba(40,20,5,.50),0 12px 32px rgba(40,20,5,.28),0 0 0 1.5px rgba(255,220,100,.22) inset;}
  .hpc-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;transition:opacity 0.7s cubic-bezier(.4,0,.2,1),transform 0.7s cubic-bezier(.4,0,.2,1);transform:scale(1.0);}
  .hero-pet-card:hover .hpc-photo{opacity:0;transform:scale(1.06);}
  .hpc-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;opacity:0;transition:opacity 0.7s cubic-bezier(.4,0,.2,1);}
  .hero-pet-card:hover .hpc-video{opacity:1;}
  .hpc-scrim{position:absolute;inset:0;z-index:3;background:linear-gradient(to top,rgba(8,5,1,.88) 0%,rgba(8,5,1,.30) 45%,transparent 70%);pointer-events:none;}
  .hpc-dots{position:absolute;top:18px;right:18px;z-index:8;display:flex;gap:6px;align-items:center;}
  .hpc-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.35);border:1.5px solid rgba(255,255,255,.25);cursor:pointer;transition:background 0.25s,transform 0.25s,width 0.35s cubic-bezier(.22,.68,0,1.3);}
  .hpc-dot.active{background:#fff;border-color:#fff;width:22px;border-radius:4px;}
  .hpc-live{position:absolute;top:18px;left:18px;z-index:8;display:flex;align-items:center;gap:6px;background:rgba(10,6,2,.55);backdrop-filter:blur(10px);border:1px solid rgba(255,220,80,.20);border-radius:20px;padding:4px 11px 4px 7px;font-size:.58rem;font-weight:800;color:rgba(255,235,150,.90);text-transform:uppercase;letter-spacing:.07em;opacity:0;transform:translateX(-6px);transition:opacity 0.4s ease 0.15s,transform 0.4s ease 0.15s;pointer-events:none;}
  .hpc-live-dot{width:6px;height:6px;border-radius:50%;background:#ff5050;box-shadow:0 0 8px #ff3030;animation:livePulse 1.5s ease infinite;flex-shrink:0;}
  @keyframes livePulse{0%,100%{box-shadow:0 0 6px #ff3030;opacity:1}50%{box-shadow:0 0 14px #ff2020;opacity:.7}}
  .hero-pet-card:hover .hpc-live{opacity:1;transform:translateX(0);}
  .hpc-info{position:absolute;bottom:0;left:0;right:0;z-index:5;padding:0 22px 22px;}
  .hpc-species{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.10);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:3px 10px;font-size:.60rem;font-weight:800;color:rgba(255,240,190,.80);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;transform:translateY(6px);opacity:.85;transition:transform 0.45s cubic-bezier(.22,.68,0,1.15),opacity 0.45s ease;}
  .hero-pet-card:hover .hpc-species{transform:translateY(0);opacity:1;}
  .hpc-name{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:900;color:#fff;line-height:1.1;letter-spacing:-.5px;text-shadow:0 2px 16px rgba(0,0,0,.5);transform:translateY(4px);transition:transform 0.45s cubic-bezier(.22,.68,0,1.15) 0.05s;}
  .hero-pet-card:hover .hpc-name{transform:translateY(0);}
  .hpc-breed{font-size:.75rem;font-weight:700;color:rgba(255,230,160,.60);font-family:'DM Mono',monospace;margin-top:4px;transform:translateY(4px);transition:transform 0.45s cubic-bezier(.22,.68,0,1.15) 0.08s;}
  .hero-pet-card:hover .hpc-breed{transform:translateY(0);}
  .hpc-badge{margin-top:12px;display:inline-flex;align-items:center;gap:6px;padding:5px 12px 5px 8px;border-radius:20px;font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;background:rgba(70,190,30,.18);color:#9de860;border:1px solid rgba(80,200,30,.32);transform:translateY(8px);opacity:0;transition:transform 0.45s cubic-bezier(.22,.68,0,1.15) 0.12s,opacity 0.35s ease 0.12s;}
  .hpc-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:#6cde28;box-shadow:0 0 7px #6cde28;flex-shrink:0;animation:dotPulse 2s ease infinite;}
  .hpc-badge.pending{background:rgba(180,90,30,.18);color:#f0a060;border-color:rgba(200,100,25,.30);}
  .hpc-badge.pending::before{background:#e07820;box-shadow:0 0 7px #e07820;}
  .hero-pet-card:hover .hpc-badge{opacity:1;transform:translateY(0);}
  .hpc-cta{position:absolute;bottom:22px;right:22px;z-index:6;display:inline-flex;align-items:center;gap:7px;background:#fff;color:#15100a;font-family:'Nunito',sans-serif;font-size:.78rem;font-weight:900;padding:9px 16px;border-radius:50px;text-decoration:none;letter-spacing:.02em;box-shadow:0 4px 20px rgba(0,0,0,.35);transform:translateY(14px);opacity:0;transition:transform 0.50s cubic-bezier(.22,.68,0,1.25) 0.10s,opacity 0.35s ease 0.10s,background 0.2s,color 0.2s;}
  .hpc-cta:hover{background:#6cde28;color:#0a1a04;}
  .hero-pet-card:hover .hpc-cta{opacity:1;transform:translateY(0);}
  .fp-card{border-radius:20px;overflow:hidden;border:1.5px solid var(--border);box-shadow:var(--shadow);background:var(--surface);transition:transform 0.38s cubic-bezier(.22,.68,0,1.2),box-shadow 0.38s ease,border-color 0.25s;cursor:pointer;}
  .fp-card:hover{transform:translateY(-7px);box-shadow:var(--shadow-lg);border-color:rgba(90,170,48,.55);}
  .fp-img{height:185px;overflow:hidden;display:block;position:relative;background:#2a1e0a;border-bottom:1.5px solid var(--border);}
  .fp-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.55s cubic-bezier(.22,.68,0,1.15);}
  .fp-card:hover .fp-img img{transform:scale(1.08);}
  .fp-species{position:absolute;top:10px;left:10px;z-index:2;background:rgba(10,6,2,.55);backdrop-filter:blur(8px);color:#f0e0b0;font-size:.60rem;font-weight:800;padding:3px 9px;border-radius:20px;border:1px solid rgba(255,220,120,.20);text-transform:uppercase;letter-spacing:.05em;}
  .fp-avail{position:absolute;top:10px;right:10px;z-index:2;background:rgba(10,6,2,.55);backdrop-filter:blur(8px);color:#9de860;font-size:.58rem;font-weight:800;padding:3px 8px 3px 6px;border-radius:20px;border:1px solid rgba(90,200,40,.22);display:inline-flex;align-items:center;gap:4px;text-transform:uppercase;letter-spacing:.05em;}
  .fp-avail::before{content:'';width:5px;height:5px;border-radius:50%;background:#6cde28;box-shadow:0 0 5px #6cde28;display:inline-block;flex-shrink:0;}
  </style>
</head>
<body>

<div class="mesh-bg">
  <div class="mesh-base"></div>
  <div class="orb orb-1"></div><div class="orb orb-2"></div>
  <div class="orb orb-3"></div><div class="orb orb-4"></div>
  <div class="mesh-grid"></div><div class="grain"></div><div class="vignette"></div>
</div>

<!-- NAVBAR -->
<nav class="navbar">
  <a class="nav-brand" href="index.php">
    <img src="../images/logo.png" alt="Pawster"/>
    <span class="nav-brand-text">Paw<em>ster</em></span>
  </a>
  <div class="nav-links">
    <a class="nav-link active" href="index.php"><i class="fas fa-house"></i> Home</a>
    <a class="nav-link" href="find_a_pet.php"><i class="fas fa-search"></i> Find a Pet</a>
    <a class="nav-link" href="how_it_works.php"><i class="fas fa-info-circle"></i> How It Works</a>
    <a class="nav-link" href="rehome.php"><i class="fas fa-home"></i> Rehome</a>
    <a class="nav-link missing-link" href="missing.php"><i class="fas fa-search-location"></i> Missing Pets</a>
    <a class="nav-link" href="about.php"><i class="fas fa-paw"></i> About</a>
  </div>
  <div class="nav-right">
    <?php if ($loggedIn): ?>
      <div class="nav-avatar-btn" id="avatarBtn">
        <div class="nav-avatar"><?= $initials ?></div>
        <div>
          <div class="nav-avatar-name"><?= $firstName ?></div>
          <div class="nav-avatar-role"><?= $isAdmin ? 'Admin' : 'Member' ?></div>
        </div>
        <i class="fas fa-chevron-down nav-caret"></i>
        <div class="profile-drop" id="profileDrop">
          <div class="pd-user">
            <div class="pd-avatar"><?= $initials ?></div>
            <div><strong><?= $firstName ?></strong><span><?= $email ?></span></div>
          </div>
          <div class="pd-divider"></div>
          <?php if ($isAdmin): ?>
            <a class="pd-item" href="admin_dashboard.php"><i class="fas fa-th-large"></i>My Dashboard</a>
          <?php else: ?>
            <a class="pd-item" href="#" onclick="openDashboard();return false;"><i class="fas fa-th-large"></i>My Dashboard</a>
          <?php endif; ?>
          <a class="pd-item" href="missing.php"><i class="fas fa-search-location"></i>Missing Pets</a>
          <?php if ($isAdmin): ?>
            <a class="pd-item" href="admin_dashboard.php"><i class="fas fa-shield-alt"></i>Admin Panel</a>
          <?php endif; ?>
          <div class="pd-divider"></div>
          <a class="pd-item danger" href="logout.php"><i class="fas fa-sign-out-alt"></i>Log Out</a>
        </div>
      </div>
      <a class="nav-logout" href="logout.php"><i class="fas fa-sign-out-alt"></i> Log Out</a>
    <?php else: ?>
      <a class="nav-btn nav-btn-ghost" href="login.php"><i class="fas fa-sign-in-alt"></i> Log In</a>
      <a class="nav-btn nav-btn-solid" href="register.php"><i class="fas fa-paw"></i> Get Started</a>
    <?php endif; ?>
  </div>
</nav>

<?php if ($loggedIn): ?>
<div class="welcome-banner">
  <div class="wb-left">
    <span class="wb-paw">🐾</span>
    <span class="wb-text">Welcome back, <em><?= $firstName ?></em>! Ready to find a new friend today?</span>
  </div>
  <div class="wb-actions">
    <?php if ($isAdmin): ?>
      <a class="wb-btn" href="admin_dashboard.php"><i class="fas fa-th-large"></i> Dashboard</a>
    <?php else: ?>
      <a class="wb-btn" href="#" onclick="openDashboard();return false;"><i class="fas fa-th-large"></i> Dashboard</a>
    <?php endif; ?>
    <a class="wb-btn wb-btn-orange" href="missing.php"><i class="fas fa-search-location"></i> Missing Pets</a>
  </div>
</div>
<?php endif; ?>

<!-- HERO -->
<section class="hero">
  <div class="hero-left">
    <div class="hero-tag"><span class="hero-tag-dot"></span> Ilocos Region's Pet Adoption Platform</div>
    <h1 class="hero-title">Find Your <em>Forever</em><span class="line2">Companion.</span></h1>
    <p class="hero-sub">Pawster connects loving homes with animals in need across the Ilocos Region. Browse adoptable pets, submit applications, and give a life a second chance.</p>
    <div class="hero-actions">
      <a class="btn-primary" href="#pets"><i class="fas fa-search"></i> Browse Animals</a>
      <?php if ($loggedIn): ?>
        <?php if ($isAdmin): ?>
          <a class="btn-secondary" href="admin_dashboard.php"><i class="fas fa-th-large"></i> My Dashboard</a>
        <?php else: ?>
          <a class="btn-secondary" href="#" onclick="openDashboard();return false;"><i class="fas fa-th-large"></i> My Dashboard</a>
        <?php endif; ?>
        <a class="btn-orange" href="missing.php"><i class="fas fa-search-location"></i> Missing Pets</a>
      <?php else: ?>
        <a class="btn-secondary" href="register.php"><i class="fas fa-user-plus"></i> Create Account</a>
      <?php endif; ?>
    </div>
    <div class="hero-stats">
      <div><div class="hero-stat-val">240+</div><div class="hero-stat-lbl">Pets Adopted</div></div>
      <div class="hero-stat-div"></div>
      <div><div class="hero-stat-val">4</div><div class="hero-stat-lbl">Provinces</div></div>
      <div class="hero-stat-div"></div>
      <div><div class="hero-stat-val">98%</div><div class="hero-stat-lbl">Happy Families</div></div>
    </div>
  </div>
  <div class="hero-right">
    <div class="hero-pet-card" id="heroPetCard">
      <img class="hpc-photo" id="hpcPhoto" src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=760&h=1040&fit=crop&auto=format" alt="Bruno"/>
      <video class="hpc-video" id="hpcVideo" muted loop playsinline preload="none"></video>
      <div class="hpc-scrim"></div>
      <div class="hpc-live" id="hpcLive"><div class="hpc-live-dot"></div>Live Preview</div>
      <div class="hpc-dots" id="hpcDots">
        <div class="hpc-dot active" data-index="0"></div>
        <div class="hpc-dot" data-index="1"></div>
        <div class="hpc-dot" data-index="2"></div>
      </div>
      <div class="hpc-info">
        <div class="hpc-species" id="hpcSpecies">🐕 Dog</div>
        <div class="hpc-name" id="hpcName">Bruno</div>
        <div class="hpc-breed" id="hpcBreed">Labrador Mix · 2 yrs · Laoag City</div>
        <span class="hpc-badge" id="hpcBadge">Available</span>
      </div>
      <a class="hpc-cta" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Now</a>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="section" id="how">
  <div class="sec-tag reveal"><i class="fas fa-list-ol"></i> Simple Process</div>
  <h2 class="sec-title reveal reveal-delay-1">How <em>Adoption</em> Works</h2>
  <p class="sec-sub reveal reveal-delay-2">Three easy steps to bring a new friend home.</p>
  <div class="steps-grid">
    <div class="step-card reveal reveal-delay-1">
      <div class="step-num">01</div>
      <div class="step-icon green"><i class="fas fa-search"></i></div>
      <div class="step-title">Browse & Choose</div>
      <p class="step-desc">Explore listings of dogs, cats, and small animals available across the Ilocos Region. Filter by type, age, and location.</p>
    </div>
    <div class="step-card reveal reveal-delay-2">
      <div class="step-num">02</div>
      <div class="step-icon orange"><i class="fas fa-file-alt"></i></div>
      <div class="step-title">Submit Application</div>
      <p class="step-desc">Fill out a short adoption form online. Our team reviews every application and responds within 2–3 business days.</p>
    </div>
    <div class="step-card reveal reveal-delay-3">
      <div class="step-num">03</div>
      <div class="step-icon amber"><i class="fas fa-heart"></i></div>
      <div class="step-title">Welcome Home</div>
      <p class="step-desc">Once approved, coordinate your meet & greet. We follow up to make sure both you and your companion are thriving.</p>
    </div>
  </div>
  <div style="text-align:center;margin-top:2rem" class="reveal">
    <a href="how_it_works.php" class="btn-secondary"><i class="fas fa-arrow-right"></i> Full Process Details</a>
  </div>
</section>

<!-- STATS BAND -->
<div class="stats-band">
  <div class="stats-band-inner">
    <div class="reveal"><div class="sb-val">240<em>+</em></div><div class="sb-lbl">Animals Adopted</div></div>
    <div class="reveal reveal-delay-1"><div class="sb-val">18<em>+</em></div><div class="sb-lbl">Cities Covered</div></div>
    <div class="reveal reveal-delay-2"><div class="sb-val">4</div><div class="sb-lbl">Ilocos Provinces</div></div>
    <div class="reveal reveal-delay-3"><div class="sb-val">98<em>%</em></div><div class="sb-lbl">Satisfaction Rate</div></div>
  </div>
</div>

<!-- MISSING PETS ALERT BAND -->
<div class="missing-alert-band">
  <div class="mab-inner">
    <span class="mab-icon">🔍</span>
    <div class="mab-text">
      <div class="mab-title">Lost or Found a Pet in the Ilocos Region?</div>
      <div class="mab-sub">Our community-powered missing pets board helps reunite animals with their families.</div>
    </div>
    <a class="mab-btn" href="missing.php"><i class="fas fa-search-location"></i> View Missing Pets Board</a>
  </div>
</div>

<!-- FEATURED PETS -->
<section class="section" id="pets">
  <div class="sec-tag reveal"><i class="fas fa-paw"></i> Looking for Homes</div>
  <h2 class="sec-title reveal reveal-delay-1"><em>Featured</em> Animals</h2>
  <p class="sec-sub reveal reveal-delay-2">These wonderful animals are ready to meet you.</p>
  <div class="pets-grid">
    <div class="fp-card reveal reveal-delay-1">
      <div class="fp-img"><span class="fp-species">🐕 Dog</span><span class="fp-avail">Available</span><img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=220&fit=crop&auto=format" alt="Bruno" loading="lazy"/></div>
      <div class="fp-body"><div class="fp-name">Bruno</div><div class="fp-meta">Labrador Mix · Male · 2 yrs · Laoag City</div><div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag blue">Friendly</span><span class="fp-tag amber">Vaccinated</span></div><a class="fp-adopt-btn" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Bruno</a></div>
    </div>
    <div class="fp-card reveal reveal-delay-2">
      <div class="fp-img"><span class="fp-species">🐈 Cat</span><span class="fp-avail">Available</span><img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=220&fit=crop&auto=format" alt="Luna" loading="lazy"/></div>
      <div class="fp-body"><div class="fp-name">Luna</div><div class="fp-meta">Tabby Cat · Female · 1 yr · Vigan City</div><div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag orange">Playful</span></div><a class="fp-adopt-btn" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Luna</a></div>
    </div>
    <div class="fp-card reveal reveal-delay-3">
      <div class="fp-img"><span class="fp-species">🐕 Dog</span><span class="fp-avail">Available</span><img src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=220&fit=crop&auto=format" alt="Mochi" loading="lazy"/></div>
      <div class="fp-body"><div class="fp-name">Mochi</div><div class="fp-meta">Shih Tzu · Female · 3 yrs · San Fernando</div><div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag blue">Calm</span><span class="fp-tag amber">Vaccinated</span></div><a class="fp-adopt-btn" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Mochi</a></div>
    </div>
    <div class="fp-card reveal reveal-delay-4">
      <div class="fp-img"><span class="fp-species">🐈 Cat</span><span class="fp-avail">Available</span><img src="https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=400&h=220&fit=crop&auto=format" alt="Shadow" loading="lazy"/></div>
      <div class="fp-body"><div class="fp-name">Shadow</div><div class="fp-meta">Black Cat · Male · 2 yrs · Dagupan City</div><div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag orange">Independent</span></div><a class="fp-adopt-btn" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Shadow</a></div>
    </div>
  </div>
  <div style="text-align:center;margin-top:2.2rem" class="reveal">
    <a class="btn-secondary" href="find_a_pet.php" style="display:inline-flex"><i class="fas fa-search"></i> Browse All Animals</a>
  </div>
</section>

<!-- REHOME BANNER -->
<div class="rehome-banner">
  <div class="rehome-card reveal">
    <div class="rehome-icon">🏡</div>
    <div class="rehome-body">
      <h2 class="rehome-title">Need to <em>Rehome</em> Your Pet?</h2>
      <p class="rehome-desc">Life circumstances change. If you're unable to care for your pet, Pawster can help find them a safe, loving new home with care and discretion.</p>
      <a class="rehome-btn" href="rehome.php"><i class="fas fa-home"></i> Rehome a Pet</a>
    </div>
  </div>
</div>

<!-- TESTIMONIALS -->
<section class="section">
  <div class="sec-tag reveal"><i class="fas fa-comment-heart"></i> Success Stories</div>
  <h2 class="sec-title reveal reveal-delay-1">Happy <em>Families</em></h2>
  <p class="sec-sub reveal reveal-delay-2">Real stories from real adopters across the Ilocos Region.</p>
  <div class="testi-grid">
    <div class="testi-card reveal reveal-delay-1">
      <div class="testi-stars">★★★★★</div>
      <p class="testi-text">"The process was so smooth and the team was incredibly supportive. Bruno has been the best addition to our family!"</p>
      <div class="testi-author"><div class="testi-avatar">MA</div><div><div class="testi-name">Maria A.</div><div class="testi-loc">Laoag City, Ilocos Norte</div></div></div>
    </div>
    <div class="testi-card reveal reveal-delay-2">
      <div class="testi-stars">★★★★★</div>
      <p class="testi-text">"I was nervous about adopting for the first time but Pawster made it so easy. Luna settled in within a week!"</p>
      <div class="testi-author"><div class="testi-avatar">JR</div><div><div class="testi-name">Jose R.</div><div class="testi-loc">Vigan City, Ilocos Sur</div></div></div>
    </div>
    <div class="testi-card reveal reveal-delay-3">
      <div class="testi-stars">★★★★★</div>
      <p class="testi-text">"We had to rehome our dog due to moving abroad. Pawster found her a wonderful family in just two weeks."</p>
      <div class="testi-author"><div class="testi-avatar">CL</div><div><div class="testi-name">Clara L.</div><div class="testi-loc">Dagupan City, Pangasinan</div></div></div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-card reveal">
    <div class="sec-tag" style="margin-bottom:1rem">🐾 Ready to Begin?</div>
    <h2 class="cta-title">Give a Pet a <em>Second Chance</em></h2>
    <p class="cta-sub">Join hundreds of families across the Ilocos Region who have opened their hearts and homes.</p>
    <div class="cta-btns">
      <?php if ($loggedIn): ?>
        <?php if ($isAdmin): ?>
          <a class="btn-primary" href="admin_dashboard.php"><i class="fas fa-th-large"></i> Go to Dashboard</a>
        <?php else: ?>
          <a class="btn-primary" href="#" onclick="openDashboard();return false;"><i class="fas fa-th-large"></i> Go to Dashboard</a>
        <?php endif; ?>
        <a class="btn-secondary" href="missing.php" style="display:inline-flex"><i class="fas fa-search-location"></i> Missing Pets</a>
      <?php else: ?>
        <a class="btn-primary" href="register.php"><i class="fas fa-paw"></i> Create Free Account</a>
        <a class="btn-secondary" href="login.php" style="display:inline-flex"><i class="fas fa-sign-in-alt"></i> Log In</a>
      <?php endif; ?>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="../images/logo.png" alt="Pawster"/>
      <div class="footer-brand-name">Paw<em>ster</em></div>
      <p class="footer-desc">Connecting loving homes with animals in need across the Ilocos Region since 2023.</p>
    </div>
    <div>
      <div class="footer-col-title">Adopt</div>
      <a class="footer-link" href="#pets">Browse Animals</a>
      <a class="footer-link" href="how_it_works.php">How It Works</a>
      <a class="footer-link" href="missing.php">Missing Pets</a>
      <?php if (!$loggedIn): ?>
        <a class="footer-link" href="register.php">Create Account</a>
        <a class="footer-link" href="login.php">Log In</a>
      <?php else: ?>
        <?php if ($isAdmin): ?>
          <a class="footer-link" href="admin_dashboard.php">My Dashboard</a>
        <?php else: ?>
          <a class="footer-link" href="#" onclick="openDashboard();return false;">My Dashboard</a>
        <?php endif; ?>
        <a class="footer-link" href="logout.php">Log Out</a>
      <?php endif; ?>
    </div>
    <div>
      <div class="footer-col-title">Services</div>
      <a class="footer-link" href="rehome.php">Rehome a Pet</a>
      <a class="footer-link" href="missing.php">Report Missing Pet</a>
      <a class="footer-link" href="how_it_works.php">How It Works</a>
      <a class="footer-link" href="about.php">About Us</a>
    </div>
    <div>
      <div class="footer-col-title">Regions</div>
      <a class="footer-link" href="#">Ilocos Norte</a>
      <a class="footer-link" href="#">Ilocos Sur</a>
      <a class="footer-link" href="#">La Union</a>
      <a class="footer-link" href="#">Pangasinan</a>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-copy">© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
    <div class="footer-socials">
      <a class="footer-social" href="#"><i class="fab fa-facebook-f"></i></a>
      <a class="footer-social" href="#"><i class="fab fa-instagram"></i></a>
      <a class="footer-social" href="#"><i class="fab fa-twitter"></i></a>
    </div>
  </div>
</footer>

<!-- DOG CURSOR -->
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

<?php
// ── Include dashboard popup for regular (non-admin) users only ──
if ($loggedIn && !$isAdmin) {
    include 'user_dashboard.php';
}
?>

<script>
/* ── Dog cursor ── */
(function(){
  var el=document.getElementById('dc');
  var mX=innerWidth/2,mY=innerHeight/2,dX=mX,dY=mY,fr=true,ic=false;
  document.addEventListener('mousemove',function(e){mX=e.clientX;mY=e.clientY;});
  document.addEventListener('mousedown',function(){ic=true;el.className='clicking';setTimeout(function(){ic=false;},300);});
  (function loop(){
    if(!ic){var dx=mX-dX,dy=mY-dY,d=Math.sqrt(dx*dx+dy*dy);
    if(d>5){dX+=(dx/d)*Math.min(d*.13,18);dY+=(dy/d)*Math.min(d*.13,18);
    var right=dx>0;if(right!==fr){fr=right;document.getElementById('dog-svg').style.transform=fr?'scaleX(1)':'scaleX(-1)';}
    el.className=d>7?'walking':'idle';}else{el.className='idle';}}
    el.style.left=dX+'px';el.style.top=dY+'px';requestAnimationFrame(loop);
  })();
}());
/* ── Orb parallax ── */
(function(){
  var orbs=[{el:document.querySelector('.orb-1'),fx:.08,fy:.06},{el:document.querySelector('.orb-2'),fx:-.10,fy:.07},{el:document.querySelector('.orb-3'),fx:.11,fy:-.06},{el:document.querySelector('.orb-4'),fx:-.07,fy:-.09}];
  var mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove',function(e){mx=(e.clientX/innerWidth-.5)*70;my=(e.clientY/innerHeight-.5)*70;});
  (function anim(){cx+=(mx-cx)*.07;cy+=(my-cy)*.07;orbs.forEach(function(o){if(o.el){o.el.style.marginLeft=(cx*o.fx)+'px';o.el.style.marginTop=(cy*o.fy)+'px';}});requestAnimationFrame(anim);})();
}());
/* ── Scroll reveal ── */
(function(){
  var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
}());
/* ── Nav dropdown ── */
(function(){
  var btn=document.getElementById('avatarBtn'),drop=document.getElementById('profileDrop');
  if(!btn||!drop)return;
  btn.addEventListener('click',function(e){e.stopPropagation();var o=drop.classList.toggle('open');btn.classList.toggle('open',o);});
  document.addEventListener('click',function(){drop.classList.remove('open');if(btn)btn.classList.remove('open');});
}());
/* ── Hero card ── */
(function(){
  var pets=[
    {name:'Bruno',breed:'Labrador Mix · 2 yrs · Laoag City',species:'🐕 Dog',status:'available',photo:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=760&h=1040&fit=crop&auto=format',video:'https://videos.pexels.com/video-files/3195394/3195394-sd_640_360_25fps.mp4'},
    {name:'Luna',breed:'Tabby Cat · 1 yr · Vigan City',species:'🐈 Cat',status:'available',photo:'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=760&h=1040&fit=crop&auto=format',video:'https://videos.pexels.com/video-files/4958792/4958792-sd_640_360_24fps.mp4'},
    {name:'Coco',breed:'Rabbit · 6 mos · San Fernando',species:'🐇 Rabbit',status:'pending',photo:'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=760&h=1040&fit=crop&auto=format',video:'https://videos.pexels.com/video-files/3195386/3195386-sd_640_360_25fps.mp4'}
  ];
  var card=document.getElementById('heroPetCard'),photo=document.getElementById('hpcPhoto'),video=document.getElementById('hpcVideo');
  var nameEl=document.getElementById('hpcName'),breedEl=document.getElementById('hpcBreed'),speciesEl=document.getElementById('hpcSpecies'),badgeEl=document.getElementById('hpcBadge');
  var dots=document.querySelectorAll('.hpc-dot'),current=0,videoLoaded=[false,false,false],isHovering=false;
  function switchPet(idx){if(idx===current)return;photo.style.transition='opacity 0.4s ease,transform 0.5s ease';photo.style.opacity='0';photo.style.transform='scale(1.04)';setTimeout(function(){current=idx;var p=pets[idx];photo.src=p.photo;nameEl.textContent=p.name;breedEl.textContent=p.breed;speciesEl.textContent=p.species;badgeEl.textContent=p.status==='pending'?'Pending':'Available';badgeEl.className='hpc-badge'+(p.status==='pending'?' pending':'');dots.forEach(function(d,i){d.classList.toggle('active',i===idx);});photo.style.opacity='1';photo.style.transform='scale(1.0)';if(isHovering){video.pause();video.innerHTML='';videoLoaded[idx]=false;loadAndPlayVideo(idx);}},220);}
  function loadAndPlayVideo(idx){if(!videoLoaded[idx]){video.innerHTML='';var src=document.createElement('source');src.src=pets[idx].video;src.type='video/mp4';video.appendChild(src);video.load();videoLoaded[idx]=true;}var p=video.play();if(p&&p.catch)p.catch(function(){});}
  card.addEventListener('mouseenter',function(){isHovering=true;loadAndPlayVideo(current);});
  card.addEventListener('mouseleave',function(){isHovering=false;video.pause();video.currentTime=0;});
  dots.forEach(function(dot){dot.addEventListener('click',function(e){e.stopPropagation();switchPet(parseInt(dot.getAttribute('data-index')));});});
  setInterval(function(){if(!isHovering)switchPet((current+1)%pets.length);},4000);
}());
</script>
</body>
</html>