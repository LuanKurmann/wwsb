<?php
$team = $_GET['team'];


require_once 'database.php';
$database = new Database();
$conn = $database->getConnection();
$stmt = $database->getResultate($team);


  
if ($stmt != null) {
    echo json_encode($stmt);
} else {
    echo "Keine Ergebnisse gefunden";
}

  // Verbindung schließen (wie oben)
?>