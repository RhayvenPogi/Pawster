<?php
session_start();
header('Content-Type: application/json');

// 1. Database credentials
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
    // 2. Data Collection (Username removed)
    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password'] ?? '';

    // 3. Server-side validation
    if (empty($email) || empty($pass)) {
        echo json_encode(['success' => false, 'message' => 'Please enter both email and password.']);
        exit;
    }

    // 4. Secure Query (Only searching by email now)
    // 
    $query = "SELECT id, first_name, password_hash FROM users WHERE email = $1";
    $result = pg_query_params($dbconn, $query, array($email));

    if ($row = pg_fetch_assoc($result)) {
        // 5. Verify the hashed password
        if (password_verify($pass, $row['password_hash'])) {
            // Set sessions for use in your dashboard
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['first_name'] = $row['first_name'];
            
            echo json_encode(['success' => true, 'message' => 'Login successful!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid password.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No account found with this email.']);
    }
}
?>