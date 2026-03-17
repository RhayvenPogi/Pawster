<?php
/* =============================================
   PAWSTER — SHARED NAV INCLUDE
   php/nav.php
   ============================================= */
if (!isset($activePage)) $activePage = '';
$loggedInNav = isset($_SESSION['user_id']);
$isAdminNav  = $loggedInNav && ($_SESSION['role'] ?? '') === 'admin';
$navFirst    = htmlspecialchars($_SESSION['first_name'] ?? '');
$navInit     = strtoupper(substr($_SESSION['first_name'] ?? 'U', 0, 1) . substr($_SESSION['last_name'] ?? '', 0, 1));
$navDash     = $isAdminNav ? 'admin_dashboard.php' : 'user_dashboard.php';
$navEmail    = htmlspecialchars($_SESSION['email'] ?? '');
?>
<nav>
  <div class="nav-inner">
    <a href="index.php" class="logo">
      <img src="../images/logo.png" alt="Pawster" style="width:34px;height:34px;object-fit:contain;border-radius:50%"/>
      <span>Paw<em style="font-style:italic;color:var(--orange)">ster</em></span>
    </a>
    <ul class="nav-links">
      <li><a href="index.php"        <?= $activePage==='home'   ?'class="active"':'' ?>><i class="fas fa-house"></i> Home</a></li>
      <li><a href="find_a_pet.php"   <?= $activePage==='pets'   ?'class="active"':'' ?>><i class="fas fa-search"></i> Find a Pet</a></li>
      <li><a href="how_it_works.php" <?= $activePage==='how'    ?'class="active"':'' ?>><i class="fas fa-info-circle"></i> How It Works</a></li>
      <li><a href="rehome.php"       <?= $activePage==='rehome' ?'class="active"':'' ?>><i class="fas fa-home"></i> Rehome</a></li>
      <li><a href="missing.php"      <?= $activePage==='missing'?'class="active"':'' ?> style="background:rgba(180,90,34,0.09);color:var(--c2);border:1px solid rgba(180,90,34,0.22);border-radius:50px"><i class="fas fa-search-location"></i> Missing Pets</a></li>
      <li><a href="about.php"        <?= $activePage==='about'  ?'class="active"':'' ?>><i class="fas fa-paw"></i> About</a></li>
    </ul>
    <div class="nav-right">
      <?php if ($loggedInNav): ?>
        <div class="nav-avatar-btn" id="avatarBtn">
          <div class="nav-avatar"><?= $navInit ?></div>
          <div>
            <div class="nav-avatar-name"><?= $navFirst ?></div>
            <div class="nav-avatar-role"><?= $isAdminNav ? 'Admin' : 'Member' ?></div>
          </div>
          <i class="fas fa-chevron-down nav-caret"></i>
          <div class="profile-drop" id="profileDrop">
            <div class="pd-user">
              <div class="pd-avatar"><?= $navInit ?></div>
              <div><strong><?= $navFirst ?></strong><span><?= $navEmail ?></span></div>
            </div>
            <div class="pd-divider"></div>
            <a class="pd-item" href="<?= $navDash ?>"><i class="fas fa-th-large"></i>My Dashboard</a>
            <a class="pd-item" href="missing.php"><i class="fas fa-search-location"></i>Missing Pets</a>
            <?php if ($isAdminNav): ?>
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
  </div>
</nav>
<?php if ($loggedInNav): ?>
<div class="welcome-banner">
  <div class="wb-left">
    <span class="wb-paw">🐾</span>
    <span class="wb-text">Welcome back, <em><?= $navFirst ?></em>!</span>
  </div>
  <div class="wb-actions">
    <a class="wb-btn" href="<?= $navDash ?>"><i class="fas fa-th-large"></i> Dashboard</a>
    <a class="wb-btn wb-btn-orange" href="missing.php"><i class="fas fa-search-location"></i> Missing Pets</a>
  </div>
</div>
<?php endif; ?>