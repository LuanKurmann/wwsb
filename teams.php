
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js" integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN" crossorigin="anonymous"></script>
    <title>WWSB</title>
    <script type="text/javascript">
        // Funktion, um die ausgewählten Daten anzuzeigen
        function showSelectedData() {
            // Datensatz abrufen, der in der HTML-Ansicht ausgewählt wurde
            var id = document.getElementsByName("id")[0].value;

            // AJAX-Anfrage an die PHP-Ansicht senden, um die ausgewählten Daten zu holen
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // Ergebnis als JSON-Objekt parsen
                var data = JSON.parse(this.responseText);
                // Ausgewählte Daten in der HTML-Ansicht anzeigen
                //getResultate(data.team);
                document.getElementById("resultate").src = data.resultalte;
                document.getElementById("tabelle").src = data.tabelle;
              }
            };
            xhr.open("GET", "getSelectetTeam.php?id=" + id, true);
            xhr.send();

           
        }

        function getResultate(team) {
          var xhr1 = new XMLHttpRequest();
            xhr1.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // Ergebnis als JSON-Objekt parsen
                var data1 = JSON.parse(this.responseText);
                // Ausgewählte Daten in der HTML-Ansicht anzeigen
                document.getElementById("results").innerHTML = data1.team1 + " - " + data1.team2 + " " + data1.resultat1 + " : " + data1.resultat2;
              }
            };
            xhr1.open("GET", "getResults.php?team=" + team, true);
            xhr1.send();
        }
        
        // Event-Listener hinzufügen, um die Funktion beim Ändern des Auswahl-Felds aufzurufen
        //document.getElementsByName("id")[0].addEventListener("change", showSelectedData);

    </script>
</head>
<body onload="showSelectedData()">
    <div id="select">
        <form action="getSelectetTeam.php" method="get">
        <select name="id" onchange="showSelectedData()">
        <!-- Optionen für jeden verfügbaren Datensatz anzeigen -->
        <?php
          require_once 'database.php';
          $database = new Database();
          $conn = $database->getConnection();
          $stmt = $database->getWebviews();
          while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            extract($row);
            echo '<option value="' . $id . '">' . $team . '</option>';
          }

          // Verbindung schließen (siehe unten)
        ?>
      </select>
    </form> 
    </div>
    <div id="results">
        
    </div>
    <!-- Hier werden die ausgewählten Daten angezeigt -->
    <iframe id="resultate" frameborder="0"></iframe>
    <iframe id="tabelle" frameborder="0"></iframe>
    <?php include('partials/nav.php') ?>
</body>
</html>