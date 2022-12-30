<?php
  // Verbindung zur Datenbank herstellen
  $conn = mysqli_connect("localhost", "root", "", "login");

  // Überprüfen, ob Formular gesendet wurde
  if (isset($_POST['username']) && isset($_POST['password'])) {
    // Anmeldeinformationen aus dem Formular abrufen
    $username = mysqli_real_escape_string($conn, $_POST['username']);
    $password = mysqli_real_escape_string($conn, $_POST['password']);

    // Salt generieren
    $salt = bin2hex(random_bytes(32));

    // Passwort mit Salt hashen
    $hashed_password = hash('sha256', $password . $salt);

    // Neues Benutzerkonto in der Datenbank erstellen
    $query = "INSERT INTO users (username, password, salt) VALUES ('$username', '$hashed_password', '$salt')";
    mysqli_query($conn, $query);

    // Erfolgsmeldung anzeigen
    echo "Account created successfully";
  }
?>

<!-- HTML-Formular für die Registrierung -->
<form action="register.php" method="post">
  <label for="username">Username:</label><br>
  <input type="text" id="username" name="username"><br>
  <label for="password">Password:</label><br>
  <input type="password" id="password" name="password"><br><br>
  <input type="submit" value="Submit">
</form> 