<?php
header('Content-Type: application/json');

// 1. Database Connection
$host = "localhost";
$port = "5432";
$dbname = "pawster_db";
$user = "postgres";
$password = "1234";

$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // 2. Collect & Sanitize Data
    $firstName = trim($_POST['firstName'] ?? '');
    $lastName  = trim($_POST['lastName'] ?? '');
    $email     = trim($_POST['email'] ?? '');
    $phone     = trim($_POST['phone'] ?? '');
    $password  = $_POST['password'] ?? '';
    $address   = trim($_POST['address'] ?? '');
    $city      = trim($_POST['city'] ?? '');
    $province  = trim($_POST['province'] ?? '');
    $zip       = trim($_POST['zip'] ?? '');

    // 3. Server-Side Required Validation
    if (
        empty($firstName) || empty($lastName) ||
        empty($email) || empty($password) ||
        empty($address) || empty($city) ||
        empty($province) || empty($zip)
    ) {
        echo json_encode(['success' => false, 'message' => 'All required fields must be filled.']);
        exit;
    }

    // 4. Email Format Validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        exit;
    }

    // 5. Password Strength Check
    if (strlen($password) < 8) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
        exit;
    }

    // 6. Check if Email Already Exists
    $check = pg_query_params($conn, "SELECT id FROM users WHERE email = $1", [$email]);

    if ($check && pg_num_rows($check) > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered.']);
        exit;
    }

    // 7. File Upload Validation
    if (!isset($_FILES['idFile']) || $_FILES['idFile']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'ID file is required.']);
        exit;
    }

    $file = $_FILES['idFile'];

    // File Size Check (Max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'File must be under 5MB.']);
        exit;
    }

    // File Type Check
    $allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    $fileType = mime_content_type($file['tmp_name']);

    if (!in_array($fileType, $allowedTypes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid file type.']);
        exit;
    }

    // 8. Secure File Upload
    $uploadDir = __DIR__ . '/../uploads/ids/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newFileName = uniqid('id_', true) . '.' . $fileExtension;
    $targetPath = $uploadDir . $newFileName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode(['success' => false, 'message' => 'Failed to upload ID file.']);
        exit;
    }

    // Store relative path in DB
    $dbFilePath = 'uploads/ids/' . $newFileName;

    // 9. Hash Password (Secure)
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // 10. Insert Into Database
    $query = "INSERT INTO users 
        (first_name, last_name, email, phone, password_hash, address, city, province, zip_code, id_file_path)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)";

    $params = [
        $firstName, $lastName, $email, $phone,
        $hash, $address, $city, $province,
        $zip, $dbFilePath
    ];

    $result = pg_query_params($conn, $query, $params);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Registration successful!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error occurred.']);
    }
}
?>