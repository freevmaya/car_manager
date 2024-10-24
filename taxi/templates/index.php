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
GLOBAL $anti_cache;

$this->scripts = array_unique($this->scripts);
foreach ($this->scripts as $script) {
    $scriptUrl = strpos($script, '//') > -1 ? $script : (SCRIPTURL.'/'.$script.$anti_cache);
?>
    <script src="<?=$scriptUrl?>"></script>
<?
}
$this->styles = array_unique($this->styles);
foreach ($this->styles as $style) {?>
    <link rel="stylesheet" type="text/css" href="<?=$style?>"></script>
<?}?>
    <script src="https://telegram.org/js/telegram-web-app.js" async></script>
    <script type="text/javascript">
        var BASEURL = '<?=BASEURL?>';
        var app = new App();
    <?if ($this->user) {?>

        var user = <?=json_encode($this->user)?>;
        $.getScript('<?=SCRIPTURL?>/language/' + user.language_code + '.js');

    <?} else {?>

        var user = <?=$devUser?>;
        $.getScript('<?=SCRIPTURL?>/language/en.js');

    <?}?>

    <?
    if (count(html::$jscode) > 0) {
        echo "$(window).ready(()={\n";
        foreach (html::$jscode as $key=>$code) {
            echo "----JS-{$key}---\n";
            echo $code;
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

    <!-- Eruda is console for mobile browsers
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script> -->
</body>
</html>