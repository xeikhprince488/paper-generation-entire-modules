<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Origin');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

header('Content-Type: application/json; charset=UTF-8');

// Prevent any output before headers
ob_start();

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

$allowedOrigins = ['https://edu.largifysolutions.com', 'http://localhost:3000', 'https://admin-edu.largifysolutions.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// CORS Headers - must be first
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    exit(0);
}

// For non-OPTIONS requests
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

// Database connection
$host = "edu.largifysolutions.com";
$dbname = "u421900954_ecompapgen";
$username = "u421900954_PaperGenerator";
$password = "PaperGeneratorByAhmad786";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'error' => 'Connection failed: ' . $e->getMessage()]));
}

// Handle the request
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch($action) {
    case 'login':
        handleLogin($pdo, $data);
        break;
    case 'createUser':
        handleCreateUser($pdo, $data);
        break;
    case 'getUserInfo':
        handleGetUserInfo($pdo, $data);
        break;
    case 'getAllUsers':
        handleGetAllUsers($pdo);
        break;
    case 'updateUser':
        handleUpdateUser($pdo, $data);
        break;
    case 'deleteUser':
        handleDeleteUser($pdo, $data);
        break;
    case 'getSystemStats':
        handleGetSystemStats($pdo);
        break;
    case 'checkExpiredUsers':
        handleCheckExpiredUsers($pdo);
        break;
    case 'getUserHistory':
        handleGetUserHistory($pdo, $data);
        break;
    case 'checkAuth':
        handleCheckAuth($pdo, $data);
        break;
    case 'getAllTeachers':
        handleGetAllTeachers($pdo);
        break;
    case 'createTeacher':
        handleCreateTeacher($pdo, $data);
        break;
    case 'updateTeacher':
        handleUpdateTeacher($pdo, $data);
        break;
    case 'deleteTeacher':
        handleDeleteTeacher($pdo, $data);
        break;
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

function handleLogin($pdo, $data) {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    try {
        // First check in users table
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            // Remove password from response
            unset($user['password']);
            echo json_encode(['success' => true, 'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'status' => $user['status'],
                'schoolName' => $user['school_name'],
                'package' => $user['package'],
                'expiryDate' => $user['expiry_date']
            ]]);
            return;
        }

        // If not found in users, check teachers table
        $stmt = $pdo->prepare("SELECT * FROM teachers WHERE email = ? OR username = ?");
        $stmt->execute([$email, $email]);
        $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($teacher && password_verify($password, $teacher['password'])) {
            // Remove password from response
            unset($teacher['password']);
            echo json_encode(['success' => true, 'user' => [
                'id' => $teacher['id'],
                'name' => $teacher['teacher_name'],
                'email' => $teacher['email'],
                'role' => 'teacher',
                'status' => $teacher['status'],
                'username' => $teacher['username'],
                'class' => $teacher['class'],
                'subject' => json_decode($teacher['subject'], true)
            ]]);
            return;
        }

        // If no match found in either table
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Login failed: ' . $e->getMessage()]);
    }
}

function handleCreateUser($pdo, $data) {
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'user';
    $package = $data['package'] ?? 'basic';
    $expiryDate = $data['expiryDate'] ?? '';
    $schoolName = $data['schoolName'] ?? '';
    $status = $data['status'] ?? 'active';

    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('Email already exists');
        }

        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, package, expiry_date, school_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $name,
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $role,
            $package,
            $expiryDate,
            $schoolName,
            $status
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Log the creation
        logUserHistory($pdo, $userId, 'created', $package, $expiryDate, $status);
        
        echo json_encode(['success' => true, 'message' => 'User created successfully']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleGetUserInfo($pdo, $data) {
    $email = $data['email'] ?? '';
    
    $stmt = $pdo->prepare("SELECT id, name, email, role, package, expiry_date, school_name, status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'error' => 'User not found']);
    }
}

function handleGetAllUsers($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, name, email, role, package, expiry_date, school_name, status FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'users' => $users]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch users']);
    }
}

function handleUpdateUser($pdo, $data) {
    try {
        $userId = $data['id'] ?? '';
        if (!$userId) {
            throw new Exception('User ID is required');
        }

        $fields = [
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'role' => $data['role'] ?? null,
            'package' => $data['package'] ?? null,
            'expiry_date' => $data['expiryDate'] ?? null,
            'school_name' => $data['schoolName'] ?? null,
            'status' => $data['status'] ?? null
        ];

        // Remove null values
        $fields = array_filter($fields, function($value) {
            return $value !== null;
        });

        if (empty($fields)) {
            throw new Exception('No fields to update');
        }

        // Build the SQL query
        $sql = "UPDATE users SET ";
        $updates = [];
        $values = [];
        foreach ($fields as $key => $value) {
            $updates[] = "$key = ?";
            $values[] = $value;
        }
        $sql .= implode(', ', $updates);
        $sql .= " WHERE id = ?";
        $values[] = $userId;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        // Log the update
        logUserHistory(
            $pdo,
            $userId,
            'updated',
            $data['package'] ?? null,
            $data['expiryDate'] ?? null,
            $data['status'] ?? null
        );
        
        echo json_encode(['success' => true, 'message' => 'User updated successfully']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleDeleteUser($pdo, $data) {
    try {
        $userId = $data['userId'] ?? '';
        if (!$userId) {
            throw new Exception('User ID is required');
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleGetSystemStats($pdo) {
    try {
        // Get total users
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
        $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get active users
        $stmt = $pdo->query("SELECT COUNT(*) as active FROM users WHERE status = 'active'");
        $activeUsers = $stmt->fetch(PDO::FETCH_ASSOC)['active'];

        // Get papers stats
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM papers");
        $totalPapers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $stats = [
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers
            ],
            'papers' => [
                'total' => $totalPapers
            ],
            'system' => [
                'status' => 'operational',
                'lastUpdate' => date('Y-m-d H:i:s')
            ]
        ];

        echo json_encode(['success' => true, 'stats' => $stats]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch system stats']);
    }
}

function handleCheckExpiredUsers($pdo) {
    try {
        $currentDate = date('Y-m-d');
        
        // Delete expired users
        $stmt = $pdo->prepare("DELETE FROM users WHERE expiry_date < ? AND role = 'user'");
        $stmt->execute([$currentDate]);
        
        // Get count of deleted users
        $deletedCount = $stmt->rowCount();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Expired users check completed',
            'deletedCount' => $deletedCount
        ]);
    } catch(Exception $e) {
        echo json_encode([
            'success' => false, 
            'error' => 'Failed to check expired users: ' . $e->getMessage()
        ]);
    }
}

function handleGetUserHistory($pdo, $data) {
    try {
        $filters = $data['filters'] ?? [];
        $query = "
            SELECT 
                uh.id,
                u.name,
                u.email,
                u.school_name,
                uh.action,
                uh.package,
                uh.expiry_date,
                uh.status,
                uh.created_at
            FROM user_history uh
            JOIN users u ON uh.user_id = u.id
            WHERE 1=1
        ";
        $params = [];

        // Apply filters
        if (!empty($filters['dateFrom'])) {
            $query .= " AND uh.created_at >= ?";
            $params[] = $filters['dateFrom'];
        }
        if (!empty($filters['dateTo'])) {
            $query .= " AND uh.created_at <= ?";
            $params[] = $filters['dateTo'];
        }
        if (!empty($filters['status'])) {
            $query .= " AND uh.status = ?";
            $params[] = $filters['status'];
        }
        if (!empty($filters['package'])) {
            $query .= " AND uh.package = ?";
            $params[] = $filters['package'];
        }

        $query .= " ORDER BY uh.created_at DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get summary statistics
        $stats = getUserHistoryStats($pdo);

        echo json_encode([
            'success' => true,
            'history' => $history,
            'stats' => $stats
        ]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function getUserHistoryStats($pdo) {
    $stats = [
        'total' => 0,
        'active' => 0,
        'expired' => 0,
        'expiringIn30Days' => 0,
        'addedThisMonth' => 0,
        'packageStats' => []
    ];

    // Get total and status counts
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' AND expiry_date >= CURDATE() THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon,
            SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as added_this_month
        FROM users
        WHERE role = 'user'
    ");
    $basicStats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get package distribution
    $stmt = $pdo->query("
        SELECT package, COUNT(*) as count
        FROM users
        WHERE role = 'user'
        GROUP BY package
    ");
    $packageStats = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    return [
        'totalUsers' => $basicStats['total'],
        'activeUsers' => $basicStats['active'],
        'expiredUsers' => $basicStats['expired'],
        'expiringIn30Days' => $basicStats['expiring_soon'],
        'addedThisMonth' => $basicStats['added_this_month'],
        'packageDistribution' => $packageStats
    ];
}

function logUserHistory($pdo, $userId, $action, $package, $expiryDate, $status) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO user_history (user_id, action, package, expiry_date, status)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $action, $package, $expiryDate, $status]);
    } catch(Exception $e) {
        // Just log the error, don't stop execution
        error_log("Error logging user history: " . $e->getMessage());
    }
}

function handleCheckAuth($pdo, $data) {
    try {
        $email = $data['email'] ?? '';
        // If using token-based auth, you'd verify the token here instead
        
        if (!$email) {
            throw new Exception('Authentication required');
        }

        $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE email = ? AND role = 'admin'");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleGetAllTeachers($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT id, teacher_name, father_name, username, email, 
                   class, subject, address, status, created_at 
            FROM teachers 
            ORDER BY created_at DESC
        ");
        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert subject string to array
        foreach ($teachers as &$teacher) {
            $teacher['subject'] = json_decode($teacher['subject'], true);
        }
        
        echo json_encode(['success' => true, 'teachers' => $teachers]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch teachers']);
    }
}

function handleCreateTeacher($pdo, $data) {
    try {
        $teacher = $data['teacher'];
        
        // Check if email or username already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM teachers WHERE email = ? OR username = ?");
        $stmt->execute([$teacher['email'], $teacher['username']]);
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('Email or username already exists');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO teachers (
                teacher_name, father_name, username, password, 
                email, class, subject, address, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $teacher['teacherName'],
            $teacher['fatherName'],
            $teacher['username'],
            password_hash($teacher['password'], PASSWORD_DEFAULT),
            $teacher['email'],
            $teacher['class'],
            json_encode($teacher['subject']),
            $teacher['address'],
            $teacher['status']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Teacher created successfully']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleUpdateTeacher($pdo, $data) {
    try {
        $teacher = $data['teacher'];
        
        // Check if email or username already exists for other teachers
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM teachers 
            WHERE (email = ? OR username = ?) 
            AND id != ?
        ");
        $stmt->execute([$teacher['email'], $teacher['username'], $teacher['id']]);
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('Email or username already exists');
        }
        
        $sql = "
            UPDATE teachers SET 
                teacher_name = ?, father_name = ?, username = ?,
                email = ?, class = ?, subject = ?,
                address = ?, status = ?
        ";
        $params = [
            $teacher['teacherName'],
            $teacher['fatherName'],
            $teacher['username'],
            $teacher['email'],
            $teacher['class'],
            json_encode($teacher['subject']),
            $teacher['address'],
            $teacher['status']
        ];
        
        // Add password to update if provided
        if (!empty($teacher['password'])) {
            $sql .= ", password = ?";
            $params[] = password_hash($teacher['password'], PASSWORD_DEFAULT);
        }
        
        $sql .= " WHERE id = ?";
        $params[] = $teacher['id'];
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Teacher updated successfully']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleDeleteTeacher($pdo, $data) {
    try {
        $teacherId = $data['teacherId'];
        
        $stmt = $pdo->prepare("DELETE FROM teachers WHERE id = ?");
        $stmt->execute([$teacherId]);
        
        echo json_encode(['success' => true, 'message' => 'Teacher deleted successfully']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

