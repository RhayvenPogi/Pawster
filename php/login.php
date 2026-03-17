<?php
// Prevent any PHP warnings/notices from corrupting the JSON output
error_reporting(0);
ini_set('display_errors', '0');
ob_start();

session_start();
header('Content-Type: application/json');

$host     = "localhost";
$port     = "5432";
$dbname   = "pawster_db";
$user     = "postgres";
$password = "1234";

$conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password";
$dbconn      = pg_connect($conn_string);

if (!$dbconn) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $email = trim($_POST['email']    ?? '');
    $pass  =      $_POST['password'] ?? '';

    if (empty($email) || empty($pass)) {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Please enter both email and password.']);
        exit;
    }

    /* ===== STATIC ADMIN LOGIN ===== */
    if ($email === "admin@pawster.com" && $pass === "admin123") {

        $_SESSION['user_id']    = 0;
        $_SESSION['first_name'] = "Admin";
        $_SESSION['last_name']  = "";
        $_SESSION['email']      = "admin@pawster.com";
        $_SESSION['role']       = "admin";

        ob_end_clean();
        echo json_encode([
            'success'  => true,
            'message'  => 'Admin login successful!',
            'role'     => 'admin',
            'redirect' => 'php/admin_dashboard.php'
        ]);
        exit;
    }
    /* ===== END STATIC ADMIN ===== */

    // column is password_hash (not password)
    $query  = "SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = $1";
    $result = pg_query_params($dbconn, $query, [$email]);

    if ($row = pg_fetch_assoc($result)) {

        if (password_verify($pass, trim($row['password_hash']))) {

            $_SESSION['user_id']    = $row['id'];
            $_SESSION['first_name'] = $row['first_name'];
            $_SESSION['last_name']  = $row['last_name']  ?? '';
            $_SESSION['email']      = $row['email'];
            $_SESSION['role']       = $row['role'];

            // Redirect: admin → admin dashboard, user → homepage (index.php)
            $redirect = ($row['role'] === 'admin')
                ? 'php/admin_dashboard.php'
                : 'php/index.php';

            ob_end_clean();
            echo json_encode([
                'success'  => true,
                'message'  => 'Login successful!',
                'role'     => $row['role'],
                'redirect' => $redirect
            ]);

        } else {
            ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Invalid password.']);
        }

    } else {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'No account found with this email.']);
    }
}
?>