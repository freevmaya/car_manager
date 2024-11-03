<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?=$this->title?></title>
    <link rel="stylesheet" type="text/css" href="<?=BASEURL?>/css/styles.css">
    <link rel="stylesheet" type="text/css" href="<?=BASEURL?>/css/colors-<?=$this->colorSheme('01')?>.css">
    <script src="<?=DEV ? SCRIPTURL : 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1'?>/jquery.min.js"></script>    
    <script src="<?=SCRIPTURL?>/main.js"></script>
<?
GLOBAL $anti_cache, $devUser;

html::$scripts = array_unique(html::$scripts);
foreach (html::$scripts as $script) {
    $scriptUrl = strpos($script, '//') > -1 ? $script : (SCRIPTURL.'/'.$script.$anti_cache);
?>
    <script src="<?=$scriptUrl?>"></script>
<?
}
html::$styles = array_unique(html::$styles);
foreach (html::$styles as $style) {?>
    <link rel="stylesheet" type="text/css" href="<?=$style?>"></script>
<?}?>
    <script src="https://telegram.org/js/telegram-web-app.js" async></script>
    <script type="text/javascript">
        var BASEURL = '<?=BASEURL?>';
        var ajaxRequestId = '<?=$this->createRequestId(get_class($this))?>';
        var transport = new AjaxTransport(1000);
        var app = new App();
        var lang = {};

        function getLocation(action) {
            <?if (DEV) {
                ?>
                action(<?=$this->asDriver() ? "{latitude: 55.190449, longitude: 61.279631 }" : "{latitude: 55.19068764669877, longitude: 61.28231993933741}"?>);
            <?} else {?>
                navigator.geolocation.getCurrentPosition((result)=>{
                    action(result.coords);
                });
            <?}?>
        }
        
    <?if ($this->user) {?>

        var user = <?=json_encode($this->user)?>;
        <?=$this->asDriver() ? "user.asDriver = true;\n" : ''?>
        <?=$this->sendCoordinates() ? "user.sendCoordinates = true;\n" : ''?>
        $.getScript('<?=SCRIPTURL?>/language/' + user.language_code + '.js');

    <?} else {?>

        var user = <?=$devUser?>;
        $.getScript('<?=SCRIPTURL?>/language/en.js');

    <?}?>
    <?
    if (count(html::$jscode) > 0) {
        echo "$(window).ready(() => {\n";
        foreach (html::$jscode as $key=>$code) {
            echo "//----JS-{$key}---\n";
            echo $code."\n";
        }
        echo "});\n";
    }
    ?>
    </script>
</head>
<body>
    <div class="wrapper">
        <?=$content?>
    </div>

    <!-- Eruda is console for mobile browsers-->
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script> 
</body>
</html>