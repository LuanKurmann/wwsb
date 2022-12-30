<?php
$id = $_GET['id'];


require_once 'database.php';
$database = new Database();
$conn = $database->getConnection();
$stmt = $database->getWebview($id);
$row = $stmt->fetch(PDO::FETCH_ASSOC);


  
if ($row != null) {
    echo json_encode($row);
} else {
    echo "Keine Ergebnisse gefunden";
}

  // Verbindung schließen (wie oben)
?>