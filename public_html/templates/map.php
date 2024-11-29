<?

	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');

	$orderModel = new OrderModel();

	if ($this->asDriver) {
//------------------------------DRIVER---------------------------------------------

		html::AddScriptFile("driver/driver-on-line.js");

		html::AddJsData(
				$orderModel->getItems(['state'=>['wait', 'accepted', 'wait_meeting', 'execution']])
			, 'orders');

		html::AddJsCode("
			new VMap($('#map'), DriverMechanics, {markerManagerClass: MarkerOrderManager});
		");

	} else {
//------------------------------PASSENGER---------------------------------------------

		html::AddScriptFile("passenger/order-states.js"); 
		//html::AddScriptFile("passenger/driver-field.js");
		
		$orders = (new OrderModel())->getItems(['o.user_id'=>$user['id'], 'state'=>['wait', 'accepted', 'execution', 'wait_meeting'], 'limit'=>1]);

		$order = count($orders) > 0 ? $orders[0] : null;
		if ($order)
			html::AddJsCode("currentOrder = ".json_encode($order).';');

		html::AddTemplate('<div class="car">
	        <div class="car-image-box">
	            <img class="car-image"></img>
	            <span>{name}</span>
	        </div>
	    </div>', 'car');

	    html::AddTemplate(html::RenderField(['type'=>'order'], $order), 'order');

		//html::AddTemplate(html::RenderField(['type'=>'driver']), 'driver');
	    
		html::AddJsCode("new VMap($('#map'), Mechanics);");
	}
?>