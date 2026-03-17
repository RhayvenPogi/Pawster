<?php session_start(); $activePage = 'rehome'; require_once 'nav.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Rehome a Pet — Pawster</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../css/pawster_pages.css"/>
  <link rel="stylesheet" href="../css/rehome.css"/>
</head>
<body>
<div class="mesh-bg">
  <div class="mesh-base"></div>
  <div class="orb orb-1"></div><div class="orb orb-2"></div>
  <div class="orb orb-3"></div><div class="orb orb-4"></div>
  <div class="mesh-grid"></div><div class="grain"></div><div class="vignette"></div>
</div>
<div id="toast-wrap"></div>

<div class="page-hero" style="background:linear-gradient(135deg,#7a2808,var(--c2))">
  <div class="hero-tag"><i class="fas fa-home"></i> Rehoming Service</div>
  <h1>Rehome Your <em>Pet</em></h1>
  <p>Life changes. If you can no longer care for your pet, we'll help find them a safe, loving new home with care and discretion.</p>
</div>

<div class="page-wrap">
  <div class="rehome-layout">

    <!-- FORM CARD -->
    <div class="rehome-form-card reveal">
      <h3><i class="fas fa-house-heart" style="color:var(--c2)"></i> Rehoming Request Form</h3>

      <div id="rehome-form-wrap">
        <form id="rehome-form" onsubmit="submitRehome(event)">
          <div class="form-grid" style="gap:1rem">

            <div class="form-field full">
              <label style="font-size:0.78rem;font-weight:900;color:var(--c2);text-transform:uppercase;letter-spacing:0.07em">Your Information</label>
            </div>
            <div class="form-field"><label>Your Name *</label><input type="text" id="rh-name" required placeholder="Full name"/></div>
            <div class="form-field"><label>Phone *</label><input type="tel" id="rh-phone" required placeholder="+63 9XX XXX XXXX"/></div>
            <div class="form-field full"><label>Email *</label><input type="email" id="rh-email" required placeholder="you@email.com"/></div>

            <div class="form-field full" style="margin-top:0.8rem">
              <label style="font-size:0.78rem;font-weight:900;color:var(--c2);text-transform:uppercase;letter-spacing:0.07em">Pet Information</label>
            </div>
            <div class="form-field"><label>Pet Name *</label><input type="text" id="rh-petname" required placeholder="e.g. Max"/></div>
            <div class="form-field"><label>Animal Type *</label>
              <select id="rh-type" required>
                <option value="">Select…</option>
                <option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Other</option>
              </select>
            </div>
            <div class="form-field"><label>Breed</label><input type="text" id="rh-breed" placeholder="e.g. Aspin"/></div>
            <div class="form-field"><label>Age</label><input type="text" id="rh-age" placeholder="e.g. 2 years"/></div>
            <div class="form-field full"><label>Reason for Rehoming *</label>
              <textarea id="rh-reason" required placeholder="Please explain your situation…"></textarea>
            </div>
            <div class="form-field full"><label>Pet's Temperament</label>
              <textarea id="rh-temp" placeholder="Describe personality, behaviour, special needs…" style="min-height:80px"></textarea>
            </div>
            <div class="form-field full">
              <label>Upload a Photo <span style="color:var(--text-muted);font-weight:500">(recommended)</span></label>
              <div class="photo-upload-area" onclick="document.getElementById('rh-photo').click()">
                <input type="file" id="rh-photo" accept="image/*" onchange="previewRehomePhoto(this)" style="display:none"/>
                <i class="fas fa-camera"></i>
                <p>Click to upload a photo of your pet</p>
              </div>
              <div class="photo-preview" id="rh-preview">
                <img id="rh-preview-img" src="" alt="Preview"/>
                <button type="button" onclick="removeRehomePhoto()"><i class="fas fa-times"></i></button>
              </div>
            </div>

          </div><!-- /form-grid -->
          <div style="margin-top:1.5rem;display:flex;gap:0.8rem;flex-wrap:wrap">
            <button type="submit" class="btn-orange" style="flex:1;justify-content:center;min-width:180px">
              <i class="fas fa-paper-plane"></i> Submit Rehoming Request
            </button>
            <a href="index.php" class="btn-secondary" style="justify-content:center">
              <i class="fas fa-arrow-left"></i> Cancel
            </a>
          </div>
        </form>
      </div>

      <div class="success-state" id="rehome-success">
        <div class="big-icon">🏡</div>
        <h3>Request Received!</h3>
        <p>Thank you for reaching out. Our team will review your request and contact you within 2–3 business days to discuss next steps and find the best home for your pet.</p>
        <a href="index.php" class="btn-secondary" style="margin-top:1.5rem;display:inline-flex"><i class="fas fa-house"></i> Back to Home</a>
      </div>
    </div>

    <!-- SIDEBAR -->
    <div class="rehome-sidebar">
      <div class="aside-card reveal">
        <h4><i class="fas fa-list-ol"></i> What Happens Next</h4>
        <div class="process-step"><div class="ps-num">1</div><div class="ps-text">We review your request and contact you within 2–3 days.</div></div>
        <div class="process-step"><div class="ps-num">2</div><div class="ps-text">A home visit may be scheduled to assess your pet's environment.</div></div>
        <div class="process-step"><div class="ps-num">3</div><div class="ps-text">We list your pet and screen potential adopters carefully.</div></div>
        <div class="process-step"><div class="ps-num">4</div><div class="ps-text">Once a match is found, we facilitate the handover with full documentation.</div></div>
      </div>

      <div class="aside-card reveal">
        <h4><i class="fas fa-shield-heart"></i> Our Promise</h4>
        <p style="font-size:0.84rem;font-weight:700;color:var(--text-mid);line-height:1.65">Every pet that comes through Pawster is treated with dignity and care. We never place animals in unsuitable homes and we'll keep you updated throughout the process.</p>
      </div>

      <div class="aside-card reveal">
        <h4><i class="fas fa-question-circle"></i> Common Questions</h4>
        <div style="margin-top:0.5rem">
          <div style="margin-bottom:1rem">
            <div style="font-size:0.82rem;font-weight:800;color:var(--green-dark);margin-bottom:0.3rem">Is there a fee to rehome?</div>
            <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);line-height:1.5">There is no fee for our rehoming service. This is completely free.</div>
          </div>
          <div style="margin-bottom:1rem">
            <div style="font-size:0.82rem;font-weight:800;color:var(--green-dark);margin-bottom:0.3rem">How long does it take?</div>
            <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);line-height:1.5">Finding a match typically takes 1–4 weeks depending on the animal and available adopters.</div>
          </div>
          <div>
            <div style="font-size:0.82rem;font-weight:800;color:var(--green-dark);margin-bottom:0.3rem">Can I choose the new family?</div>
            <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);line-height:1.5">Yes! You'll have a say in approving the new family. We present you with vetted candidates before finalizing.</div>
          </div>
        </div>
      </div>

      <div class="aside-card reveal" style="background:linear-gradient(135deg,rgba(180,90,34,0.08),rgba(212,136,10,0.05));border-color:rgba(180,90,34,0.25)">
        <h4 style="color:var(--c2)"><i class="fas fa-phone" style="color:var(--c2)"></i> Need Help?</h4>
        <p style="font-size:0.84rem;font-weight:700;color:var(--text-mid);line-height:1.65;margin-bottom:0.8rem">Have questions before submitting? Reach out to our team directly.</p>
        <a href="about.php#contact" class="btn-orange" style="display:inline-flex;padding:0.5rem 1.1rem;font-size:0.8rem"><i class="fas fa-envelope"></i> Contact Us</a>
      </div>
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

<script src="../js/rehome.js"></script>
<script src="../js/pawster_pages.js"></script>   
</body>
</html>