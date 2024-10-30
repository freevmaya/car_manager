<?
    html::AddScriptFile("color.js");

	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');
	$currenOrder = (new OrderModel())->getItems(['state'=>'wait', 'user_id'=>$this->getUser()['id']]);

	if (count($currenOrder) > 0) {
		
		html::AddJsCode("currentOrder = cnvDbOrder(".json_encode($currenOrder[0]).");");
		$offered = (new NotificationModel())->getOffersByOrder($currenOrder[0]['id']);

		if (count($offered) > 0)
			html::AddJsCode("ListOffers = ".json_encode($offered).";");
	}
?>
<div class="templates">
	<div class="notify car">
        <div class="car-image-box chess light">
            <img class="car-image"></img>
            <span>{symbol}</span>
        </div>
        <button>{Go}</button>
        <div class="block">
            <div>Driver: {username}</div>
            <div>Number: {number}</div>
        </div>
    </div>
</div>