# PAWSTER — PHP Backend

## 📁 File Structure

<!-- AUTO:START -->
> 🔍 **Auto-generated documentation** — last updated: 2026-04-03 18:07:38 UTC
> Run `node scripts/generate-readme.js php` to refresh.

---

## 🏗️ Architecture Overview

PAWSTER's PHP backend uses a lightweight custom MVC structure. All HTTP requests are funneled through `index.php` via Apache's `.htaccess` rewrite rules. The router matches method + URI and dispatches to the correct Controller. Protected routes pass through `JwtMiddleware` which validates the `Authorization: Bearer` header before the controller executes.

## 📁 Project Structure

| File                                    | Role                                       |
| --------------------------------------- | ------------------------------------------ |
| composer.json                           | PHP dependency manifest                    |
| Controller\AdminDashboardController.php | Controller — handles HTTP requests         |
| Core\Router.php                         | Custom HTTP router (method + URI matching) |
| index.php                               | Entry point — bootstraps app, loads router |
| Middleware\JwtMiddleware.php            | Request middleware (JWT validation)        |
| src\routes.php                          | All route definitions                      |

## 🔐 Authentication Flow

```
1. POST /api/auth/login    → Validate credentials against DB
                          → Generate signed JWT
                          → Return { token, user }

2. Protected Request       → Client sends: Authorization: Bearer <token>
                          → JwtMiddleware::handle() validates token
                          → Valid: Controller runs
                          → Invalid: 401 Unauthorized
```

**Middleware:**
- JwtMiddleware — validates Bearer token on protected routes

## 🌐 API Endpoints

### /root

| Method | Path      | Auth | Handler                           |
| ------ | --------- | ---- | --------------------------------- |
| GET    | /products | No   | ProductController::class, 'index' |
| POST   | /products | No   | ProductController::class, 'store' |

### /dashboard

| Method | Path             | Auth | Handler                                   |
| ------ | ---------------- | ---- | ----------------------------------------- |
| GET    | /admin/dashboard | No   | AdminDashboardController::class, 'handle' |
| POST   | /admin/dashboard | No   | AdminDashboardController::class, 'handle' |

## 🗄️ Data Flow

```
HTTP Request
   └─► .htaccess           (rewrites all to index.php)
         └─► index.php     (bootstraps app)
               └─► Router  (matches method + URI)
                     └─► JwtMiddleware (if protected)
                           └─► Controller::method()
                                 └─► PDO / DB
                                       └─► JSON Response
```


## 📂 File Tree

```
php/
├── Controller/
│   └── AdminDashboardController.php
├── Core/
│   └── Router.php
├── Middleware/
│   └── JwtMiddleware.php
├── src/
│   └── routes.php
├── ./
│   ├── Controller/
│   │   └── AdminDashboardController.php
│   ├── Core/
│   │   └── Router.php
│   ├── Dockerfile
│   ├── Middleware/
│   │   └── JwtMiddleware.php
│   ├── README.md
│   ├── composer.json
│   ├── composer.lock
│   ├── index.php
│   ├── public/
│   └── src/
│       └── routes.php
```

<!-- AUTO:END -->
