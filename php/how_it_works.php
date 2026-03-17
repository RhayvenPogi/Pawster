<?php session_start(); $activePage = 'how'; require_once 'nav.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>How It Works — Pawster</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/pawster_pages.css"/>
  <link rel="stylesheet" href="../css/how_it_works.css"/>
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
  <div class="hero-tag"><i class="fas fa-info-circle"></i> Adoption Process</div>
  <h1>How <em>Adoption</em> Works</h1>
  <p>Simple, guided, and transparent. We'll walk you through every step of bringing your new companion home.</p>
</div>

<div class="page-wrap">

  <div class="sec-lbl reveal">Step by Step</div>
  <h2 class="sec-title reveal reveal-d1">The <em>Adoption</em> Journey</h2>

  <div class="steps-timeline">

    <div class="step-row reveal">
      <div class="step-num-wrap"><div class="step-num-circle">1</div></div>
      <div class="step-content">
        <div class="step-title">Create Your Account</div>
        <p class="step-desc">Register on Pawster for free. Your profile helps us match you with the right pet and process your application smoothly.</p>
        <div class="step-icon-row">
          <span class="step-chip"><i class="fas fa-user-plus"></i> Free Registration</span>
          <span class="step-chip"><i class="fas fa-lock"></i> Secure &amp; Private</span>
        </div>
      </div>
    </div>

    <div class="step-row reveal">
      <div class="step-num-wrap"><div class="step-num-circle">2</div></div>
      <div class="step-content">
        <div class="step-title">Browse Available Animals</div>
        <p class="step-desc">Explore our listings of dogs, cats, and small animals. Filter by type, breed, age, and location across the Ilocos Region.</p>
        <div class="step-icon-row">
          <span class="step-chip"><i class="fas fa-search"></i> Smart Filters</span>
          <span class="step-chip"><i class="fas fa-map-marker-alt"></i> Ilocos Region</span>
        </div>
      </div>
    </div>

    <div class="step-row reveal">
      <div class="step-num-wrap"><div class="step-num-circle">3</div></div>
      <div class="step-content">
        <div class="step-title">Submit Your Application</div>
        <p class="step-desc">Fill out a short adoption questionnaire. We ask about your home environment, experience, and lifestyle to ensure the best match.</p>
        <div class="step-icon-row">
          <span class="step-chip"><i class="fas fa-file-alt"></i> Quick Form</span>
          <span class="step-chip"><i class="fas fa-clock"></i> 2–3 Day Review</span>
        </div>
      </div>
    </div>

    <div class="step-row reveal">
      <div class="step-num-wrap"><div class="step-num-circle">4</div></div>
      <div class="step-content">
        <div class="step-title">Meet &amp; Greet</div>
        <p class="step-desc">Once approved, we coordinate a meet and greet at our shelter or a mutually convenient location. Take your time getting to know your future companion.</p>
        <div class="step-icon-row">
          <span class="step-chip"><i class="fas fa-handshake"></i> In-Person Visit</span>
          <span class="step-chip"><i class="fas fa-heart"></i> Bond First</span>
        </div>
      </div>
    </div>

    <div class="step-row reveal">
      <div class="step-num-wrap"><div class="step-num-circle">5</div></div>
      <div class="step-content">
        <div class="step-title">Welcome Home!</div>
        <p class="step-desc">Sign the adoption agreement and take your new family member home. We'll provide a starter kit with care tips, health records, and our contact details.</p>
        <div class="step-icon-row">
          <span class="step-chip"><i class="fas fa-home"></i> Official Adoption</span>
          <span class="step-chip"><i class="fas fa-notes-medical"></i> Health Records Included</span>
        </div>
      </div>
    </div>

    <div class="step-row reveal">
      <div class="step-num-wrap"><div class="step-num-circle" style="background:linear-gradient(135deg,var(--c2),#8a3010)">6</div></div>
      <div class="step-content">
        <div class="step-title">Post-Adoption Follow-Up</div>
        <p class="step-desc">We check in at 7 days and 30 days to make sure your pet is settling in beautifully. Our team is always available for advice and support.</p>
        <div class="step-icon-row">
          <span class="step-chip" style="background:rgba(180,90,34,0.1);border-color:rgba(180,90,34,0.25);color:var(--c2)"><i class="fas fa-clipboard-check"></i> 7-Day Check-In</span>
          <span class="step-chip" style="background:rgba(180,90,34,0.1);border-color:rgba(180,90,34,0.25);color:var(--c2)"><i class="fas fa-clipboard-check"></i> 30-Day Follow-Up</span>
        </div>
      </div>
    </div>

  </div><!-- /steps-timeline -->

  <!-- Requirements -->
  <div style="margin-top:3rem">
    <div class="sec-lbl reveal">Before You Apply</div>
    <h2 class="sec-title reveal reveal-d1">Adoption <em>Requirements</em></h2>
    <div class="two-col">
      <div class="info-card reveal reveal-d1">
        <div class="info-card-icon green"><i class="fas fa-check-circle"></i></div>
        <h3>You Must Be</h3>
        <p>At least 18 years old · A resident of the Ilocos Region · Able to provide a stable, loving home · Available to attend a meet &amp; greet</p>
      </div>
      <div class="info-card reveal reveal-d2">
        <div class="info-card-icon orange"><i class="fas fa-home"></i></div>
        <h3>Your Home Must Have</h3>
        <p>A safe, secure environment · Permission from landlord (if renting) · No other pets that may pose a risk · Adequate space for the animal</p>
      </div>
      <div class="info-card reveal reveal-d3">
        <div class="info-card-icon green"><i class="fas fa-syringe"></i></div>
        <h3>All Our Animals Are</h3>
        <p>Vaccinated and dewormed · Health-checked by a licensed vet · Spayed or neutered where applicable · Microchipped for ID purposes</p>
      </div>
      <div class="info-card reveal reveal-d4">
        <div class="info-card-icon orange"><i class="fas fa-ban"></i></div>
        <h3>We Do Not Accept</h3>
        <p>Applications for purely outdoor-only homes · Adopters who intend to breed · Those with a history of animal abuse or neglect</p>
      </div>
    </div>
  </div>

  <!-- FAQ -->
  <div style="margin-top:3rem">
    <div class="sec-lbl reveal">Got Questions?</div>
    <h2 class="sec-title reveal reveal-d1">Frequently <em>Asked</em></h2>
    <div class="faq-list">
      <?php
      $faqs = [
        ['How long does the adoption process take?','Usually 3–7 days from application to approval. We review each application carefully to ensure the best match for both the animal and adopter.'],
        ['Is there an adoption fee?','There is a minimal adoption fee to cover veterinary costs, vaccinations, and shelter care. This varies by animal and will be communicated during the application process.'],
        ['Can I return an animal after adoption?','We ask that you contact us immediately if any issues arise. We have a support team to help with the transition. Returns are accepted as a last resort — the animal\'s wellbeing is our top priority.'],
        ['What if I already have pets at home?','That\'s fine! We\'ll assess compatibility during the meet & greet phase. Just let us know in your application so we can suggest the most compatible animals.'],
        ['Do you do home visits?','For most adoptions, a home visit is required as part of the process. This ensures the animal will be going to a safe and suitable environment.'],
        ['What documents do I need?','A valid government ID, proof of residence, and if renting — written permission from your landlord. We\'ll let you know in advance if anything additional is required.'],
      ];
      foreach ($faqs as $i => $faq): ?>
      <div class="faq-item glass-card reveal" style="transition-delay:<?= $i*0.07 ?>s">
        <div class="faq-q" onclick="this.parentElement.classList.toggle('open')">
          <?= htmlspecialchars($faq[0]) ?>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="faq-a"><?= htmlspecialchars($faq[1]) ?></div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-top:4rem;padding:3rem 2rem;background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow)" class="reveal">
    <div style="font-size:2.5rem;margin-bottom:1rem">🐾</div>
    <h2 style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:900;color:var(--green-dark);margin-bottom:0.7rem">Ready to Begin?</h2>
    <p style="color:var(--text-mid);font-weight:700;margin-bottom:1.5rem;font-size:0.95rem">Browse our available animals and find your perfect companion today.</p>
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
      <a href="find_a_pet.php" class="btn-primary"><i class="fas fa-search"></i> Browse Animals</a>
      <a href="<?= $loggedInNav ? $navDash : 'register.php' ?>" class="btn-secondary">
        <i class="fas fa-<?= $loggedInNav ? 'th-large' : 'user-plus' ?>"></i>
        <?= $loggedInNav ? 'My Dashboard' : 'Create Account' ?>
      </a>
    </div>
  </div>

</div><!-- /page-wrap -->

<footer class="site-footer">
  <div class="footer-inner">
    <div><div class="footer-logo"><i class="fas fa-paw"></i> Pawster</div><p class="footer-desc">Connecting loving homes with animals in need across the Ilocos Region.</p></div>
    <div class="footer-col"><h4>Navigate</h4><a href="index.php">Home</a><a href="find_a_pet.php">Find a Pet</a><a href="how_it_works.php">How It Works</a><a href="missing.php">Missing Pets</a></div>
    <div class="footer-col"><h4>Actions</h4><a href="rehome.php">Rehome a Pet</a><a href="about.php">About Us</a><?php if($loggedInNav):?><a href="<?=$navDash?>">My Dashboard</a><?php else:?><a href="login.php">Log In</a><?php endif;?></div>
  </div>
  <div class="footer-bottom">&copy; 2025 Pawster. All rights reserved.</div>
</footer>

<script src="../js/how_it_works.js"></script>
<script src="../js/pawster_pages.js"></script>   
</body>
</html>