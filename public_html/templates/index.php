<?
GLOBAL $devUser, $user;
$anti_cache = '?_=24';

$options = ['user_id' => $user['id'], 'state'=>['receive', 'active']];
html::AddJsData(json_encode(
    BaseModel::FullItems((new NotificationModel())->getItems($options), ['content_id'=>new OrderModel()])
), 'notificationList');

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?=$this->title?></title>
    <link rel="stylesheet" type="text/css" href="<?=BASEURL?>/css/styles.css<?=$anti_cache?>">
    <link rel="stylesheet" type="text/css" href="<?=BASEURL?>/css/colors-<?=$this->colorSheme('01')?>.css<?=$anti_cache?>">
    <script src="<?=DEV ? SCRIPTURL : 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1'?>/jquery.min.js"></script>    
    <script src="<?=SCRIPTURL?>/main.js<?=$anti_cache?>"></script>
    <?=html::RenderJSFiles();?>
    <?=html::RenderStyleFiles();?>
    <script src="https://telegram.org/js/telegram-web-app.js" async></script>
    <script type="text/javascript">

        window.addEventListener("error", (e) => {
            Ajax({
                action: 'catchError',
                data: {message: e.message, stack: e.error.stack}
            });
        });

        var BASEURL = '<?=BASEURL?>';
        var ajaxRequestId = '<?=$this->createRequestId(get_class($this))?>';
        var transport = new AjaxTransport(1000);
        var app = new App();
        var lang = {};
        var fieldIdx = <?=html::fieldIdx()?>;
        var travelMode = 'WALKING';

        function watchPosition(action) {
            <?if (DEV) {
                ?>
                let latLng = toLatLng(<?=$this->asDriver() ? "{latitude: 55.190449, longitude: 61.279631 }" : "{latitude: 55.19068764669877, longitude: 61.28231993933741}"?>);

                user = $.extend(user, latLng);
                return setInterval(()=>{
                    action(latLng);
                }, 500);
            <?} else {?>
                return navigator.geolocation.watchPosition((result)=>{
                    let latLng = toLatLng(result.coords);
                    user = $.extend(user, latLng);
                    action(latLng);
                });
            <?}?>
        }

        function clearWatchPosition(watchId) {
            <?if (DEV) {?>
                clearInterval(watchId);
            <?} else {?>
                navigator.geolocation.clearWatch(watchId);
            <?}?>
        }

        function getLocation(action) {
            <?if (DEV) {
                ?>
                let latLng = toLatLng(<?=$this->asDriver() ? "{latitude: 55.190449, longitude: 61.279631 }" : "{latitude: 55.19068764669877, longitude: 61.28231993933741}"?>);

                user = $.extend(user, latLng);
                action(latLng);
            <?} else {?>
                navigator.geolocation.getCurrentPosition((result)=>{
                    let latLng = toLatLng(result.coords.langitude);
                    user = $.extend(user, latLng);
                    action(latLng);
                });
            <?}?>
        }
        
    <?if ($user) {?>

        var user = <?=json_encode($user)?>;
        <?=$this->asDriver() ? "user.asDriver = {$this->asDriver()};\n" : ''?>
        <?=$this->sendCoordinates() ? "user.sendCoordinates = true;\n" : ''?>
        $.getScript('<?=SCRIPTURL?>/language/' + user.language_code + '.js');

    <?} else if (DEV) {?>

        var user = <?=$devUser?>;
        $.getScript('<?=SCRIPTURL?>/language/en.js');

    <?}?>
    <?=html::RenderJSData()?>
    <?=html::RenderJSCode()?>
    </script>
</head>
<body>
    <div class="wrapper">
        <?=$content?>
    </div>

    <?=html::RenderTemplates()?>

    <?
    GLOBAL $isDefServer;
    if (!$isDefServer) {?>
    <!-- Eruda is console for mobile browsers-->
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script>
    <?}?> 
</body>
</html>