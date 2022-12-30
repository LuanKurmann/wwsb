<?php
  // Verbindung zur Datenbank herstellen
  $conn = mysqli_connect("localhost", "root", "", "login");

  // Überprüfen, ob Anmeldeinformationen gesendet wurden
  if (isset($_POST['username']) && isset($_POST['password'])) {
    // Anmeldeinformationen aus dem Formular abrufen
    $username = mysqli_real_escape_string($conn, $_POST['username']);
    $password = mysqli_real_escape_string($conn, $_POST['password']);

    // Benutzer mit dem angegebenen Benutzernamen in der Datenbank abrufen
    $query = "SELECT * FROM users WHERE username='$username'";
    $result = mysqli_query($conn, $query);
    if (mysqli_num_rows($result) == 1) {
      // Benutzer gefunden, Salt und hashed_password aus der Datenbank abrufen
      $row = mysqli_fetch_assoc($result);
      $salt = $row['salt'];
      $hashed_password = $row['password'];

      // Eingebenes Passwort mit Salt hashen und mit dem gespeicherten hashed_password vergleichen
      if (hash('sha256', $password . $salt) == $hashed_password) {
        // Anmeldeinformationen sind korrekt, Session starten und Anmeldeinformationen als Session-Variablen speichern
        session_start();
        $_SESSION['username'] = $username;
        $_SESSION['password'] = $hashed_password;

        // Weiterleiten zum Dashboard
        header("Location: dashboard.php");
        exit;
      } else {
        // Anmeldeinformationen sind falsch, Fehlermeldung anzeigen
        echo "Invalid username or password";
      }
    } else {
      // Benutzer nicht gefunden, Fehlermeldung anzeigen
      echo "Invalid username or password";
    }
  }
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
  	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js" integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="style.css"/>
    <title>WWSB Admin</title>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
          <div class="col-sm-6">
                <form action="login.php" method="post" class="form-horizontal">
                    <div class="form-group">
                    <label for="username" class="control-label col-sm-2">Username:</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="username" name="username" required>
                    </div>
                    </div>
                    <div class="form-group">
                    <label for="password" class="control-label col-sm-2">Password:</label>
                    <div class="col-sm-10">
                        <input type="password" class="form-control" id="password" name="password" required>
                    </div>
                    </div>
                    <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <input type="submit" class="btn btn-primary" value="Submit">
                    </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>