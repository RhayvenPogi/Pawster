<?php
session_start();
header('Content-Type: application/json');

$host = "localhost";
$port = "5432";
$dbname = "pawster_db";
$user = "postgres";
$password = "1234";

$conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password";
$dbconn = pg_connect($conn_string);

if (!$dbconn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password'] ?? '';

    if (empty($email) || empty($pass)) {
        echo json_encode(['success' => false, 'message' => 'Please enter both email and password.']);
        exit;
    }

    /* ===== STATIC ADMIN LOGIN ===== */
    if ($email === "admin@pawster.com" && $pass === "admin123") {

        $_SESSION['user_id'] = 0;
        $_SESSION['first_name'] = "Admin";
        $_SESSION['role'] = "admin";

        echo json_encode([
            'success' => true,
            'message' => 'Admin login successful!',
            'role' => 'admin'
        ]);
        exit;
    }
    /* ===== END STATIC ADMIN ===== */

    $query = "SELECT id, first_name, password_hash, role FROM users WHERE email = $1";
    $result = pg_query_params($dbconn, $query, array($email));

    if ($row = pg_fetch_assoc($result)) {

        if (password_verify($pass, $row['password_hash'])) {

            $_SESSION['user_id'] = $row['id'];
            $_SESSION['first_name'] = $row['first_name'];
            $_SESSION['role'] = $row['role'];

            echo json_encode([
                'success' => true,
                'message' => 'Login successful!',
                'role' => $row['role']
            ]);

        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid password.']);
        }

    } else {
        echo json_encode(['success' => false, 'message' => 'No account found with this email.']);
    }
}
?>