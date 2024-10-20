<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?=$this->title?></title>
    <link rel="stylesheet" type="text/css" href="css/styles.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<?
GLOBAL $anti_cache, $defUser;
foreach ($this->scripts as $script) {
    $scriptUrl = strpos($script, 'http') > -1 ? $script : ('scripts/'.$script.$anti_cache);
?>
    <script src="<?=$scriptUrl?>"></script>
<?
}
foreach ($this->styles as $style) {?>
    <link rel="stylesheet" type="text/css" href="<?=$style?>"></script>
<?}?>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="scripts/main.js<?=$anti_cache?>"></script>
    <script src="scripts/views.js<?=$anti_cache?>"></script>
    <script type="text/javascript">
        var BASEURL = '<?=BASEURL?>';
        var app = new App();
        var user;
        setTimeout(()=>{
            user = Telegram.WebApp.initDataUnsafe.user ? Telegram.WebApp.initDataUnsafe.user : <?=$defUser?>;
            app.SetUser(user);
        }, 200);

    </script>
</head>
<body>
    <?=$content?>

    <!-- Eruda is console for mobile browsers -->
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script>
</body>
</html>