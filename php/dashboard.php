<?php
session_start();

// 1. Protection Layer: Redirect to login if session doesn't exist
if (!isset($_SESSION['user_id'])) {
    header("Location: login.html");
    exit();
}

// 2. Database Connection (Optional: only if you need to fetch more pet/user data)
$host = "localhost"; $port = "5432"; $dbname = "pawster_db";
$user = "postgres"; $password = "1234";
$dbconn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

// Fetching user details using the ID stored in the session
$user_id = $_SESSION['user_id'];
$query = "SELECT first_name, email FROM users WHERE id = $1";
$result = pg_query_params($dbconn, $query, array($user_id));
$user_data = pg_fetch_assoc($result);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pawster - Dashboard</title>
    <link rel="stylesheet" href="../css/dashboard.css" />
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body>
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

  <nav class="navbar">
      <div class="nav-content">
          <img src="../images/logo.png" alt="Logo" class="nav-logo">
          <div class="nav-links">
              <a href="#" class="active">Dashboard</a>
              <a href="#">Explore Pets</a>
              <a href="php/logout.php" class="logout-btn">Logout</a>
          </div>
      </div>
  </nav>

  <main class="dashboard-panel">
      <header class="welcome-header">
          <h1>Welcome, <?php echo htmlspecialchars($_SESSION['first_name']); ?>! 🐾</h1>
          <p>Ready to find your new best friend?</p>
      </header>

      <div class="stats-row">
          <div class="glass-card">
              <span class="card-icon">❤️</span>
              <h3>4</h3>
              <p>Favorites</p>
          </div>
          <div class="glass-card">
              <span class="card-icon">📩</span>
              <h3>1</h3>
              <p>Applications</p>
          </div>
          <div class="glass-card">
              <span class="card-icon">🦴</span>
              <h3>12</h3>
              <p>Nearby Pets</p>
          </div>
      </div>
  </main>

  <script src="js/dashboard.js" defer></script> 
</body>
</html>