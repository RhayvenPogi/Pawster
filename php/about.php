<?php session_start(); $activePage = 'about'; require_once 'nav.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>About Us — Pawster</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/pawster_pages.css"/>
  <link rel="stylesheet" href="../css/about.css"/>
  <?php if ($loggedIn && !$isAdmin): ?>
  <link rel="stylesheet" href="../css/user_dashboard.css"/>
  <?php endif; ?>
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
  <div class="hero-tag"><i class="fas fa-paw"></i> Our Story</div>
  <h1>About <em>Pawster</em></h1>
  <p>We're a community-driven animal rescue and adoption platform serving the Ilocos Region — connecting loving families with animals who need them most.</p>
</div>

<div class="page-wrap">

  <div class="sec-lbl reveal">Why We Exist</div>
  <h2 class="sec-title reveal reveal-d1">Our <em>Mission</em></h2>
  <p class="sec-sub reveal reveal-d2">Pawster was founded on the belief that every animal deserves a safe, loving home. We make adoption accessible, transparent, and joyful for families across Ilocos Norte, Ilocos Sur, La Union, and Pangasinan.</p>

  <div class="mission-grid">
    <div class="mission-card reveal reveal-d1">
      <div class="mc-icon green"><i class="fas fa-heart"></i></div>
      <div class="mc-title">Animal Welfare First</div>
      <p class="mc-desc">Every decision we make puts the wellbeing of our animals first. Health checks, vaccinations, and proper care before any adoption.</p>
    </div>
    <div class="mission-card reveal reveal-d2">
      <div class="mc-icon orange"><i class="fas fa-users"></i></div>
      <div class="mc-title">Community-Powered</div>
      <p class="mc-desc">Our missing pets board, rehoming service, and follow-up surveys are all built on community participation and trust.</p>
    </div>
    <div class="mission-card reveal reveal-d3">
      <div class="mc-icon blue"><i class="fas fa-map-marked-alt"></i></div>
      <div class="mc-title">Locally Focused</div>
      <p class="mc-desc">We serve the Ilocos Region specifically — understanding local culture, needs, and conditions to make adoptions work better.</p>
    </div>
    <div class="mission-card reveal reveal-d4">
      <div class="mc-icon amber"><i class="fas fa-handshake"></i></div>
      <div class="mc-title">Lifetime Support</div>
      <p class="mc-desc">Adoption doesn't end when you take your pet home. We're here for the long run with follow-ups, advice, and ongoing support.</p>
    </div>
  </div>

  <div style="margin-top:3rem;background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);padding:2.5rem;box-shadow:var(--shadow)" class="reveal">
    <div class="sec-lbl" style="margin-bottom:0.7rem">How It All Started</div>
    <h2 class="sec-title" style="margin-bottom:1rem">Our <em>Story</em></h2>
    <p style="font-size:0.95rem;font-weight:700;color:var(--text-mid);line-height:1.8;max-width:720px">
      Pawster started in 2023 when a small group of animal lovers in Laoag City noticed that many healthy, loving pets were being abandoned or euthanized due to lack of a reliable adoption network in the region. We built Pawster to change that — a digital-first platform that removes the friction from rescue and adoption, making it simple for families to find a pet and for rescuers to find homes.
    </p>
    <p style="font-size:0.95rem;font-weight:700;color:var(--text-mid);line-height:1.8;max-width:720px;margin-top:1rem">
      What started as a small community group has grown into a full-featured platform serving all four Ilocos provinces, with over 240 successful adoptions and a community of thousands of animal lovers. We are proudly volunteer-run and community-funded.
    </p>
  </div>

  <div style="margin-top:3rem">
    <div class="sec-lbl reveal">By the Numbers</div>
    <h2 class="sec-title reveal reveal-d1">Our <em>Impact</em></h2>
    <div class="stats-row">
      <div class="stat-box reveal reveal-d1"><div class="stat-val">240<em>+</em></div><div class="stat-lbl">Animals Adopted</div></div>
      <div class="stat-box reveal reveal-d2"><div class="stat-val">4</div><div class="stat-lbl">Provinces Covered</div></div>
      <div class="stat-box reveal reveal-d3"><div class="stat-val">18<em>+</em></div><div class="stat-lbl">Cities &amp; Towns</div></div>
      <div class="stat-box reveal reveal-d4"><div class="stat-val">98<em>%</em></div><div class="stat-lbl">Satisfaction Rate</div></div>
    </div>
  </div>

  <div style="margin-top:3rem">
    <div class="sec-lbl reveal">The People Behind Pawster</div>
    <h2 class="sec-title reveal reveal-d1">Meet the <em>Team</em></h2>
    <div class="team-grid">
      <div class="team-card reveal reveal-d1">
        <div class="team-avatar">MR</div>
        <div class="team-name">Maria Reyes</div>
        <div class="team-role">Founder &amp; Director</div>
        <p style="font-size:0.78rem;color:var(--text-muted);font-weight:700;margin-top:0.6rem;line-height:1.55">Veterinarian with 10+ years experience. Passionate about animal welfare and community building in the Ilocos Region.</p>
      </div>
      <div class="team-card reveal reveal-d2">
        <div class="team-avatar" style="background:linear-gradient(135deg,var(--c2),#8a3010)">JD</div>
        <div class="team-name">Jose Dela Cruz</div>
        <div class="team-role">Veterinary Officer</div>
        <p style="font-size:0.78rem;color:var(--text-muted);font-weight:700;margin-top:0.6rem;line-height:1.55">Licensed vet who ensures every animal in our care receives full health checks, vaccinations, and proper medical attention.</p>
      </div>
      <div class="team-card reveal reveal-d3">
        <div class="team-avatar" style="background:linear-gradient(135deg,var(--blue),#104080)">AC</div>
        <div class="team-name">Ana Castro</div>
        <div class="team-role">Adoption Coordinator</div>
        <p style="font-size:0.78rem;color:var(--text-muted);font-weight:700;margin-top:0.6rem;line-height:1.55">Reviews all adoption applications and coordinates meet &amp; greet sessions. Has matched over 150 families with their perfect companions.</p>
      </div>
    </div>
  </div>

  <div style="margin-top:3rem">
    <div class="sec-lbl reveal">What We Stand For</div>
    <h2 class="sec-title reveal reveal-d1">Our <em>Values</em></h2>
    <div class="mission-grid">
      <div class="mission-card reveal reveal-d1">
        <div class="mc-icon green"><i class="fas fa-shield-alt"></i></div>
        <div class="mc-title">Transparency</div>
        <p class="mc-desc">We are open about our process, fees, and animal health records. Adopters deserve fully informed decisions.</p>
      </div>
      <div class="mission-card reveal reveal-d2">
        <div class="mc-icon orange"><i class="fas fa-leaf"></i></div>
        <div class="mc-title">Sustainability</div>
        <p class="mc-desc">Our rehoming program reduces shelter overcrowding and gives every pet the best chance at a permanent loving home.</p>
      </div>
      <div class="mission-card reveal reveal-d3">
        <div class="mc-icon blue"><i class="fas fa-globe-asia"></i></div>
        <div class="mc-title">Community First</div>
        <p class="mc-desc">We work with local governments, barangay officials, and animal welfare groups to create a safer region for animals.</p>
      </div>
      <div class="mission-card reveal reveal-d4">
        <div class="mc-icon amber"><i class="fas fa-star"></i></div>
        <div class="mc-title">Excellence</div>
        <p class="mc-desc">We continuously improve our platform based on adopter feedback to provide the best experience possible.</p>
      </div>
    </div>
  </div>

  <div style="margin-top:3rem" id="contact">
    <div class="sec-lbl reveal">Get in Touch</div>
    <h2 class="sec-title reveal reveal-d1">Contact <em>Us</em></h2>
    <div class="contact-grid">
      <div class="contact-card reveal reveal-d1">
        <div class="cc-icon"><i class="fas fa-map-marker-alt"></i></div>
        <div><div class="cc-label">Address</div><div class="cc-val">123 Rescue Street, Laoag City, Ilocos Norte</div></div>
      </div>
      <div class="contact-card reveal reveal-d2">
        <div class="cc-icon"><i class="fas fa-phone"></i></div>
        <div><div class="cc-label">Phone</div><div class="cc-val">+63 (077) 123-4567</div></div>
      </div>
      <div class="contact-card reveal reveal-d3">
        <div class="cc-icon"><i class="fas fa-envelope"></i></div>
        <div><div class="cc-label">Email</div><div class="cc-val">hello@pawster.ph</div></div>
      </div>
      <div class="contact-card reveal reveal-d4">
        <div class="cc-icon"><i class="fas fa-clock"></i></div>
        <div><div class="cc-label">Hours</div><div class="cc-val">Mon–Fri 9AM–6PM · Sat–Sun 10AM–4PM</div></div>
      </div>
    </div>
  </div>

  <div style="text-align:center;margin-top:4rem;padding:3rem 2rem;background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow)" class="reveal">
    <div style="font-size:2.5rem;margin-bottom:1rem">🐾</div>
    <h2 style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:900;color:var(--green-dark);margin-bottom:0.7rem">Join Our Mission</h2>
    <p style="color:var(--text-mid);font-weight:700;margin-bottom:1.5rem;font-size:0.95rem;max-width:480px;margin-left:auto;margin-right:auto">Every adoption changes two lives — the animal's and yours. Be part of something meaningful today.</p>
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
      <a href="find_a_pet.php" class="btn-primary"><i class="fas fa-search"></i> Find a Pet</a>
      <a href="rehome.php" class="btn-orange"><i class="fas fa-home"></i> Rehome a Pet</a>
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

<script src="../js/about.js"></script>
<script src="../js/pawster_pages.js"></script>

<?php if ($loggedIn && !$isAdmin) { include 'user_dashboard.php'; } ?>
</body>
</html>