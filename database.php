<?php
class Database {
  private $host = "localhost";
  private $db_name = "wwsb";
  private $username = "wwsb";
  private $password = "e8i38cY@?qG3L?q6";
  private $conn;

  public function getConnection() {
    $this->conn = null;

    try {
      $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
      $this->conn->exec("set names utf8");
    } catch(PDOException $exception) {
      echo "Connection error: " . $exception->getMessage();
    }

    return $this->conn;
  }

  public function addAttribute($type, $team, $title, $short_desc, $desc) {
    $query = "INSERT INTO news (type, team, title, short_desc, `desc`, date) VALUES (:type, :team, :title, :short_desc, :desc, NOW())";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':team', $team);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':short_desc', $short_desc);
    $stmt->bindParam(':desc', $desc);
    $stmt->execute();
  }

  public function getAllAttributes() {
    $query = "SELECT * FROM news";
    $stmt = $this->conn->prepare($query);
    $stmt->execute();
    return $stmt;
  }

  public function getAttribute($id) {
    $query = "SELECT * FROM news WHERE id = :id LIMIT 0,1";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    return $stmt;
  }

  public function getWebviews() {
    $query = "SELECT * FROM webview";
    $stmt = $this->conn->prepare($query);    
    $stmt->execute();
    return $stmt;
  }

  public function getWebview($id) {
    $query = "SELECT * FROM webview WHERE id = :id LIMIT 0,1";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    return $stmt;
  }

  public function updateAttribute($id, $type, $team, $title, $short_desc, $desc) {
    $query = "UPDATE news SET type = :type, team = :team, title = :title, short_desc = :short_desc, `desc` = :desc WHERE id = :id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':team', $team);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':short_desc', $short_desc);
    $stmt->bindParam(':desc', $desc);
    $stmt->execute();
  }

  public function incrementViews($id) {
    $stmt = $this->conn->prepare("UPDATE news SET viewd = viewd + 1 WHERE id = ?");
    $stmt->bindParam(1, $id);
    if ($stmt->execute()) {
      return true;
    } else {
      return false;
    }
  }
}
?>