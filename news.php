<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
  	<link rel="stylesheet" href="assets/css/style.css">
  	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js" integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN" crossorigin="anonymous"></script>
    <title>WWSB</title>
</head>
<body>
    <div class="attributes">
	<h1>News</h1>
    <hr>
    <?php
      require_once 'database.php';
      $database = new Database();
      $conn = $database->getConnection();
      $stmt = $database->getAllAttributes();
      while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        echo "<a style='text-decoration: none; color: black;' href='./newsItem.php?id={$id}'>";
        echo "<div class='attribute'>";
        echo "<h2 class='title'>{$title}</h2>";
        echo "<p class='description'>{$short_desc}</p>";
        echo "<p class='description' style='color: gray; font-size:12px;'>{$date}</p>";
        echo "</div></a><hr>";
      }
    ?>
  </div>
    <?php include('partials/nav.php') ?>
</body>
</html>