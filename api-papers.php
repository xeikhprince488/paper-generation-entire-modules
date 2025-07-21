<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Hostinger MySQL connection details
$db_host = 'edu.largifysolutions.com';
$db_name = 'u421900954_ecompapgen';
$db_user = 'u421900954_PaperGenerator';
$db_pass = 'PaperGeneratorByAhmad786';

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get papers based on status
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $status = isset($_GET['status']) ? $_GET['status'] : 'SAVED';
        $stmt = $conn->prepare("SELECT * FROM allpapers WHERE status = ? ORDER BY created_at DESC");
        $stmt->execute([$status]);
        $papers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($papers);
    }
    
    // Handle PATCH requests for status updates
    if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $input = json_decode(file_get_contents('php://input'), true);
        $paperId = basename($_SERVER['REQUEST_URI']);
        
        $stmt = $conn->prepare("UPDATE allpapers SET status = ? WHERE id = ?");
        $stmt->execute([$input['status'], $paperId]);
        
        echo json_encode(['success' => true, 'message' => 'Status updated successfully']);
    }

    // Handle POST request for saving papers
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            // Get the raw POST data
            $rawData = file_get_contents('php://input');
            
            // First try to decode as JSON
            $input = json_decode($rawData, true);
            
            // If JSON decode failed, try to handle as form data
            if (!$input && $_POST) {
                $input = $_POST;
            }
            
            // Final validation
            if (!$input || !isset($input['class']) || !isset($input['subject'])) {
                throw new Exception('Invalid input data: Required fields missing');
            }
            
            // Use current timestamp if not provided
            $created_at = isset($input['created_at']) ? $input['created_at'] : date('Y-m-d H:i:s');
            $updated_at = isset($input['updated_at']) ? $input['updated_at'] : date('Y-m-d H:i:s');
            
            // Prepare and execute the SQL statement - only using columns that exist in the table
            $stmt = $conn->prepare("INSERT INTO allpapers (
                class, 
                subject, 
                content, 
                status, 
                created_at, 
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)");

            $stmt->execute([
                $input['class'],
                $input['subject'],
                $input['content'],
                $input['status'] ?? 'SAVED',
                $created_at,
                $updated_at
            ]);

            echo json_encode(['success' => true, 'message' => 'Paper saved successfully', 'id' => $conn->lastInsertId()]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save paper: ' . $e->getMessage()]);
        }
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
}
?>

