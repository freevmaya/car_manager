<?
GLOBAL $devUser, $user, $lang, $anti_cache;
include_once(MODULESPATH.'/views.php');

$anti_cache = '?=48';

$options = ['user_id' => $user['id'], 'state'=>['receive', 'active']];
html::AddJsData(json_encode(
    BaseModel::FullItems((new NotificationModel())->getItems($options), ['content_id'=>new OrderModel()])
), 'notificationList');

html::AddJsData("'".$this->createRequestId(get_class($this))."'", 'ajaxRequestId');

?>
<!DOCTYPE html>
<html lang="<?=$user['language_code']?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?=$this->title?></title>
    <link rel="stylesheet" type="text/css" href="<?=BASEURL?>/css/styles.css<?=$anti_cache?>">
    <link rel="stylesheet" type="text/css" href="<?=BASEURL?>/css/colors-<?=$this->colorSheme('01')?>.css<?=$anti_cache?>">
    <script type="text/javascript">var DEV = <?=DEV ? 'true' : 'false'?>;</script>
    <script src="<?=DEV ? SCRIPTURL : 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1'?>/jquery.min.js"></script>   
    <script src="<?=SCRIPTURL?>/consts.js<?=$anti_cache?>"></script> 
    <script src="<?=SCRIPTURL?>/component.js<?=$anti_cache?>"></script>    
    <script src="<?=SCRIPTURL?>/main.js<?=$anti_cache?>"></script>  
    <script src="<?=SCRIPTURL?>/geolocation<?=DEV?'_dev':''?>.js<?=$anti_cache?>"></script> 
    <?=html::RenderJSFiles($anti_cache);?>
    <?=html::RenderStyleFiles();?>
    <script src="https://telegram.org/js/telegram-web-app.js" async></script>
    <script type="text/javascript">

        window.addEventListener("error", (e) => {

            //console.error(e);
            Ajax({
                action: 'catchError',
                data: {message: e.message, stack: e.error.stack}
            });
        });
        var BASEURL = '<?=BASEURL?>';
        var lang = <?=preg_replace("/[\r\n]+/", '', json_encode($lang, JSON_PRETTY_PRINT))?>;
        var transport = new AjaxTransport(1000);
        var app = new App();
        var fieldIdx = <?=html::fieldIdx()?>;
        var travelMode = '<?=TRAVELMODE?>';
        
        
    <?if ($user) {?>

        var user = <?=json_encode($user)?>;
        <?=$this->asDriver() ? "user.asDriver = {$this->asDriver()};\n" : ''?>

    <?} else if (DEV) {?>

        var user = <?=$devUser?>;

    <?}?>
    <?=html::RenderJSData()?>
    <?=html::RenderJSCode()?>
    </script>
</head>
<body>
    <div class="wrapper">
        <div id="modal-windows"></div>
        <div id="back-content">
            <div id="windows">
                <div class="bottom-layer"></div>
            </div>
            <?=$content?>
        </div>
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