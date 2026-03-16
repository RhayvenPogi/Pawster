<?php
/* =============================================
   PAWSTER — HOMEPAGE  (index.php)
   Session-aware: swaps navbar guest ↔ logged-in
   After login → redirect here
   ============================================= */
session_start();

$loggedIn  = isset($_SESSION['user_id']);
$isAdmin   = $loggedIn && ($_SESSION['role'] ?? '') === 'admin';
$isUser    = $loggedIn && ($_SESSION['role'] ?? '') === 'user';

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

$dashLink = $isAdmin ? 'dashboard/admin_dashboard.php' : 'dashboard/user_dashboard.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pawster — Find Your Forever Friend</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <style>
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; cursor:none !important; }

    :root {
      --green-dark:    #1a4a08;
      --green-mid:     #1c4f09;
      --green-border:  #5aaa30;
      --c2:            #B45A22;
      --orange:        #e07820;
      --amber:         #d4880a;
      --red:           #c03030;
      --blue:          #2060a0;
      --text:          #1a2e0a;
      --text-mid:      #3a5020;
      --text-muted:    #6a7a50;
      --surface:       rgba(255,248,225,0.75);
      --surface2:      rgba(255,245,210,0.60);
      --border:        rgba(180,140,60,0.28);
      --border-strong: rgba(90,170,48,0.45);
      --shadow:        0 4px 24px rgba(100,70,20,0.13);
      --shadow-lg:     0 8px 40px rgba(100,70,20,0.20);
      --radius:        18px;
      --nav-h:         70px;
    }

    html { scroll-behavior:smooth; }
    body { font-family:'Nunito',sans-serif; color:var(--text); overflow-x:hidden; }

    /* MESH */
    .mesh-bg { position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none; }
    .mesh-base { position:absolute;inset:0;background:#EDDABB; }
    .orb { position:absolute;border-radius:50%;filter:blur(120px);mix-blend-mode:multiply;opacity:0.48; }
    .orb-1{width:1000px;height:1000px;top:-25%;left:-18%;background:radial-gradient(circle,#588B41,transparent 70%);animation:fl1 9s ease-in-out infinite;}
    .orb-2{width:900px;height:900px;top:8%;right:-20%;background:radial-gradient(circle,#B45A22,transparent 70%);animation:fl2 11s ease-in-out infinite;}
    .orb-3{width:800px;height:800px;bottom:-18%;left:18%;background:radial-gradient(circle,#e8dfc8,transparent 60%);animation:fl3 8s ease-in-out infinite;}
    .orb-4{width:700px;height:700px;top:38%;right:22%;background:radial-gradient(circle,#588B41,transparent 70%);animation:fl4 10s ease-in-out infinite;}
    .mesh-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(100,70,30,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.03) 1px,transparent 1px);background-size:60px 60px;}
    .grain{position:absolute;inset:-50%;width:200%;height:200%;opacity:0.045;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:256px;animation:grain .4s steps(1) infinite;}
    .vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(140,90,30,0.13) 100%);}
    @keyframes fl1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(7%,12%) scale(1.09)}66%{transform:translate(-5%,5%) scale(0.93)}}
    @keyframes fl2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-10%,8%) scale(0.93)}70%{transform:translate(5%,-9%) scale(1.1)}}
    @keyframes fl3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(9%,-7%) scale(1.07)}}
    @keyframes fl4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-9%,-9%) scale(1.11)}}
    @keyframes grain{0%,100%{transform:translate(0,0)}50%{transform:translate(-2%,2%)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
    @keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,0.4)}50%{box-shadow:0 0 0 6px rgba(90,170,48,0)}}

    /* NAVBAR */
    .navbar{position:sticky;top:0;z-index:200;height:var(--nav-h);background:rgba(255,248,218,0.90);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1.5px solid var(--border-strong);box-shadow:0 2px 20px rgba(100,70,20,0.09);display:flex;align-items:center;padding:0 2.5rem;gap:1rem;}
    .nav-brand{display:flex;align-items:center;gap:0.65rem;text-decoration:none;flex-shrink:0;}
    .nav-brand img{width:42px;height:42px;object-fit:contain;}
    .nav-brand-text{font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:800;color:var(--green-dark);}
    .nav-brand-text em{font-style:italic;color:var(--orange);}
    .nav-links{display:flex;align-items:center;gap:0.2rem;margin:0 auto;background:rgba(255,245,210,0.5);border:1.5px solid var(--border);border-radius:50px;padding:0.28rem;}
    .nav-link{display:inline-flex;align-items:center;gap:0.4rem;padding:0.42rem 1rem;border-radius:50px;font-size:0.82rem;font-weight:800;text-decoration:none;color:var(--text-mid);transition:all 0.18s;white-space:nowrap;}
    .nav-link i{font-size:0.75rem;}
    .nav-link:hover{background:rgba(90,170,48,0.15);color:var(--green-dark);}
    .nav-link.active{background:linear-gradient(135deg,rgba(28,79,9,0.16),rgba(90,170,48,0.12));color:var(--green-dark);box-shadow:0 2px 10px rgba(28,79,9,0.12);}
    .nav-link.missing-link{background:rgba(180,90,34,0.09);color:var(--c2);border:1px solid rgba(180,90,34,0.22);}
    .nav-link.missing-link:hover{background:var(--c2);color:#fff;border-color:var(--c2);}
    .nav-right{display:flex;align-items:center;gap:0.6rem;flex-shrink:0;}
    .nav-btn{display:inline-flex;align-items:center;gap:0.45rem;padding:0.48rem 1.1rem;border-radius:10px;font-family:'Nunito',sans-serif;font-size:0.82rem;font-weight:800;text-decoration:none;transition:all 0.18s;border:1.5px solid;}
    .nav-btn-ghost{background:rgba(255,250,232,0.7);border-color:var(--border);color:var(--text-mid);}
    .nav-btn-ghost:hover{background:rgba(255,250,232,0.95);color:var(--green-dark);border-color:var(--green-border);}
    .nav-btn-solid{background:var(--green-mid);color:#fff;border-color:var(--green-mid);box-shadow:0 3px 12px rgba(28,79,9,0.28);}
    .nav-btn-solid:hover{background:#143806;box-shadow:0 5px 18px rgba(28,79,9,0.4);}
    .nav-avatar-btn{display:flex;align-items:center;gap:0.55rem;background:rgba(255,248,220,0.7);border:1.5px solid var(--border);border-radius:50px;padding:0.28rem 0.85rem 0.28rem 0.28rem;cursor:pointer;transition:all 0.18s;position:relative;}
    .nav-avatar-btn:hover{border-color:var(--green-border);background:rgba(255,248,220,0.95);}
    .nav-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--green-mid),#3a8a18);border:2px solid var(--green-border);display:flex;align-items:center;justify-content:center;font-size:0.78rem;font-weight:900;color:#fff;}
    .nav-avatar-name{font-size:0.81rem;font-weight:800;color:var(--green-dark);}
    .nav-avatar-role{font-size:0.64rem;font-weight:700;color:var(--text-muted);}
    .nav-caret{color:var(--text-muted);font-size:0.62rem;transition:transform 0.2s;}
    .nav-avatar-btn.open .nav-caret{transform:rotate(180deg);}
    .profile-drop{display:none;position:absolute;top:calc(100% + 9px);right:0;background:rgba(255,252,235,0.98);border:1.5px solid var(--border);border-radius:14px;min-width:215px;padding:8px;box-shadow:var(--shadow-lg);z-index:999;animation:fadeUp 0.18s ease both;}
    .profile-drop.open{display:block;}
    .pd-user{display:flex;align-items:center;gap:10px;padding:10px 8px 8px;}
    .pd-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--green-mid),#2a7010);border:2px solid var(--green-border);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:0.78rem;}
    .pd-user strong{display:block;font-size:0.86rem;font-weight:800;color:var(--green-dark);}
    .pd-user span{font-size:0.7rem;font-weight:700;color:var(--text-muted);}
    .pd-divider{height:1px;background:var(--border);margin:4px 0;}
    .pd-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;color:var(--text-mid);text-decoration:none;font-size:0.82rem;font-weight:700;transition:all 0.15s;width:100%;text-align:left;border:none;background:none;font-family:'Nunito',sans-serif;}
    .pd-item i{width:15px;color:var(--text-muted);}
    .pd-item:hover{background:rgba(90,170,48,0.1);color:var(--green-dark);}
    .pd-item.danger{color:var(--red);}
    .pd-item.danger:hover{background:rgba(192,48,48,0.1);}
    .nav-logout{display:inline-flex;align-items:center;gap:0.45rem;background:rgba(192,48,48,0.08);border:1.5px solid rgba(192,48,48,0.25);border-radius:9px;padding:0.42rem 0.95rem;font-family:'Nunito',sans-serif;font-size:0.79rem;font-weight:800;color:var(--red);text-decoration:none;transition:all 0.18s;}
    .nav-logout:hover{background:var(--red);color:#fff;border-color:var(--red);}

    /* WELCOME BANNER */
    .welcome-banner{position:relative;z-index:10;background:linear-gradient(135deg,rgba(28,79,9,0.11),rgba(90,170,48,0.07));border-bottom:1.5px solid rgba(90,170,48,0.28);padding:0.85rem 2.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;}
    .wb-left{display:flex;align-items:center;gap:0.7rem;}
    .wb-paw{font-size:1.3rem;}
    .wb-text{font-size:0.88rem;font-weight:800;color:var(--green-dark);}
    .wb-text em{font-style:italic;color:var(--orange);}
    .wb-actions{display:flex;gap:0.6rem;flex-wrap:wrap;}
    .wb-btn{display:inline-flex;align-items:center;gap:0.4rem;background:var(--green-mid);color:#fff;padding:0.38rem 1rem;border-radius:8px;font-size:0.78rem;font-weight:800;text-decoration:none;font-family:'Nunito',sans-serif;transition:all 0.18s;}
    .wb-btn:hover{background:#143806;}
    .wb-btn-orange{background:var(--c2);}
    .wb-btn-orange:hover{background:#8a3010;}

    /* HERO */
    .hero{position:relative;z-index:10;min-height:calc(100vh - var(--nav-h));display:flex;align-items:center;padding:5rem 2.5rem 4rem;max-width:1200px;margin:0 auto;gap:4rem;}
    .hero-left{flex:1;min-width:0;}
    .hero-tag{display:inline-flex;align-items:center;gap:0.5rem;background:rgba(28,79,9,0.09);border:1.5px solid rgba(90,170,48,0.32);border-radius:50px;padding:0.3rem 1rem;font-size:0.72rem;font-weight:800;color:var(--green-mid);text-transform:uppercase;letter-spacing:0.1em;font-style:italic;margin-bottom:1.2rem;animation:fadeUp 0.6s ease both;}
    .hero-tag-dot{width:7px;height:7px;border-radius:50%;background:var(--green-border);animation:dotPulse 2s ease infinite;}
    .hero-title{font-family:'Playfair Display',serif;font-size:clamp(3rem,6vw,5.5rem);font-weight:900;color:var(--green-dark);line-height:1.0;letter-spacing:-1px;text-shadow:0 3px 20px rgba(255,255,255,0.4);animation:fadeUp 0.6s ease 0.1s both;}
    .hero-title em{font-style:italic;color:var(--orange);}
    .hero-title .line2{display:block;}
    .hero-sub{font-size:1.05rem;font-weight:700;color:var(--text-mid);margin-top:1.2rem;line-height:1.7;max-width:480px;animation:fadeUp 0.6s ease 0.2s both;}
    .hero-actions{display:flex;align-items:center;gap:0.9rem;margin-top:2rem;flex-wrap:wrap;animation:fadeUp 0.6s ease 0.3s both;}
    .btn-primary{display:inline-flex;align-items:center;gap:0.6rem;background:var(--green-mid);color:#fff;padding:0.85rem 2rem;border-radius:13px;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:900;text-decoration:none;border:none;box-shadow:0 6px 24px rgba(28,79,9,0.32);transition:all 0.2s;}
    .btn-primary:hover{background:#143806;transform:translateY(-2px);box-shadow:0 10px 32px rgba(28,79,9,0.42);}
    .btn-secondary{display:inline-flex;align-items:center;gap:0.6rem;background:rgba(255,248,220,0.75);color:var(--text-mid);padding:0.85rem 1.8rem;border-radius:13px;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:800;text-decoration:none;border:1.5px solid var(--border);transition:all 0.2s;}
    .btn-secondary:hover{background:rgba(255,248,220,0.98);color:var(--green-dark);border-color:var(--green-border);transform:translateY(-2px);}
    .btn-orange{display:inline-flex;align-items:center;gap:0.6rem;background:var(--c2);color:#fff;padding:0.85rem 1.8rem;border-radius:13px;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:900;text-decoration:none;border:none;box-shadow:0 6px 24px rgba(180,90,34,0.28);transition:all 0.2s;}
    .btn-orange:hover{background:#8a3010;transform:translateY(-2px);}
    .hero-stats{display:flex;align-items:center;gap:2rem;margin-top:2.8rem;animation:fadeUp 0.6s ease 0.4s both;}
    .hero-stat-val{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:var(--green-dark);line-height:1;}
    .hero-stat-lbl{font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;}
    .hero-stat-div{width:1px;height:36px;background:var(--border);}
    .hero-right{flex-shrink:0;width:420px;display:grid;grid-template-columns:1fr 1fr;gap:14px;animation:scaleIn 0.7s ease 0.3s both;}
    .pet-card{background:var(--surface);backdrop-filter:blur(16px);border:1.5px solid var(--border);border-radius:18px;padding:1.4rem 1.2rem;text-align:center;box-shadow:var(--shadow);transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s;position:relative;overflow:hidden;}
    .pet-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.20) 0%,transparent 55%);pointer-events:none;}
    .pet-card:hover{transform:translateY(-5px) rotate(-1deg);box-shadow:var(--shadow-lg);border-color:rgba(90,170,48,0.4);}
    .pet-card.tall{grid-row:span 2;display:flex;flex-direction:column;justify-content:center;}
    .pet-card.featured{border-color:rgba(90,170,48,0.4);background:rgba(255,248,215,0.85);}
    .pet-emoji{font-size:3.2rem;display:block;margin-bottom:0.7rem;animation:float 4s ease-in-out infinite;}
    .pet-card.tall .pet-emoji{font-size:4.5rem;}
    .pet-name{font-size:0.98rem;font-weight:900;color:var(--green-dark);}
    .pet-breed{font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-top:0.15rem;}
    .pet-badge{display:inline-block;margin-top:0.6rem;background:rgba(90,170,48,0.15);color:var(--green-mid);border:1px solid rgba(90,170,48,0.3);font-size:0.62rem;font-weight:800;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;}
    .pet-badge.orange{background:rgba(180,90,34,0.12);color:var(--c2);border-color:rgba(180,90,34,0.28);}

    /* SECTIONS */
    .section{position:relative;z-index:10;max-width:1200px;margin:0 auto;padding:5rem 2.5rem;}
    .sec-tag{display:inline-flex;align-items:center;gap:0.4rem;background:rgba(28,79,9,0.08);border:1.5px solid rgba(90,170,48,0.28);border-radius:50px;padding:0.24rem 0.85rem;font-size:0.67rem;font-weight:800;color:var(--green-mid);text-transform:uppercase;letter-spacing:0.1em;font-style:italic;margin-bottom:0.9rem;}
    .sec-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,3.5vw,3rem);font-weight:900;color:var(--green-dark);line-height:1.1;margin-bottom:1rem;}
    .sec-title em{font-style:italic;color:var(--orange);}
    .sec-sub{font-size:0.95rem;font-weight:700;color:var(--text-mid);max-width:500px;line-height:1.7;}

    /* HOW IT WORKS */
    .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:3rem;}
    .step-card{background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);padding:2rem 1.6rem;position:relative;overflow:hidden;box-shadow:var(--shadow);transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s;}
    .step-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 55%);pointer-events:none;}
    .step-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:rgba(90,170,48,0.4);}
    .step-num{font-family:'Playfair Display',serif;font-size:3.5rem;font-weight:900;line-height:1;color:rgba(28,79,9,0.10);position:absolute;top:1rem;right:1.2rem;}
    .step-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:1.2rem;}
    .step-icon.green{background:rgba(28,79,9,0.12);color:var(--green-mid);}
    .step-icon.orange{background:rgba(180,90,34,0.12);color:var(--c2);}
    .step-icon.amber{background:rgba(212,136,10,0.12);color:var(--amber);}
    .step-title{font-size:1.05rem;font-weight:900;color:var(--green-dark);margin-bottom:0.5rem;}
    .step-desc{font-size:0.85rem;font-weight:700;color:var(--text-muted);line-height:1.65;}

    /* FEATURED PETS */
    .pets-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.2rem;margin-top:2.8rem;}
    .fp-card{background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s;cursor:pointer;}
    .fp-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg);border-color:rgba(90,170,48,0.42);}
    .fp-img{height:160px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:linear-gradient(135deg,rgba(255,248,220,0.6),rgba(255,240,200,0.4));border-bottom:1.5px solid var(--border);}
    .fp-body{padding:1rem 1.1rem 1.2rem;}
    .fp-name{font-size:0.98rem;font-weight:900;color:var(--green-dark);}
    .fp-meta{font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-top:0.2rem;font-family:'DM Mono',monospace;}
    .fp-tags{display:flex;gap:5px;margin-top:0.65rem;flex-wrap:wrap;}
    .fp-tag{font-size:0.6rem;font-weight:800;padding:2px 7px;border-radius:20px;text-transform:uppercase;letter-spacing:0.04em;}
    .fp-tag.green{background:rgba(90,170,48,0.14);color:var(--green-mid);}
    .fp-tag.orange{background:rgba(180,90,34,0.13);color:var(--c2);}
    .fp-tag.blue{background:rgba(32,96,160,0.11);color:var(--blue);}
    .fp-tag.amber{background:rgba(212,136,10,0.12);color:var(--amber);}
    .fp-adopt-btn{display:flex;align-items:center;justify-content:center;gap:0.4rem;margin-top:0.9rem;padding:0.55rem;background:rgba(28,79,9,0.08);border:1.5px solid rgba(90,170,48,0.3);border-radius:9px;font-size:0.78rem;font-weight:800;color:var(--green-mid);transition:all 0.18s;}
    .fp-card:hover .fp-adopt-btn{background:var(--green-mid);color:#fff;border-color:var(--green-mid);}

    /* STATS BAND */
    .stats-band{position:relative;z-index:10;background:rgba(255,248,220,0.65);backdrop-filter:blur(14px);border-top:1.5px solid var(--border-strong);border-bottom:1.5px solid var(--border-strong);padding:3rem 2.5rem;}
    .stats-band-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;text-align:center;}
    .sb-val{font-family:'Playfair Display',serif;font-size:3rem;font-weight:900;color:var(--green-dark);line-height:1;}
    .sb-val em{font-style:italic;color:var(--orange);}
    .sb-lbl{font-size:0.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;margin-top:0.4rem;}

    /* MISSING ALERT BANNER */
    .missing-alert-band{position:relative;z-index:10;background:linear-gradient(135deg,rgba(180,90,34,0.12),rgba(212,136,10,0.08));border-top:1.5px solid rgba(180,90,34,0.25);border-bottom:1.5px solid rgba(180,90,34,0.25);padding:1.2rem 2.5rem;}
    .mab-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap;}
    .mab-icon{font-size:1.8rem;flex-shrink:0;}
    .mab-text{flex:1;}
    .mab-title{font-size:0.95rem;font-weight:900;color:var(--green-dark);}
    .mab-sub{font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-top:2px;}
    .mab-btn{display:inline-flex;align-items:center;gap:0.45rem;background:var(--c2);color:#fff;padding:0.55rem 1.3rem;border-radius:9px;font-size:0.82rem;font-weight:800;text-decoration:none;font-family:'Nunito',sans-serif;transition:all 0.18s;white-space:nowrap;flex-shrink:0;}
    .mab-btn:hover{background:#8a3010;transform:translateY(-1px);}

    /* REHOME */
    .rehome-banner{position:relative;z-index:10;max-width:1200px;margin:0 auto;padding:0 2.5rem 5rem;}
    .rehome-card{background:linear-gradient(135deg,rgba(180,90,34,0.10),rgba(212,136,10,0.08));border:1.5px solid rgba(180,90,34,0.28);border-radius:24px;padding:3.5rem;display:flex;align-items:center;gap:3rem;position:relative;overflow:hidden;box-shadow:0 8px 40px rgba(180,90,34,0.12);}
    .rehome-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 55%);pointer-events:none;}
    .rehome-icon{font-size:5rem;flex-shrink:0;animation:float 5s ease-in-out infinite;}
    .rehome-body{flex:1;}
    .rehome-title{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:900;color:var(--green-dark);margin-bottom:0.8rem;}
    .rehome-title em{font-style:italic;color:var(--c2);}
    .rehome-desc{font-size:0.95rem;font-weight:700;color:var(--text-mid);line-height:1.7;max-width:520px;margin-bottom:1.5rem;}
    .rehome-btn{display:inline-flex;align-items:center;gap:0.55rem;background:var(--c2);color:#fff;padding:0.8rem 1.8rem;border-radius:12px;font-family:'Nunito',sans-serif;font-size:0.9rem;font-weight:900;text-decoration:none;box-shadow:0 5px 20px rgba(180,90,34,0.3);transition:all 0.2s;}
    .rehome-btn:hover{background:#8a3010;transform:translateY(-2px);}

    /* TESTIMONIALS */
    .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.3rem;margin-top:2.8rem;}
    .testi-card{background:var(--surface);backdrop-filter:blur(14px);border:1.5px solid var(--border);border-radius:var(--radius);padding:1.8rem 1.6rem;box-shadow:var(--shadow);transition:transform 0.2s,box-shadow 0.2s;position:relative;overflow:hidden;}
    .testi-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 55%);pointer-events:none;}
    .testi-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);}
    .testi-stars{color:var(--amber);font-size:0.85rem;margin-bottom:0.9rem;letter-spacing:2px;}
    .testi-text{font-size:0.88rem;font-weight:700;color:var(--text-mid);line-height:1.72;font-style:italic;margin-bottom:1.2rem;}
    .testi-author{display:flex;align-items:center;gap:0.7rem;}
    .testi-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--green-mid),#3a8a18);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.78rem;font-weight:900;border:2px solid var(--green-border);flex-shrink:0;}
    .testi-name{font-size:0.84rem;font-weight:900;color:var(--green-dark);}
    .testi-loc{font-size:0.68rem;font-weight:700;color:var(--text-muted);}

    /* CTA */
    .cta-section{position:relative;z-index:10;padding:5rem 2.5rem 6rem;}
    .cta-card{max-width:780px;margin:0 auto;background:linear-gradient(135deg,rgba(28,79,9,0.13),rgba(90,170,48,0.08));border:1.5px solid rgba(90,170,48,0.4);border-radius:28px;padding:4rem 3rem;text-align:center;box-shadow:0 12px 50px rgba(28,79,9,0.14);position:relative;overflow:hidden;}
    .cta-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.22) 0%,transparent 55%);pointer-events:none;}
    .cta-card::after{content:'🐾';position:absolute;font-size:8rem;opacity:0.04;bottom:-1rem;right:1rem;pointer-events:none;}
    .cta-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:900;color:var(--green-dark);margin-bottom:1rem;line-height:1.1;}
    .cta-title em{font-style:italic;color:var(--orange);}
    .cta-sub{font-size:0.95rem;font-weight:700;color:var(--text-mid);margin-bottom:2rem;line-height:1.7;}
    .cta-btns{display:flex;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap;}

    /* FOOTER */
    .footer{position:relative;z-index:10;background:rgba(255,248,218,0.85);backdrop-filter:blur(16px);border-top:1.5px solid var(--border-strong);padding:3rem 2.5rem 2rem;}
    .footer-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3rem;}
    .footer-brand img{width:40px;height:40px;object-fit:contain;margin-bottom:0.8rem;}
    .footer-brand-name{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:800;color:var(--green-dark);}
    .footer-brand-name em{font-style:italic;color:var(--orange);}
    .footer-desc{font-size:0.82rem;font-weight:700;color:var(--text-muted);margin-top:0.6rem;line-height:1.7;max-width:260px;}
    .footer-col-title{font-size:0.72rem;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;color:var(--green-mid);margin-bottom:1rem;}
    .footer-link{display:block;font-size:0.83rem;font-weight:700;color:var(--text-mid);text-decoration:none;margin-bottom:0.5rem;transition:color 0.15s;}
    .footer-link:hover{color:var(--green-dark);}
    .footer-bottom{max-width:1200px;margin:2.5rem auto 0;padding-top:1.5rem;border-top:1.5px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;}
    .footer-copy{font-size:0.75rem;font-weight:700;color:var(--text-muted);}
    .footer-socials{display:flex;gap:0.6rem;}
    .footer-social{width:32px;height:32px;border-radius:8px;background:rgba(255,250,232,0.7);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.8rem;text-decoration:none;transition:all 0.15s;}
    .footer-social:hover{background:rgba(90,170,48,0.14);color:var(--green-mid);border-color:var(--green-border);}

    /* DOG CURSOR */
    #dc{position:fixed;z-index:99999;pointer-events:none;width:28px;height:28px;transform:translate(-50%,-50%);}
    #dc svg{overflow:visible;}
    @keyframes lfw{0%,100%{transform-origin:30px 28px;transform:rotate(-22deg)}50%{transform-origin:30px 28px;transform:rotate(22deg)}}
    @keyframes lbw{0%,100%{transform-origin:14px 28px;transform:rotate(22deg)}50%{transform-origin:14px 28px;transform:rotate(-22deg)}}
    @keyframes tw{0%,100%{transform-origin:8px 18px;transform:rotate(-18deg)}50%{transform-origin:8px 18px;transform:rotate(18deg)}}
    @keyframes bb{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
    @keyframes ef{0%,100%{transform-origin:36px 10px;transform:rotate(0)}50%{transform-origin:36px 10px;transform:rotate(8deg)}}
    @keyframes ss{0%{transform:translateY(0)}40%{transform:translateY(-3px)}100%{transform:translateY(0)}}
    @keyframes pt{0%,100%{transform-origin:30px 28px;transform:rotate(0)}50%{transform-origin:30px 28px;transform:rotate(-30deg)}}
    #dc.walking #dog-body{animation:bb .28s ease-in-out infinite;}
    #dc.walking #dog-leg-front{animation:lfw .28s ease-in-out infinite;}
    #dc.walking #dog-leg-back{animation:lbw .28s ease-in-out infinite;}
    #dc.walking #dog-tail{animation:tw .28s ease-in-out infinite;}
    #dc.walking #dog-ear{animation:ef .32s ease-in-out infinite;}
    #dc.idle #dog-tail{animation:tw .6s ease-in-out infinite;}
    #dc.clicking #dog-body{animation:ss .2s ease-out forwards;}
    #dc.clicking #dog-leg-front{animation:pt .18s ease-in-out 2;}

    /* SCROLL REVEAL */
    .reveal{opacity:0;transform:translateY(22px);transition:opacity 0.6s ease,transform 0.6s ease;}
    .reveal.visible{opacity:1;transform:translateY(0);}
    .reveal-delay-1{transition-delay:.1s;}
    .reveal-delay-2{transition-delay:.2s;}
    .reveal-delay-3{transition-delay:.3s;}
    .reveal-delay-4{transition-delay:.4s;}

    /* RESPONSIVE */
    @media(max-width:1024px){.hero{flex-direction:column;text-align:center;padding:4rem 2rem 3rem;gap:3rem;}.hero-right{width:100%;max-width:420px;margin:0 auto;}.hero-stats,.hero-actions{justify-content:center;}.hero-sub{margin-left:auto;margin-right:auto;}.pets-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:768px){.nav-links{display:none;}.steps-grid,.testi-grid{grid-template-columns:1fr;}.stats-band-inner{grid-template-columns:repeat(2,1fr);}.footer-inner{grid-template-columns:1fr 1fr;gap:2rem;}.rehome-card{flex-direction:column;text-align:center;padding:2.5rem;}.rehome-icon{font-size:4rem;}.mab-inner{flex-direction:column;text-align:center;}}
    @media(max-width:500px){.pets-grid{grid-template-columns:1fr;}.hero-right{grid-template-columns:1fr 1fr;}.section{padding:3.5rem 1.4rem;}.hero{padding:3rem 1.4rem 2.5rem;}}
  </style>
</head>
<body>

<!-- MESH -->
<div class="mesh-bg">
  <div class="mesh-base"></div>
  <div class="orb orb-1"></div><div class="orb orb-2"></div>
  <div class="orb orb-3"></div><div class="orb orb-4"></div>
  <div class="mesh-grid"></div><div class="grain"></div><div class="vignette"></div>
</div>

<!-- NAVBAR -->
<nav class="navbar">
  <a class="nav-brand" href="index.php">
    <img src="images/logo.png" alt="Pawster"/>
    <span class="nav-brand-text">Paw<em>ster</em></span>
  </a>
  <div class="nav-links">
    <a class="nav-link active" href="index.php"><i class="fas fa-house"></i> Home</a>
    <a class="nav-link" href="#pets"><i class="fas fa-search"></i> Find a Pet</a>
    <a class="nav-link" href="#how"><i class="fas fa-info-circle"></i> How It Works</a>
    <a class="nav-link" href="#rehome"><i class="fas fa-home"></i> Rehome</a>
    <a class="nav-link missing-link" href="missing.php"><i class="fas fa-search-location"></i> Missing Pets</a>
    <a class="nav-link" href="#about"><i class="fas fa-paw"></i> About</a>
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
            <div>
              <strong><?= $firstName ?></strong>
              <span><?= htmlspecialchars($_SESSION['email'] ?? '') ?></span>
            </div>
          </div>
          <div class="pd-divider"></div>
          <a class="pd-item" href="<?= $dashLink ?>"><i class="fas fa-th-large"></i>My Dashboard</a>
          <a class="pd-item" href="missing.php"><i class="fas fa-search-location"></i>Missing Pets</a>
          <?php if ($isAdmin): ?>
          <a class="pd-item" href="dashboard/admin_dashboard.php"><i class="fas fa-shield-alt"></i>Admin Panel</a>
          <?php endif; ?>
          <div class="pd-divider"></div>
          <a class="pd-item danger" href="dashboard/logout.php"><i class="fas fa-sign-out-alt"></i>Log Out</a>
        </div>
      </div>
      <a class="nav-logout" href="dashboard/logout.php"><i class="fas fa-sign-out-alt"></i> Log Out</a>
    <?php else: ?>
      <a class="nav-btn nav-btn-ghost" href="login.html"><i class="fas fa-sign-in-alt"></i> Log In</a>
      <a class="nav-btn nav-btn-solid" href="register.html"><i class="fas fa-paw"></i> Get Started</a>
    <?php endif; ?>
  </div>
</nav>

<?php if ($loggedIn): ?>
<!-- WELCOME BANNER -->
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
        <a class="btn-secondary" href="register.html"><i class="fas fa-user-plus"></i> Create Account</a>
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
        <div class="fp-adopt-btn"><i class="fas fa-heart"></i> Adopt Bruno</div>
      </div>
    </div>
    <div class="fp-card reveal reveal-delay-2">
      <div class="fp-img">🐈</div>
      <div class="fp-body">
        <div class="fp-name">Luna</div>
        <div class="fp-meta">Tabby Cat · Female · 1 yr · Vigan City</div>
        <div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag orange">Playful</span></div>
        <div class="fp-adopt-btn"><i class="fas fa-heart"></i> Adopt Luna</div>
      </div>
    </div>
    <div class="fp-card reveal reveal-delay-3">
      <div class="fp-img">🐩</div>
      <div class="fp-body">
        <div class="fp-name">Mochi</div>
        <div class="fp-meta">Shih Tzu · Female · 3 yrs · San Fernando</div>
        <div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag blue">Calm</span><span class="fp-tag amber">Vaccinated</span></div>
        <div class="fp-adopt-btn"><i class="fas fa-heart"></i> Adopt Mochi</div>
      </div>
    </div>
    <div class="fp-card reveal reveal-delay-4">
      <div class="fp-img">🐈‍⬛</div>
      <div class="fp-body">
        <div class="fp-name">Shadow</div>
        <div class="fp-meta">Black Cat · Male · 2 yrs · Dagupan City</div>
        <div class="fp-tags"><span class="fp-tag green">Healthy</span><span class="fp-tag orange">Independent</span></div>
        <div class="fp-adopt-btn"><i class="fas fa-heart"></i> Adopt Shadow</div>
      </div>
    </div>
  </div>
  <div style="text-align:center;margin-top:2.2rem" class="reveal">
    <a class="btn-secondary" href="<?= $loggedIn ? $dashLink : 'register.html' ?>" style="display:inline-flex">
      <i class="fas fa-th-large"></i> <?= $loggedIn ? 'View All in Dashboard' : 'Sign Up to See All Animals' ?>
    </a>
  </div>
</section>

<!-- REHOME BANNER -->
<div class="rehome-banner" id="rehome">
  <div class="rehome-card reveal">
    <div class="rehome-icon">🏡</div>
    <div class="rehome-body">
      <h2 class="rehome-title">Need to <em>Rehome</em> Your Pet?</h2>
      <p class="rehome-desc">Life circumstances change. If you're unable to care for your pet, Pawster can help find them a safe, loving new home with care and discretion.</p>
      <a class="rehome-btn" href="<?= $loggedIn ? $dashLink : 'register.html' ?>">
        <i class="fas fa-home"></i> <?= $loggedIn ? 'Submit Rehome Request' : 'Create Account to Rehome' ?>
      </a>
    </div>
  </div>
</div>

<!-- TESTIMONIALS -->
<section class="section" id="about">
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
        <a class="btn-primary" href="register.html"><i class="fas fa-paw"></i> Create Free Account</a>
        <a class="btn-secondary" href="login.html" style="display:inline-flex"><i class="fas fa-sign-in-alt"></i> Log In</a>
      <?php endif; ?>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="images/logo.png" alt="Pawster"/>
      <div class="footer-brand-name">Paw<em>ster</em></div>
      <p class="footer-desc">Connecting loving homes with animals in need across the Ilocos Region since 2023.</p>
    </div>
    <div>
      <div class="footer-col-title">Adopt</div>
      <a class="footer-link" href="#pets">Browse Animals</a>
      <a class="footer-link" href="#how">How It Works</a>
      <a class="footer-link" href="missing.php">Missing Pets</a>
      <?php if (!$loggedIn): ?>
      <a class="footer-link" href="register.html">Create Account</a>
      <a class="footer-link" href="login.html">Log In</a>
      <?php else: ?>
      <a class="footer-link" href="<?= $dashLink ?>">My Dashboard</a>
      <a class="footer-link" href="dashboard/logout.php">Log Out</a>
      <?php endif; ?>
    </div>
    <div>
      <div class="footer-col-title">Services</div>
      <a class="footer-link" href="#rehome">Rehome a Pet</a>
      <a class="footer-link" href="missing.php">Report Missing Pet</a>
      <a class="footer-link" href="#">Follow-up Surveys</a>
      <a class="footer-link" href="#">Health Resources</a>
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
(function(){
  const el=document.getElementById('dc');
  let mX=innerWidth/2,mY=innerHeight/2,dX=mX,dY=mY,fr=true,ic=false;
  document.addEventListener('mousemove',e=>{mX=e.clientX;mY=e.clientY;});
  document.addEventListener('mousedown',()=>{ic=true;el.className='clicking';setTimeout(()=>{ic=false;},300);});
  (function loop(){
    if(!ic){const dx=mX-dX,dy=mY-dY,d=Math.sqrt(dx*dx+dy*dy);if(d>5){dX+=(dx/d)*Math.min(d*.13,18);dY+=(dy/d)*Math.min(d*.13,18);const right=dx>0;if(right!==fr){fr=right;document.getElementById('dog-svg').style.transform=fr?'scaleX(1)':'scaleX(-1)';}el.className=d>7?'walking':'idle';}else{el.className='idle';}}
    el.style.left=dX+'px';el.style.top=dY+'px';requestAnimationFrame(loop);
  })();
}());
(function(){
  const orbs=[{el:document.querySelector('.orb-1'),fx:.08,fy:.06},{el:document.querySelector('.orb-2'),fx:-.10,fy:.07},{el:document.querySelector('.orb-3'),fx:.11,fy:-.06},{el:document.querySelector('.orb-4'),fx:-.07,fy:-.09}];
  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-.5)*70;my=(e.clientY/innerHeight-.5)*70;});
  (function anim(){cx+=(mx-cx)*.07;cy+=(my-cy)*.07;orbs.forEach(({el,fx,fy})=>{if(el){el.style.marginLeft=(cx*fx)+'px';el.style.marginTop=(cy*fy)+'px';}});requestAnimationFrame(anim);})();
}());
(function(){
  const els=document.querySelectorAll('.reveal');
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:0.12});
  els.forEach(el=>io.observe(el));
}());
(function(){
  const btn=document.getElementById('avatarBtn');
  const drop=document.getElementById('profileDrop');
  if(!btn||!drop)return;
  btn.addEventListener('click',e=>{e.stopPropagation();const o=drop.classList.toggle('open');btn.classList.toggle('open',o);});
  document.addEventListener('click',()=>{drop&&drop.classList.remove('open');btn&&btn.classList.remove('open');});
}());
(function(){
  const links=document.querySelectorAll('.nav-link[href^="#"]');
  const sections=[...links].map(l=>document.querySelector(l.getAttribute('href'))).filter(Boolean);
  window.addEventListener('scroll',()=>{const scroll=window.scrollY+120;let active=0;sections.forEach((sec,i)=>{if(sec.offsetTop<=scroll)active=i;});links.forEach((l,i)=>l.classList.toggle('active',i===active));},{passive:true});
}());
</script>
</body>
</html>