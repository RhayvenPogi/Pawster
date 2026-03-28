<?php

declare(strict_types=1);

use App\Core\Router;
use App\Controllers\AdminDashboardController;

$router = new Router();

// Public routes
$router->get('/health', fn() => print json_encode([
    'status'  => 'ok',
    'service' => 'php-api',
]));

// Admin dashboard
$router->get('/admin/dashboard',  [AdminDashboardController::class, 'handle']);
$router->post('/admin/dashboard', [AdminDashboardController::class, 'handle']);

// Dispatch
$router->dispatch();