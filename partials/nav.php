<?php 
$url = $_SERVER['REQUEST_URI']; 
?>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<nav class="nav">
    <a href="index.php" class="<?php if($url == '/' || $url == '/index.php') {echo 'nav__link nav__link--active';} else {echo 'nav__link';} ?>">
        <i class="material-icons nav__icon">home</i>
    </a>
    <a href="news.php" class="<?php if($url == '/news.php' || preg_match("/\/wwsb\/newsItem\.php\?id=\d+/",$url)) {echo 'nav__link nav__link--active';} else {echo 'nav__link';} ?>">
        <i class="material-icons nav__icon">newspaper</i>
    </a>
    <a href="teams.php" class="<?php if($url == '/teams.php') {echo 'nav__link nav__link--active';} else {echo 'nav__link';} ?>">
        <i class="material-icons nav__icon">table_chart</i>
    </a>
</nav>

