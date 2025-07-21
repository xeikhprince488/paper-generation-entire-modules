<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set content type to JSON
header("Content-Type: application/json");

// Database connection
$host = "edu.largifysolutions.com"; // Your Hostinger database host
$username = "u421900954_PaperGenerator";
$password = "PaperGeneratorByAhmad786";
$database = "u421900954_ecompapgen";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Handle POST request to add a new question
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['question'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid request format"]);
        exit();
    }
    
    $question = $data['question'];
    
    // Prepare the SQL query
    $query = "INSERT INTO questions (id, type, chapter, topic, marks, text, options, answer, source, medium, class, subject) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    
    // Convert options array to JSON string if it exists
    $options = $question['type'] === 'mcqs' && isset($question['options']) ? json_encode($question['options']) : null;
    
    // Bind parameters
    $stmt->bind_param(
        "ssssssssssss", 
        $question['id'],
        $question['type'],
        $question['chapter'],
        $question['topic'],
        $question['marks'],
        $question['text'],
        $options,
        $question['answer'],
        $question['source'],
        $question['medium'],
        $question['class'],
        $question['subject']
    );
    
    // Execute the query
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(["success" => true, "message" => "Question added successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to add question: " . $stmt->error]);
    }
    
    $stmt->close();
}

// Handle GET request to fetch questions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $class = isset($_GET['class']) ? $_GET['class'] : '9th';
    $subject = isset($_GET['subject']) ? $_GET['subject'] : 'Biology';
    $topics = isset($_GET['topics']) ? json_decode(urldecode($_GET['topics']), true) : [];

    try {
        if (empty($topics)) {
            throw new Exception("No topics provided");
        }

        // Prepare the base query with topic filter
        $query = "SELECT * FROM questions WHERE class = ? AND subject = ? AND topic IN (" . 
                str_repeat('?,', count($topics) - 1) . '?)';
        
        // Prepare parameters array
        $params = array_merge([$class, $subject], $topics);
        
        // Prepare types string for bind_param
        $types = "ss" . str_repeat("s", count($topics));
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare statement: " . $conn->error);
        }
        
        // Bind parameters dynamically
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $questions = [];
        
        while ($row = $result->fetch_assoc()) {
            // Convert options to array for MCQs
            if ($row['type'] === 'mcqs' && !empty($row['options'])) {
                $row['options'] = json_decode($row['options'], true);
            }
            $questions[] = $row;
        }
        
        echo json_encode([
            "success" => true,
            "questions" => $questions,
            "debug" => [
                "topics" => $topics,
                "query" => $query,
                "params" => $params
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);
    } finally {
        if (isset($stmt)) {
            $stmt->close();
        }
    }
}

// Handle PUT request for updating questions
else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['question'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid request format"]);
        exit();
    }
    
    $question = $data['question'];
    
    $query = "UPDATE questions SET text = ?, options = ?, answer = ? WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $options = $question['type'] === 'mcqs' ? json_encode($question['options']) : null;
    $stmt->bind_param("ssss", $question['text'], $options, $question['answer'], $question['id']);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update question: " . $stmt->error]);
    }
    
    $stmt->close();
}

// Handle DELETE request
else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['questionId'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid request format"]);
        exit();
    }
    
    $questionId = $data['questionId'];
    
    $query = "DELETE FROM questions WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $questionId);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to delete question: " . $stmt->error]);
    }
    
    $stmt->close();
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if this is a fetch request or add question request
    if (isset($data['topics'])) {
        // This is a fetch request
        $topics = $data['topics'];
        
        // Start building the query
        $query = "SELECT * FROM questions WHERE class = '9th' AND subject = 'Biology'";
        
        // Add topic filter if topics are provided
        if (!empty($topics)) {
            $placeholders = str_repeat('?,', count($topics) - 1) . '?';
            $query .= " AND topic IN ($placeholders)";
        }
        
        // Add additional filters if provided
        if (isset($data['type']) && !empty($data['type'])) {
            $query .= " AND type = ?";
        }
        if (isset($data['source']) && !empty($data['source'])) {
            $query .= " AND source = ?";
        }
        if (isset($data['medium']) && !empty($data['medium'])) {
            $query .= " AND medium = ?";
        }
        
        // Prepare statement
        $stmt = $conn->prepare($query);
        
        // Create array of parameters for binding
        $params = [];
        $types = '';
        
        // Add topics to parameters
        if (!empty($topics)) {
            foreach ($topics as $topic) {
                $params[] = $topic;
                $types .= 's';
            }
        }
        
        // Add additional filter parameters
        if (isset($data['type']) && !empty($data['type'])) {
            $params[] = $data['type'];
            $types .= 's';
        }
        if (isset($data['source']) && !empty($data['source'])) {
            $params[] = $data['source'];
            $types .= 's';
        }
        if (isset($data['medium']) && !empty($data['medium'])) {
            $params[] = $data['medium'];
            $types .= 's';
        }
        
        // Bind parameters if there are any
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        // Execute query
        $stmt->execute();
        $result = $stmt->get_result();
        
        // Fetch all questions
        $questions = [];
        while ($row = $result->fetch_assoc()) {
            // Convert options back to array if it's MCQ
            if ($row['type'] === 'mcqs' && !empty($row['options'])) {
                $row['options'] = json_decode($row['options'], true);
            }
            $questions[] = $row;
        }
        
        // Return questions
        echo json_encode([
            "success" => true,
            "questions" => $questions,
            "count" => count($questions)
        ]);
        
        $stmt->close();
    } else if (isset($data['question'])) {
        // This is an add question request
        // ... existing add question code ...
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid request format"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>