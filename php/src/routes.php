<?php

declare(strict_types=1);

use App\Core\Router;
use App\Controllers\ProductController;
use App\Controllers\AdminDashboardController;

$router = new Router();

// ── Public routes ─────────────────────────────────────────────────────────────
$router->get('/health', fn() => print json_encode([
    'status'  => 'ok',
    'service' => 'php-api',
]));

// ── Admin dashboard (all actions handled by one controller) ───────────────────
// The React frontend calls admin_dashboard.php?action=xxx via POST.
// Here we wire GET + POST to the same handler so both work.
$router->get('/admin/dashboard',  [AdminDashboardController::class, 'handle']);
$router->post('/admin/dashboard', [AdminDashboardController::class, 'handle']);


// ── Dispatch ──────────────────────────────────────────────────────────────────
$router->dispatch();