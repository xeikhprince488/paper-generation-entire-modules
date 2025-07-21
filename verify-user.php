<?php
// Disable error reporting for production
error_reporting(0);
ini_set('display_errors', 0);

// Get the requesting origin
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// List of allowed origins
$allowed_origins = [
    'https://edu.largifysolutions.com',
    'http://localhost:3000'  // Keep this for local development
];

// Instead of allowing all origins (*), let's be more specific
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: https://edu.largifysolutions.com");
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Update database path for Hostinger
    require_once dirname(__DIR__) . '/config/database.php';

    if (!isset($conn)) {
        throw new Exception('Database connection failed');
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw_input = file_get_contents('php://input');
        
        // Validate JSON before processing
        if (empty($raw_input)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Empty request body',
                'code' => 400
            ]);
            exit();
        }

        $data = json_decode($raw_input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid JSON format',
                'code' => 400
            ]);
            exit();
        }
        
        if (!isset($data['email']) || !isset($data['password'])) {
            throw new Exception('Email and password are required');
        }
        
        $email = trim($data['email']);
        $password = trim($data['password']);
        
        if (empty($email) || empty($password)) {
            throw new Exception('Email and password cannot be empty');
        }
        
        $query = "SELECT * FROM users WHERE email = ? AND password = ? AND status = 'active'";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            throw new Exception('Database query preparation failed: ' . $conn->error);
        }
        
        $hashed_password = md5($password);
        $stmt->bind_param("ss", $email, $hashed_password);
        
        if (!$stmt->execute()) {
            throw new Exception('Query execution failed: ' . $stmt->error);
        }
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $response = [
                'status' => 'success',
                'user' => [
                    'id' => (int)$user['id'],
                    'name' => (string)$user['name'],
                    'email' => (string)$user['email'],
                    'expiryDate' => $user['expiry_date'] ? (string)$user['expiry_date'] : null,
                    'package' => $user['package_type'] ? (string)$user['package_type'] : null,
                    'hasFullAccess' => (bool)$user['has_full_access'],
                    'schoolName' => $user['school_name'] ? (string)$user['school_name'] : null,
                    'role' => $user['role'] ? (string)$user['role'] : null,
                    'createdAt' => $user['created_at'] ? (string)$user['created_at'] : null,
                ]
            ];
            http_response_code(200);
            echo json_encode($response);
            exit();
        }
        
        // Invalid credentials response
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid credentials',
            'code' => 401
        ]);
        exit();
    }
    
    // Method not allowed response
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed',
        'code' => 405
    ]);
    exit();

} catch (Exception $e) {
    error_log("Auth Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error',
        'code' => 500
    ]);
    exit();
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>