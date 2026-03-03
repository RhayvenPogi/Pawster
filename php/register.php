<?php
header('Content-Type: application/json');

// 1. Database Connection
$host = "localhost"; $port = "5432"; $dbname = "pawster_db";
$user = "postgres"; $password = "1234";
$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Connection failed.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 2. Data Collection
    $email = trim($_POST['email']);
    
    // Check if user exists
    $check = pg_query_params($conn, "SELECT id FROM users WHERE email = $1", [$email]);
    if (pg_num_rows($check) > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered.']);
        exit;
    }

    // 3. Handle File Upload (Step 3)
    $uploadDir = 'uploads/ids/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
    
    $file = $_FILES['idFile'];
    $fileName = time() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode(['success' => false, 'message' => 'Failed to upload ID.']);
        exit;
    }

    // 4. Implement Password Hashing
    $hash = password_hash($_POST['password'], PASSWORD_BCRYPT);

    // 5. Insert into Database
    $query = "INSERT INTO users (first_name, last_name, email, phone, password_hash, address, city, province, zip_code, id_file_path) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
    
    $params = [
        $_POST['firstName'], $_POST['lastName'], $email, $_POST['phone'],
        $hash, $_POST['address'], $_POST['city'], $_POST['province'], 
        $_POST['zip'], $targetPath
    ];

    $result = pg_query_params($conn, $query, $params);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Registration successful!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
}
?>