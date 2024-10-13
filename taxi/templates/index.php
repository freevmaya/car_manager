<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?=$this->title?></title>
    <link rel="stylesheet" type="text/css" href="css/styles.css">
<?foreach ($this->scripts as $script) {?>
    <script src="scripts/<?=$script.$anti_cache?>"></script>
<?}?>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="scripts/main.js"></script>
</head>
<body>
    <?=$content?>

    <!-- Eruda is console for mobile browsers -->
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script>
</body>
</html>