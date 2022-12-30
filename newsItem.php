<!DOCTYPE html>
<html>
<head>
  <title>News</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
  <link rel="stylesheet" href="assets/css/style.css">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js" integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN" crossorigin="anonymous"></script>
</head>
<body>
  <div class="attributes">
  <a href="./news.php"><i class="material-icons" style="color: black;">arrow_back_ios_new</i></a>

    <?php
      require_once 'database.php';
      $database = new Database();
      $conn = $database->getConnection();
      $id = $_GET['id']; // set the ID of the attribute to retrieve
      $database->incrementViews($id);
      $stmt = $database->getAttribute($id);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      extract($row);
      ?>
        <h1><?php echo $title ?></h1>
        <div class="description"><?php echo $desc ?></div>
        <div class="infos" style='color: gray; font-size:12px;'>Views: <?php echo $viewd ?> | <?php echo $date ?> | <?php echo $team ?></div>
  </div>
  <?php include('partials/nav.php') ?>
</body>
</html>