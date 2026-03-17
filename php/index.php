<?php
/* =============================================
   PAWSTER — HOMEPAGE
   php/index.php  ← lives in php/ folder
   All paths relative to php/ (../css, ../images, etc.)
   ============================================= */
session_start();

$loggedIn  = isset($_SESSION['user_id']);
$isAdmin   = $loggedIn && ($_SESSION['role'] ?? '') === 'admin';

$firstName = '';
$initials  = '';
if ($loggedIn) {
    $firstName = htmlspecialchars($_SESSION['first_name'] ?? 'User');
    $lastName  = htmlspecialchars($_SESSION['last_name']  ?? '');
    $initials  = strtoupper(
        substr($_SESSION['first_name'] ?? 'U', 0, 1) .
        substr($_SESSION['last_name']  ?? '',  0, 1)
    );
}

$dashLink = $isAdmin ? 'admin_dashboard.php' : 'user_dashboard.php';
$email    = htmlspecialchars($_SESSION['email'] ?? '');
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
</head>
<body>

<!-- MESH BACKGROUND -->
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
          <a class="pd-item" href="<?= $dashLink ?>"><i class="fas fa-th-large"></i>My Dashboard</a>
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
<!-- WELCOME BANNER (only shown when logged in) -->
<div class="welcome-banner">
  <div class="wb-left">
    <span class="wb-paw">🐾</span>
    <span class="wb-text">Welcome back, <em><?= $firstName ?></em>! Ready to find a new friend today?</span>
  </div>
  <div class="wb-actions">
    <a class="wb-btn" href="<?= $dashLink ?>"><i class="fas fa-th-large"></i> Dashboard</a>
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
        <a class="btn-secondary" href="<?= $dashLink ?>"><i class="fas fa-th-large"></i> My Dashboard</a>
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
    <div class="pet-card tall featured">
      <span class="pet-emoji">🐕</span>
      <div class="pet-name">Bruno</div>
      <div class="pet-breed">Labrador Mix · 2 yrs</div>
      <span class="pet-badge">Available</span>
    </div>
    <div class="pet-card">
      <span class="pet-emoji" style="font-size:2.4rem;animation-delay:1s">🐈</span>
      <div class="pet-name">Luna</div>
      <div class="pet-breed">Tabby · 1 yr</div>
      <span class="pet-badge">Available</span>
    </div>
    <div class="pet-card">
      <span class="pet-emoji" style="font-size:2.4rem;animation-delay:2s">🐇</span>
      <div class="pet-name">Coco</div>
      <div class="pet-breed">Rabbit · 6 mos</div>
      <span class="pet-badge orange">Pending</span>
    </div>
  </div>
</section>

<!-- HOW IT WORKS (HOMEPAGE PREVIEW) -->
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
      <div class="fp-img">🐕</div>
      <div class="fp-body">
        <div class="fp-name">Bruno</div>
        <div class="fp-meta">Labrador Mix · Male · 2 yrs · Laoag City</div>
        <div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag blue">Friendly</span><span class="fp-tag amber">Vaccinated</span></div>
        <a class="fp-adopt-btn" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Bruno</a>
      </div>
    </div>
    <div class="fp-card reveal reveal-delay-2">
      <div class="fp-img">🐈</div>
      <div class="fp-body">
        <div class="fp-name">Luna</div>
        <div class="fp-meta">Tabby Cat · Female · 1 yr · Vigan City</div>
        <div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag orange">Playful</span></div>
        <a class="fp-adopt-btn" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Luna</a>
      </div>
    </div>
    <div class="fp-card reveal reveal-delay-3">
      <div class="fp-img">🐩</div>
      <div class="fp-body">
        <div class="fp-name">Mochi</div>
        <div class="fp-meta">Shih Tzu · Female · 3 yrs · San Fernando</div>
        <div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag blue">Calm</span><span class="fp-tag amber">Vaccinated</span></div>
        <a class="fp-adopt-btn" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Mochi</a>
      </div>
    </div>
    <div class="fp-card reveal reveal-delay-4">
      <div class="fp-img">🐈‍⬛</div>
      <div class="fp-body">
        <div class="fp-name">Shadow</div>
        <div class="fp-meta">Black Cat · Male · 2 yrs · Dagupan City</div>
        <div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag orange">Independent</span></div>
        <a class="fp-adopt-btn" href="find_a_pet.php"><i class="fas fa-heart"></i> Adopt Shadow</a>
      </div>
    </div>
  </div>
  <div style="text-align:center;margin-top:2.2rem" class="reveal">
    <a class="btn-secondary" href="find_a_pet.php" style="display:inline-flex">
      <i class="fas fa-search"></i> Browse All Animals
    </a>
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
        <a class="btn-primary" href="<?= $dashLink ?>"><i class="fas fa-th-large"></i> Go to Dashboard</a>
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
      <a class="footer-link" href="<?= $dashLink ?>">My Dashboard</a>
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

<script>
// Dog cursor
(function(){
  const el=document.getElementById('dc');
  let mX=innerWidth/2,mY=innerHeight/2,dX=mX,dY=mY,fr=true,ic=false;
  document.addEventListener('mousemove',e=>{mX=e.clientX;mY=e.clientY;});
  document.addEventListener('mousedown',()=>{ic=true;el.className='clicking';setTimeout(()=>{ic=false;},300);});
  (function loop(){
    if(!ic){const dx=mX-dX,dy=mY-dY,d=Math.sqrt(dx*dx+dy*dy);
    if(d>5){dX+=(dx/d)*Math.min(d*.13,18);dY+=(dy/d)*Math.min(d*.13,18);
    const right=dx>0;if(right!==fr){fr=right;document.getElementById('dog-svg').style.transform=fr?'scaleX(1)':'scaleX(-1)';}
    el.className=d>7?'walking':'idle';}else{el.className='idle';}}
    el.style.left=dX+'px';el.style.top=dY+'px';requestAnimationFrame(loop);
  })();
}());
// Orb parallax
(function(){
  const orbs=[{el:document.querySelector('.orb-1'),fx:.08,fy:.06},{el:document.querySelector('.orb-2'),fx:-.10,fy:.07},{el:document.querySelector('.orb-3'),fx:.11,fy:-.06},{el:document.querySelector('.orb-4'),fx:-.07,fy:-.09}];
  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-.5)*70;my=(e.clientY/innerHeight-.5)*70;});
  (function anim(){cx+=(mx-cx)*.07;cy+=(my-cy)*.07;orbs.forEach(({el,fx,fy})=>{if(el){el.style.marginLeft=(cx*fx)+'px';el.style.marginTop=(cy*fy)+'px';}});requestAnimationFrame(anim);})();
}());
// Scroll reveal
(function(){
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');}});},{threshold:0.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}());
// Nav dropdown
(function(){
  const btn=document.getElementById('avatarBtn'),drop=document.getElementById('profileDrop');
  if(!btn||!drop)return;
  btn.addEventListener('click',e=>{e.stopPropagation();const o=drop.classList.toggle('open');btn.classList.toggle('open',o);});
  document.addEventListener('click',()=>{drop.classList.remove('open');btn.classList.remove('open');});
}());
</script>
</body>
</html>