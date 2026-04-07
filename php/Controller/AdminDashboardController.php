<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Middleware\JwtMiddleware;
use PDO;
use PDOException;

/**
 * @OA\Info(
 *     title="Pawster Admin API",
 *     version="1.0",
 *     description="Admin Dashboard API for Pawster"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
class AdminDashboardController
{
    private object $jwtPayload;

    // ── Dispatch action from POST/GET ────────────────────────────────────────
    public function handle(): void
    {
        // ✅ Capture the decoded JWT payload (sub = authenticated user's ID)
        $this->jwtPayload = JwtMiddleware::authenticate();

        $action = $_POST['action'] ?? $_GET['action'] ?? '';

        try {
            match ($action) {
                'stats'              => $this->stats(),
                'get_animals'        => $this->getAnimals(),
                'add_animal'         => $this->addAnimal(),
                'update_animal'      => $this->updateAnimal(),
                'delete'             => $this->deleteRecord(),
                'get_requests'       => $this->getRequests(),
                'update_request'     => $this->updateRequest(),
                'get_surveys'        => $this->getSurveys(),
                'get_users'          => $this->getUsers(),
                'get_users_geo'      => $this->getUsersGeo(),
                'add_user'           => $this->addUser(),
                'update_user'        => $this->updateUser(),
                'update_user_status' => $this->updateUserStatus(),
                'get_id_file' => $this->getIdFile(),
                'get_activity'       => $this->getActivity(),
                'get_chart_data'     => $this->getChartData(),
                'get_dashboard_stats'=> $this->stats(),   // alias
                'update_profile'     => $this->updateProfile(),
                'change_password'    => $this->changePassword(),
                'upload_photo'       => $this->uploadPhoto(),
                'nominatim_search'   => $this->nominatimSearch(),
                default              => $this->json(['success' => false, 'message' => "Unknown action: $action"], 404),
            };
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    private function nominatimSearch(): void
{
    $q = trim($_GET['q'] ?? $_POST['q'] ?? '');
    if (!$q) {
        header('Content-Type: application/json');
        echo json_encode([]);
        exit();
    }

    $url = "https://nominatim.openstreetmap.org/search?" . http_build_query([
        "q"            => $q,
        "format"       => "jsonv2",
        "limit"        => 5,
        "countrycodes" => "ph",
    ]);

    $ctx = stream_context_create([
        "http" => [
            "method"  => "GET",
            "header"  => implode("\r\n", [
                "User-Agent: Pawster/1.0 (" . gethostname() . "@pawster.com)",
                "Accept-Language: en",
                "Accept: application/json",
            ]),
            "timeout" => 10,
        ]
    ]);

    $result = @file_get_contents($url, false, $ctx);

    header('Content-Type: application/json');
    echo $result !== false ? $result : json_encode([]);
    exit();
}

    // ── Resolve the authenticated user's ID from the JWT ─────────────────────
    private function adminId(): int
    {
        // Spring Boot puts the user ID in the 'sub' claim as a string
        return (int) ($this->jwtPayload->sub ?? 0);
    }

    // ── Stats ────────────────────────────────────────────────────────────────
    private function stats(): void
    {
        $db = $this->db();
        $q  = fn(string $sql) => (int) $db->query($sql)->fetchColumn();

        $this->ok([
            // existing
            'animals'           => $q("SELECT COUNT(*) FROM animals"),
            'adoptions'         => $q("SELECT COUNT(*) FROM adoption_requests"),
            'rehome'            => $q("SELECT COUNT(*) FROM rehome_requests"),
            'users'             => $q("SELECT COUNT(*) FROM users"),
            'pending_adoptions' => $q("SELECT COUNT(*) FROM adoption_requests WHERE status='Pending'"),
            'pending_rehome'    => $q("SELECT COUNT(*) FROM rehome_requests   WHERE status='Pending'"),
            'surveys'           => $q("SELECT COUNT(*) FROM surveys"),
            'health_healthy'    => $q("SELECT COUNT(*) FROM animals WHERE health='Healthy'"),
            'health_care'       => $q("SELECT COUNT(*) FROM animals WHERE health='Needs Care'"),
            'health_treatment'  => $q("SELECT COUNT(*) FROM animals WHERE health='Under Treatment'"),
            // new badges
            'missing_pets'      => $q("SELECT COUNT(*) FROM missing_pets"),
            'activity_today'    => $q("SELECT COUNT(*) FROM activity_logs WHERE created_at::date = CURRENT_DATE"),
            'total_records'     => $q("SELECT (SELECT COUNT(*) FROM animals) + (SELECT COUNT(*) FROM adoption_requests) + (SELECT COUNT(*) FROM rehome_requests)"),
        ]);
    }
    // ── Animals ──────────────────────────────────────────────────────────────
    private function getAnimals(): void
    {
        $rows = $this->db()
            ->query("SELECT * FROM animals ORDER BY created_at DESC")
            ->fetchAll();
        $this->ok($rows);
    }

     private function addAnimal(): void
    {
        $name   = trim($this->body('name',   ''));
        $type   = $this->body('type',        'Dog');
        $breed  = $this->body('breed',       '');
        $age    = $this->body('age',         '');
        $health = $this->body('health',      'Healthy');
        $status = $this->body('status',      'Available');
        $notes  = $this->body('notes',       '');
        $photo  = $this->handleAnimalPhoto(); // upload if provided, else null
 
        if (!$name) $this->fail('Animal name is required.');
 
        $db   = $this->db();
        $stmt = $db->prepare(
            "INSERT INTO animals (name, type, breed, age, health, status, notes, photo)
             VALUES (:name, :type, :breed, :age, :health, :status, :notes, :photo)
             RETURNING id"
        );
        $stmt->execute(compact('name', 'type', 'breed', 'age', 'health', 'status', 'notes', 'photo'));
        $id = (int) $stmt->fetchColumn();
 
        $this->logActivity('Add Animal', "Added animal: $name (ID $id)");
        $this->ok(['id' => $id, 'photo' => $photo], 'Animal added.');
    }
 
    private function updateAnimal(): void
    {
        $id     = (int) $this->body('id',    0);
        $name   = trim($this->body('name',   ''));
        $type   = $this->body('type',        'Dog');
        $breed  = $this->body('breed',       '');
        $age    = $this->body('age',         '');
        $health = $this->body('health',      'Healthy');
        $status = $this->body('status',      'Available');
        $notes  = $this->body('notes',       '');
 
        if (!$id || !$name) $this->fail('ID and name are required.');
 
        // New upload takes priority; fall back to the URL React sent as existing_photo
        $newPhoto = $this->handleAnimalPhoto();
        $photo    = $newPhoto ?? $this->body('existing_photo', null);
 
        $stmt = $this->db()->prepare(
            "UPDATE animals
             SET name=:name, type=:type, breed=:breed, age=:age,
                 health=:health, status=:status, notes=:notes, photo=:photo
             WHERE id=:id"
        );
        $stmt->execute(compact('name', 'type', 'breed', 'age', 'health', 'status', 'notes', 'photo', 'id'));
 
        $this->logActivity('Update Animal', "Updated animal ID $id: $name");
        $this->ok(['photo' => $photo], 'Animal updated.');
    }
 
    /**
     * Handles the optional "photo" file in $_FILES.
     * Returns the public URL string on success, or null if no file was uploaded.
     * Calls $this->fail() on validation errors (exits immediately).
     */
    private function handleAnimalPhoto(): ?string
    {
        if (empty($_FILES['photo']['tmp_name'])) {
            return null; // no file uploaded — that's fine
        }
 
        $file    = $_FILES['photo'];
        $maxSize = 2 * 1024 * 1024; // 2 MB
        $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
 
        if ($file['size'] > $maxSize) {
            $this->fail('Photo exceeds 2 MB limit.');
        }
 
        $mime = mime_content_type($file['tmp_name']);
        if (!in_array($mime, $allowed, true)) {
            $this->fail('Invalid photo type. Allowed: JPG, PNG, GIF, WEBP.');
        }
 
        $ext       = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg');
        $filename  = 'animal_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $uploadDir = '/var/www/html/uploads/animals/';
 
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
 
        if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            $this->fail('Failed to save photo.');
        }
 
        return '/uploads/animals/' . $filename;
    }

    // ── Generic delete ────────────────────────────────────────────────────────
    private function deleteRecord(): void
    {
        $type = $this->body('type', '');
        $id   = (int) $this->body('id', 0);

        $tableMap = [
            'animal' => 'animals',
            'user'   => 'users',
        ];

        if (!isset($tableMap[$type]) || !$id) {
            $this->fail('Invalid delete request.');
        }

        $table = $tableMap[$type];
        $this->db()->prepare("DELETE FROM $table WHERE id = :id")->execute(['id' => $id]);

        $this->logActivity('Delete', "Deleted $type ID $id");
        $this->ok(null, ucfirst($type) . ' deleted.');
    }

    // ── Adoption / Rehome requests ────────────────────────────────────────────
    private function getRequests(): void
    {
        $type   = $this->body('type')   ?: ($_GET['type']   ?? 'adoptions');
        $status = $this->body('status') ?: ($_GET['status'] ?? '');
        $limit  = (int) ($this->body('limit') ?: ($_GET['limit'] ?? 200));

        $table = ($type === 'rehome') ? 'rehome_requests' : 'adoption_requests';
        $db    = $this->db();

        if ($status) {
            $stmt = $db->prepare(
                "SELECT * FROM $table WHERE status = :status ORDER BY created_at DESC LIMIT :limit"
            );
            $stmt->bindValue('status', $status);
            $stmt->bindValue('limit',  $limit, PDO::PARAM_INT);
            $stmt->execute();
        } else {
            $stmt = $db->prepare("SELECT * FROM $table ORDER BY created_at DESC LIMIT :limit");
            $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
        }

        $this->ok($stmt->fetchAll());
    }

    private function updateRequest(): void
    {
        $type   = $this->body('type',   'adoptions');
        $id     = (int) $this->body('id',     0);
        $status = $this->body('status', '');
        $reason = $this->body('reason', '');

        if (!$id || !$status) {
            $this->fail('ID and status are required.');
        }

        $table = ($type === 'rehome') ? 'rehome_requests' : 'adoption_requests';
        $db    = $this->db();

        if ($reason) {
            $stmt = $db->prepare("UPDATE $table SET status=:status, reject_note=:reason WHERE id=:id");
            $stmt->execute(compact('status', 'reason', 'id'));
        } else {
            $stmt = $db->prepare("UPDATE $table SET status=:status WHERE id=:id");
            $stmt->execute(compact('status', 'id'));
        }

        $this->logActivity('Update Request', "Set $type request ID $id to $status");
        $this->ok(null, "Request $status.");
    }

    // ── Surveys ───────────────────────────────────────────────────────────────
    private function getSurveys(): void
    {
        $rows = $this->db()
            ->query("SELECT * FROM surveys ORDER BY created_at DESC")
            ->fetchAll();
        $this->ok($rows);
    }

    // ── Chart Data ────────────────────────────────────────────────────────────
private function getChartData(): void
{
    $db = $this->db();

    // Weekly: last 7 days (Mon→Sun)
    $weekly = [];
    for ($i = 6; $i >= 0; $i--) {
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM adoption_requests
             WHERE DATE(created_at) = CURRENT_DATE - INTERVAL ':i days'"
        );
        // Use query with direct interpolation for interval
        $count = (int) $db->query(
            "SELECT COUNT(*) FROM adoption_requests
             WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '$i days'"
        )->fetchColumn();
        $weekly[] = $count;
    }

    // Monthly: each month of current year
    $monthly = [];
    for ($m = 1; $m <= 12; $m++) {
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM adoption_requests
             WHERE EXTRACT(MONTH FROM created_at) = :m
               AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR FROM NOW())"
        );
        $stmt->execute(['m' => $m]);
        $monthly[] = (int) $stmt->fetchColumn();
    }

    $this->ok(['weekly' => $weekly, 'monthly' => $monthly]);
}

    // ── Users ─────────────────────────────────────────────────────────────────
private function getUsers(): void
{
    $role = $this->body('role') ?: ($_GET['role'] ?? 'all');
    $db   = $this->db();

    if ($role && $role !== 'all') {
        $stmt = $db->prepare(
            "SELECT id, first_name, last_name, email, phone, role, is_active, created_at, last_login,
                    id_file_name, photo_name
             FROM users WHERE role = :role ORDER BY created_at DESC"
        );
        $stmt->execute(['role' => $role]);
    } else {
        $stmt = $db->query(
            "SELECT id, first_name, last_name, email, phone, role, is_active, created_at, last_login,
                    id_file_name, photo_name
             FROM users ORDER BY created_at DESC"
        );
    }

    $this->ok($stmt->fetchAll());
}
    private function getUsersGeo(): void
{
    $stmt = $this->db()->query(
        "SELECT id, first_name, last_name, email, phone, role,
                is_active, created_at, last_login,
                address, city, province, zip_code,
                id_file_name
         FROM users
         ORDER BY created_at DESC"
    );
    $this->ok($stmt->fetchAll());
}

    private function addUser(): void
{
    $firstName = trim($this->body('first_name', ''));
    $lastName  = trim($this->body('last_name',  ''));
    $email     = trim($this->body('email',      ''));
    $phone     = trim($this->body('phone',      ''));
    $role      = $this->body('role',     'user');
    $isActive  = (int) $this->body('is_active', 1);
    $address   = $this->body('address',  '');
    $city      = $this->body('city',     '');
    $province  = $this->body('province', '');
    $zip       = $this->body('zip',      '');

    if (!$firstName || !$lastName || !$email || !$phone) {
        $this->fail('All fields are required.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->fail('Invalid email format.');
    }

    $db = $this->db();

    $chk = $db->prepare("SELECT id FROM users WHERE email = :email");
    $chk->execute(['email' => $email]);
    if ($chk->fetch()) {
        $this->fail('Email already in use.');
    }

    // Auto-generate a random password
    $password = bin2hex(random_bytes(8));
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $db->prepare(
        "INSERT INTO users
            (first_name, last_name, email, phone, password_hash, role, is_active, address, city, province, zip_code)
         VALUES
            (:firstName, :lastName, :email, :phone, :hash, :role, :isActive, :address, :city, :province, :zip)
         RETURNING id"
    );
    $stmt->execute(compact(
        'firstName', 'lastName', 'email', 'phone', 'hash',
        'role', 'isActive', 'address', 'city', 'province', 'zip'
    ));
    $id = (int) $stmt->fetchColumn();

    $this->logActivity('Add User', "Created user: $email (ID $id)");
    $this->ok(['id' => $id], 'User created.');
}

   private function updateUser(): void
{
    $id        = (int) $this->body('id', 0);
    $firstName = trim($this->body('first_name', ''));
    $lastName  = trim($this->body('last_name',  ''));
    $email     = trim($this->body('email',      ''));
    $phone     = trim($this->body('phone',      ''));
    $password  = $this->body('password', '');
    $role      = $this->body('role',     'user');
    $isActive  = (int) $this->body('is_active', 1);

    // ✅ Address fields
    $address  = $this->body('address',  '');
    $city     = $this->body('city',     '');
    $province = $this->body('province', '');
    $zip      = $this->body('zip',      '');

    if (!$id || !$firstName || !$email) {
        $this->fail('ID, first name, and email are required.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->fail('Invalid email format.');
    }

    $db = $this->db();

    $chk = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
    $chk->execute(compact('email', 'id'));
    if ($chk->fetch()) {
        $this->fail('Email already in use by another account.');
    }

    // ✅ Build query dynamically
    if ($password) {
        if (strlen($password) < 8) {
            $this->fail('Password must be at least 8 characters.');
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $db->prepare(
            "UPDATE users
             SET first_name=:firstName, last_name=:lastName, email=:email, phone=:phone,
                 password_hash=:hash, role=:role, is_active=:isActive,
                 address=:address, city=:city, province=:province, zip_code=:zip
             WHERE id=:id"
        );

        $stmt->execute(compact(
            'firstName', 'lastName', 'email', 'phone',
            'hash', 'role', 'isActive',
            'address', 'city', 'province', 'zip', 'id'
        ));

    } else {
        // ✅ No password update
        $stmt = $db->prepare(
            "UPDATE users
             SET first_name=:firstName, last_name=:lastName, email=:email, phone=:phone,
                 role=:role, is_active=:isActive,
                 address=:address, city=:city, province=:province, zip_code=:zip
             WHERE id=:id"
        );

        $stmt->execute(compact(
            'firstName', 'lastName', 'email', 'phone',
            'role', 'isActive',
            'address', 'city', 'province', 'zip', 'id'
        ));
    }

    $this->logActivity('Update User', "Updated user ID $id: $email");
    $this->ok(null, 'User updated.');
}
    private function updateUserStatus(): void
    {
        $id       = (int) $this->body('id', 0);
        $isActive = (int) $this->body('is_active', 1);

        if (!$id) {
            $this->fail('User ID is required.');
        }

        $this->db()
            ->prepare("UPDATE users SET is_active = :isActive WHERE id = :id")
            ->execute(compact('isActive', 'id'));

        $this->logActivity('Toggle Status', "Set user ID $id active=$isActive");
        $this->ok(null, 'Status updated.');
    }

    // ── Activity log ──────────────────────────────────────────────────────────
    private function getActivity(): void
    {
        $rows = $this->db()
            ->query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200")
            ->fetchAll();
        $this->ok($rows);
    }

    // ── Profile ───────────────────────────────────────────────────────────────
    private function updateProfile(): void
    {
        // ✅ ID now comes from the verified JWT — not from the request body
        $adminId   = $this->adminId();
        $firstName = trim($this->body('first_name', ''));
        $lastName  = trim($this->body('last_name',  ''));
        $email     = trim($this->body('email',      ''));
        $phone     = $this->body('phone', '');

        if (!$firstName || !$email) {
            $this->fail('First name and email are required.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->fail('Invalid email format.');
        }

        $db  = $this->db();
        $chk = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :adminId");
        $chk->execute(compact('email', 'adminId'));
        if ($chk->fetch()) {
            $this->fail('Email already in use.');
        }

        $db->prepare(
            "UPDATE users SET first_name=:firstName, last_name=:lastName, email=:email, phone=:phone WHERE id=:adminId"
        )->execute(compact('firstName', 'lastName', 'email', 'phone', 'adminId'));

        $this->logActivity('Update Profile', "Admin ID $adminId updated profile");
        $this->ok([
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'email'      => $email,
        ], 'Profile updated.');
    }

    private function changePassword(): void
    {
        // ✅ ID now comes from the verified JWT — not from the request body
        $adminId     = $this->adminId();
        $currentPass = $this->body('current_password', '');
        $newPass     = $this->body('new_password',      '');
        $confirmPass = $this->body('confirm_password',  '');

        if (!$currentPass || !$newPass)    $this->fail('Current and new passwords are required.');
        if ($newPass !== $confirmPass)     $this->fail('Passwords do not match.');
        if (strlen($newPass) < 8)          $this->fail('New password must be at least 8 characters.');

        $db  = $this->db();
        $row = $db->prepare("SELECT password_hash FROM users WHERE id = :adminId");
        $row->execute(['adminId' => $adminId]);
        $current = $row->fetch();

        if (!$current || !password_verify($currentPass, $current['password_hash'])) {
            $this->fail('Current password is incorrect.');
        }

        $hash = password_hash($newPass, PASSWORD_BCRYPT);
        $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :adminId")
            ->execute(compact('hash', 'adminId'));

        $this->logActivity('Change Password', "Admin ID $adminId changed password");
        $this->ok(null, 'Password updated.');
    }

    // ── Photo upload ──────────────────────────────────────────────────────────
    private function uploadPhoto(): void
    {
        // ✅ ID now comes from the verified JWT — not from the request body
        $adminId = $this->adminId();

        if (empty($_FILES['photo']['tmp_name'])) {
            $this->fail('No file uploaded.');
        }

        $file    = $_FILES['photo'];
        $maxSize = 2 * 1024 * 1024;
        $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if ($file['size'] > $maxSize)                          $this->fail('File exceeds 2 MB limit.');
        $mime = mime_content_type($file['tmp_name']);
        if (!in_array($mime, $allowed, true))                  $this->fail('Invalid file type.');

        $ext       = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename  = "admin_{$adminId}_" . time() . ".$ext";
        $uploadDir = __DIR__ . '/../../public/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            $this->fail('Failed to save file.');
        }

        $url = '/uploads/' . $filename;
        $this->db()
             ->prepare("UPDATE users SET photo = :url WHERE id = :adminId")
             ->execute(compact('url', 'adminId'));

        $this->logActivity('Upload Photo', "Admin ID $adminId uploaded photo");
        $this->ok(['url' => $url], 'Photo uploaded.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private function db(): PDO
    {
        static $pdo = null;
        if ($pdo === null) {
            $pdo = new PDO(
                sprintf(
        'pgsql:host=%s;port=%s;dbname=%s;options=--search_path=springboot,public',
        getenv('DB_HOST') ?: 'localhost',
        getenv('DB_PORT') ?: '5432',
        getenv('DB_NAME') ?: 'pawster_db'
    ),
                getenv('DB_USER')     ?: 'postgres',
                getenv('DB_PASSWORD') ?: 'secret',
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        }
        return $pdo;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Reads a field from the JSON body (primary) or $_POST (fallback).
 * Call once per request — result is cached in a static variable.
 */
private function body(string $key, mixed $default = null): mixed
{
    static $parsed = null;

    if ($parsed === null) {
        $raw    = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        $parsed  = is_array($decoded) ? $decoded : [];
    }

    // $_POST takes priority — covers multipart/form-data requests
    // $parsed covers JSON body requests
    return $_POST[$key] ?? $parsed[$key] ?? $default;
}
    private function ok(mixed $data = null, string $message = 'OK'): void
    {
        $this->json(['success' => true, 'message' => $message, 'data' => $data]);
    }

    private function fail(string $message = 'Error', int $code = 400): never
    {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => $message]);
        exit();
    }

    private function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit();
    }

    private function logActivity(string $action, string $details, ?int $userId = null): void
    {
        try {
            $this->db()->prepare(
                "INSERT INTO activity_logs (action, details, user_id) VALUES (:action, :details, :userId)"
            )->execute(compact('action', 'details', 'userId'));
        } catch (\Throwable) {
            // non-fatal
        }
    }

private function getIdFile(): void
{
    $userId = (int) ($_GET['user_id'] ?? 0);
    if (!$userId) $this->fail('User ID required.');

    $stmt = $this->db()->prepare("SELECT id_file_name, id_file, id_file_type FROM users WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch();

    if (!$row || !$row['id_file']) {
        http_response_code(404);
        echo "No ID file found.";
        exit();
    }

    // BYTEA comes back as a PHP resource — read it into a string
    $data = is_resource($row['id_file']) ? stream_get_contents($row['id_file']) : $row['id_file'];

    header('Content-Type: ' . ($row['id_file_type'] ?: 'application/octet-stream'));
    header('Content-Disposition: inline; filename="' . $row['id_file_name'] . '"');
    echo $data;
    exit();
}
}