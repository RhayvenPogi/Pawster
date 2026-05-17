# Pawster — PHP Backend: System Flow

> Module-by-module breakdown of how the PHP backend operates within the Pawster system.

---

## 1. Entry Point — `index.php`

Every HTTP request to the PHP service is rewritten by Apache's `.htaccess` rules and lands at `index.php`. This file bootstraps the application: loads Composer's autoloader, sets CORS headers, and hands off to the router.

```
Browser / React Frontend
  └─► Apache (.htaccess rewrites all paths → index.php)
        └─► index.php
              ├─► Composer autoloader
              ├─► CORS headers (for preflight OPTIONS requests)
              └─► require 'src/routes.php'
```

OPTIONS preflight requests are short-circuited with a `200` response before any routing or auth runs.

---

## 2. Routing — `Core/Router.php`

`Router` is a minimal hand-rolled HTTP router. Routes are registered as method + path pairs pointing to a handler. The handler can be either a closure or a `[ClassName::class, 'method']` array.

```
Router::dispatch()
  └─► $_SERVER['REQUEST_METHOD'] + parse_url($_SERVER['REQUEST_URI'])
        ├─► Matched  → is_array($handler) ? (new $class)->$method() : $handler()
        └─► No match → 404 JSON { "error": "Route GET /path not found" }
```

Currently registered routes (`src/routes.php`):

| Method | Path | Handler |
|---|---|---|
| GET | `/health` | Closure — returns `{ status: "ok", service: "php-api" }` |
| GET | `/admin/dashboard` | `AdminDashboardController::handle` |
| POST | `/admin/dashboard` | `AdminDashboardController::handle` |

All admin traffic is funneled through a single `handle()` method. The actual action is determined by an `action` parameter in the request body or query string — making it an action-dispatch pattern rather than a REST-per-endpoint pattern.

---

## 3. Authentication — `Middleware/JwtMiddleware.php`

`JwtMiddleware::authenticate()` is called at the top of every protected controller method. It is not middleware in the framework sense — it is a static guard that exits immediately on failure.

```
JwtMiddleware::authenticate()
  └─► extractToken()
        ├─► Authorization: Bearer <token>  (React SPA — primary)
        └─► $_COOKIE['jwt']                (HttpOnly cookie — fallback)

  └─► getenv('JWT_SECRET')
        └─► base64_decode($secret)  →  raw HMAC key bytes

  └─► JWT::decode($token, new Key($keyBytes, 'HS256'))
        ├─► ExpiredException       → 401 "Token has expired"
        ├─► BeforeValidException   → 401 "Token is not yet valid"
        ├─► SignatureInvalidException → 401 "Token signature is invalid"
        ├─► UnexpectedValueException → 401 "Malformed token"
        └─► Success → return $payload (stdClass)
```

The JWT is issued by **Spring Boot** — PHP never creates tokens. The shared `JWT_SECRET` (base64-encoded, same across all services) is used to verify the signature with HS256. Only HS256 is accepted; `alg: none` attacks are prevented by pinning the algorithm in `new Key(...)`.

The decoded payload is stored as `$this->jwtPayload` in the controller. The authenticated user's numeric ID is extracted from the `sub` claim via `adminId()`:

```php
private function adminId(): int {
    return (int) ($this->jwtPayload->sub ?? 0);
}
```

This means **the admin ID always comes from the verified token** — never from the request body — preventing privilege escalation.

---

## 4. Admin Dashboard Controller — `Controller/AdminDashboardController.php`

The entire admin API lives in one controller. `handle()` reads the `action` parameter and dispatches to the appropriate private method via `match`.

### 4a. Action Dispatch

```
POST/GET /admin/dashboard?action=<value>
  └─► JwtMiddleware::authenticate()   ← always runs first
        └─► match($action) {
              'stats'               → stats()
              'get_animals'         → getAnimals()
              'add_animal'          → addAnimal()
              'update_animal'       → updateAnimal()
              'delete'              → deleteRecord()
              'get_requests'        → getRequests()
              'update_request'      → updateRequest()
              'get_surveys'         → getSurveys()
              'get_users'           → getUsers()
              'get_users_geo'       → getUsersGeo()
              'add_user'            → addUser()
              'update_user'         → updateUser()
              'update_user_status'  → updateUserStatus()
              'get_id_file'         → getIdFile()
              'get_activity'        → getActivity()
              'get_chart_data'      → getChartData()
              'get_dashboard_stats' → stats()   (alias)
              'update_profile'      → updateProfile()
              'change_password'     → changePassword()
              'upload_photo'        → uploadPhoto()
              'nominatim_search'    → nominatimSearch()
              default               → 404 JSON
            }
```

`PDOException` from any action is caught at the `handle()` level and returned as a `500` JSON response.

### 4b. Actions Reference

**Dashboard & Analytics**

| Action | Method | Description |
|---|---|---|
| `stats` / `get_dashboard_stats` | `stats()` | Counts from `animals`, `adoption_requests`, `rehome_requests`, `users`, `missing_pets`, `activity_logs`; health breakdowns |
| `get_chart_data` | `getChartData()` | Weekly adoption counts (last 7 days) and monthly counts (current year) for charting |
| `get_activity` | `getActivity()` | Last 200 rows from `activity_logs` ordered newest-first |

**Animals**

| Action | Method | Description |
|---|---|---|
| `get_animals` | `getAnimals()` | All animals ordered by `created_at DESC` |
| `add_animal` | `addAnimal()` | Insert new animal; optional photo upload via `handleAnimalPhoto()`; logs activity |
| `update_animal` | `updateAnimal()` | Update animal fields; new upload takes priority over `existing_photo` fallback; logs activity |
| `delete` | `deleteRecord()` | Hard delete from `animals` or `users` based on `type` param; logs activity |

**Adoption & Rehoming Requests**

| Action | Method | Description |
|---|---|---|
| `get_requests` | `getRequests()` | Fetch from `adoption_requests` or `rehome_requests`; filterable by `status`; max `limit` rows |
| `update_request` | `updateRequest()` | Update `status` (and optionally `reject_note`) on a request; logs activity |

**Surveys**

| Action | Method | Description |
|---|---|---|
| `get_surveys` | `getSurveys()` | All rows from `surveys` ordered by `created_at DESC` |

**Users**

| Action | Method | Description |
|---|---|---|
| `get_users` | `getUsers()` | All users (or filtered by `role`); includes address fields for edit modal |
| `get_users_geo` | `getUsersGeo()` | Same as `get_users` but always returns all roles — used for geo/map features |
| `add_user` | `addUser()` | Create user with auto-generated bcrypt password; duplicate email check; logs activity |
| `update_user` | `updateUser()` | Update profile + address fields; conditionally updates `password_hash` only if a new password is supplied; logs activity |
| `update_user_status` | `updateUserStatus()` | Toggle `is_active` flag; logs activity |
| `get_id_file` | `getIdFile()` | Stream raw BYTEA ID document from DB directly to browser with correct `Content-Type` |

**Admin Profile (self-service)**

| Action | Method | Description |
|---|---|---|
| `update_profile` | `updateProfile()` | Update own name/email/phone; ID sourced from JWT, not request body |
| `change_password` | `changePassword()` | Verify current password with `password_verify`, hash new with bcrypt; ID from JWT |
| `upload_photo` | `uploadPhoto()` | Save profile photo to `/public/uploads/`; store path in `users.photo`; ID from JWT |

**External**

| Action | Method | Description |
|---|---|---|
| `nominatim_search` | `nominatimSearch()` | Proxy to OpenStreetMap Nominatim (Philippines only); avoids CORS from the browser; returns up to 5 results |

### 4c. Photo Upload Flow

`handleAnimalPhoto()` is called for both `add_animal` and `update_animal`:

```
$_FILES['photo'] present?
  ├─► No  → return null (no photo change)
  └─► Yes → validate size (≤ 2 MB) and MIME type (jpeg/png/gif/webp)
               └─► Generate filename: animal_<timestamp>_<random_hex>.<ext>
                     └─► move_uploaded_file() → /var/www/html/uploads/animals/
                           └─► return '/uploads/animals/<filename>'
```

If validation fails, `$this->fail()` is called, which sends a 400 JSON response and exits immediately.

### 4d. Activity Logging

Every write action calls `logActivity(string $action, string $details, ?int $userId)`. It resolves the user's full name from the `users` table and inserts a row into `activity_logs`. Failures are silently swallowed so logging never crashes a request.

```
logActivity('Add Animal', 'Added animal: Buddy (ID 42)', $adminId)
  └─► SELECT first_name || ' ' || last_name FROM users WHERE id = :adminId
        └─► INSERT INTO activity_logs (action, details, user_id, user_name) VALUES (...)
```

---

## 5. Database Access — `db()` Helper

The PDO connection is created once per request using a static variable inside the `db()` method (poor-man's singleton). It connects to the shared PostgreSQL database with the `springboot` search path — the same schema used by Spring Boot and Django.

```
Connection string:
  pgsql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;options=--search_path=springboot,public

Credentials from environment:
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

Options:
  ERRMODE_EXCEPTION        → all errors throw PDOException (caught in handle())
  FETCH_ASSOC              → rows returned as associative arrays
```

---

## 6. Request Body Parsing — `body()` Helper

`body(string $key, mixed $default)` unifies reading from JSON body and form data:

```
body('name')
  └─► $_POST['name']         (multipart/form-data — checked first, covers file uploads)
       ?? $parsed['name']    (json_decode of php://input — covers application/json)
       ?? $default
```

The JSON body is parsed once and cached in a static variable, so it's safe to call `body()` multiple times in one request.

---

## 7. Response Helpers

All responses are JSON. Three helpers handle every case:

| Helper | HTTP Code | Shape |
|---|---|---|
| `ok($data, $message)` | 200 | `{ success: true, message: "...", data: ... }` |
| `fail($message, $code)` | 400 (default) | `{ success: false, message: "..." }` then `exit()` |
| `json($data, $code)` | any | raw JSON then `exit()` |

`fail()` and `json()` both call `exit()` — control never returns to the caller.

---

## 8. End-to-End Request Flow

```
React Admin Dashboard
  └─► POST /admin/dashboard  { action: "add_animal", name: "Buddy", ... }
        │
        ▼
  Apache .htaccess → index.php
        │
        ▼
  Router::dispatch()
    └─► matches POST /admin/dashboard
          └─► new AdminDashboardController()->handle()
                │
                ▼
          JwtMiddleware::authenticate()
            ├─► Extract Bearer token from Authorization header
            ├─► base64_decode(JWT_SECRET) → key bytes
            ├─► JWT::decode (HS256) → $payload
            └─► Store as $this->jwtPayload
                │
                ▼
          match('add_animal') → addAnimal()
            ├─► body() reads name, type, breed, age, health, status, notes
            ├─► handleAnimalPhoto() → validate + move file → return URL
            ├─► $db->prepare(INSERT INTO animals ...) → execute → RETURNING id
            ├─► logActivity('Add Animal', "Added animal: Buddy (ID 7)", $adminId)
            └─► ok(['id' => 7, 'photo' => '/uploads/animals/animal_...jpg'], 'Animal added.')
                │
                ▼
  200 { "success": true, "message": "Animal added.", "data": { "id": 7, "photo": "..." } }
```

---

## 9. How PHP Fits in the Pawster System

PHP serves as the **admin read/write layer** for the shared PostgreSQL database. It does not own any business logic related to adoptions or surveys — that belongs to Django. Its role is:

- Providing the admin dashboard with aggregate stats and charts
- CRUD for animals, users, and raw request/survey records
- Profile and password management for admin accounts
- Proxying Nominatim geo-search to avoid browser CORS restrictions
- Streaming binary ID files stored as BYTEA in the database

All three backends (Spring Boot, Django, PHP) share the same PostgreSQL instance. PHP connects with `search_path=springboot,public`, meaning it reads from the tables Spring Boot owns (`animals`, `users`, `adoption_requests`, `rehome_requests`) without needing its own migrations.