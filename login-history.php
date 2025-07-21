<?php
// Allow requests from both localhost and the production domain
$allowedOrigins = [
    'http://localhost:3000',
    'https://edu.largifysolutions.com',
    'http://edu.largifysolutions.com'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Origin');
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

try {
    // Handle different HTTP methods
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($input['user_id']) || !isset($input['device']) || !isset($input['ip_address']) || !isset($input['browser'])) {
                throw new Exception('Missing required fields: user_id, device, ip_address, and browser are required');
            }
            
            // Insert new login history
            $insertQuery = "INSERT INTO login_history (user_id, login_date, login_time, device, ip_address, browser) 
                           VALUES (:user_id, :login_date, :login_time, :device, :ip_address, :browser)";
            
            $stmt = $pdo->prepare($insertQuery);
            $stmt->execute([
                ':user_id' => (int)$input['user_id'],
                ':login_date' => $input['login_date'],
                ':login_time' => $input['login_time'],
                ':device' => $input['device'],
                ':ip_address' => $input['ip_address'],
                ':browser' => $input['browser']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Login history recorded successfully'
            ]);
            break;

        case 'GET':
            // Get request parameters from URL query string
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $search = isset($_GET['search']) ? trim($_GET['search']) : '';
            $device = isset($_GET['device']) ? trim($_GET['device']) : '';
            $offset = ($page - 1) * $limit;

            $query = "
                SELECT 
                    l.id,
                    COALESCE(u.name, 'Unknown User') as account,
                    DATE_FORMAT(l.login_date, '%d-%m-%Y') as date,
                    TIME_FORMAT(l.login_time, '%h:%i:%s %p') as time,
                    l.device,
                    l.ip_address as ipAddress,
                    l.browser
                FROM login_history l
                LEFT JOIN users u ON l.user_id = u.id
                WHERE 1=1
            ";
            $params = [];

            if ($search) {
                $query .= " AND (u.name LIKE :search1 OR l.ip_address LIKE :search2 OR l.browser LIKE :search3)";
                $searchTerm = "%$search%";
                $params[':search1'] = $searchTerm;
                $params[':search2'] = $searchTerm;
                $params[':search3'] = $searchTerm;
            }

            if ($device) {
                $query .= " AND l.device = :device";
                $params[':device'] = $device;
            }

            // Get total count first
            $countQuery = "SELECT COUNT(*) as total FROM login_history l LEFT JOIN users u ON l.user_id = u.id WHERE 1=1";
            if ($search) {
                $countQuery .= " AND (u.name LIKE :search1 OR l.ip_address LIKE :search2 OR l.browser LIKE :search3)";
            }
            if ($device) {
                $countQuery .= " AND l.device = :device";
            }
            
            $countStmt = $pdo->prepare($countQuery);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Add pagination to the main query
            $query .= " ORDER BY l.login_date DESC, l.login_time DESC LIMIT :limit OFFSET :offset";
            $stmt = $pdo->prepare($query);
            
            // Bind all parameters
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'history' => $history,
                'total' => $total
            ]);
            exit;
            break;
    }
} catch(Exception $e) {
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}