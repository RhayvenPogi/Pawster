<?php
session_start();
header('Content-Type: application/json');

// ─── Session Guard ────────────────────────────────────────────────
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

// ─── DB ───────────────────────────────────────────────────────────
$host = "localhost"; $port = "5432"; $dbname = "pawster_db";
$db_user = "postgres"; $db_pass = "1234";
$conn = pg_connect("host=$host port=$port dbname=$dbname user=$db_user password=$db_pass");

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$uid    = (int) $_SESSION['user_id'];
$action = trim($_POST['action'] ?? '');

// ─── UPDATE PROFILE ───────────────────────────────────────────────
if ($action === 'update_profile') {
    $firstName = trim($_POST['firstName'] ?? '');
    $lastName  = trim($_POST['lastName']  ?? '');
    $email     = trim($_POST['email']     ?? '');
    $phone     = trim($_POST['phone']     ?? '');
    $city      = trim($_POST['city']      ?? '');
    $province  = trim($_POST['province']  ?? '');

    if (empty($firstName) || empty($lastName) || empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Name and email are required.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        exit;
    }

    // Check email uniqueness (exclude self)
    $check = pg_query_params($conn,
        "SELECT id FROM users WHERE email = $1 AND id != $2", [$email, $uid]);
    if ($check && pg_num_rows($check) > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already in use by another account.']);
        exit;
    }

    $result = pg_query_params($conn,
        "UPDATE users SET first_name=$1, last_name=$2, email=$3, phone=$4, city=$5, province=$6
         WHERE id = $7",
        [$firstName, $lastName, $email, $phone, $city, $province, $uid]
    );

    if ($result) {
        $_SESSION['first_name'] = $firstName;
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Update failed. Please try again.']);
    }
    exit;
}

// ─── CHANGE PASSWORD ──────────────────────────────────────────────
if ($action === 'change_password') {
    $current = $_POST['current'] ?? '';
    $new     = $_POST['new']     ?? '';

    if (empty($current) || empty($new)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit;
    }

    if (strlen($new) < 8) {
        echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters.']);
        exit;
    }

    // Fetch current hash
    $row = pg_fetch_assoc(pg_query_params($conn,
        "SELECT password_hash FROM users WHERE id = $1", [$uid]));

    if (!$row || !password_verify($current, $row['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect.']);
        exit;
    }

    $newHash = password_hash($new, PASSWORD_BCRYPT);
    $result  = pg_query_params($conn,
        "UPDATE users SET password_hash = $1 WHERE id = $2", [$newHash, $uid]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Password changed successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update password.']);
    }
    exit;
}

// ─── DELETE ACCOUNT ───────────────────────────────────────────────
if ($action === 'delete_account') {
    // Get file path to clean up
    $row = pg_fetch_assoc(pg_query_params($conn,
        "SELECT id_file_path FROM users WHERE id = $1", [$uid]));

    $result = pg_query_params($conn, "DELETE FROM users WHERE id = $1", [$uid]);

    if ($result && pg_affected_rows($result) > 0) {
        // Remove uploaded ID file
        if ($row && !empty($row['id_file_path'])) {
            $path = __DIR__ . '/../../' . $row['id_file_path'];
            if (file_exists($path)) @unlink($path);
        }
        // Destroy session
        session_unset();
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Account deleted.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Could not delete account.']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Unknown action.']);
?>