<?

	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');

	html::AddScriptFile("select-target.js");
		
	$orders = (new OrderModel())->getItems(['state'=>['wait', 'accepted'], 'o.user_id'=>$user['id']]);//, 'routes'=>true]);

	if (count($orders) > 0) 
		html::AddJsCode("currentOrder = ".json_encode($orders[0]).';');

	html::AddTemplate('<div class="car">
        <div class="car-image-box">
            <img class="car-image"></img>
            <span>{name}</span>
        </div>
    </div>', 'car');
    
	html::AddJsCode("new VMap($('#map'), Mechanics);");
?>