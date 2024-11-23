<?

	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');

	$orderModel = new OrderModel();
			
	$orders = $orderModel->getItems(['state'=>['wait', 'accepted'], 'o.user_id'=>$user['id']]);//, 'routes'=>true]);

	$order = false;
	if (count($orders) > 0)
		$order = $orders[0];

	if ($this->asDriver) {
//------------------------------DRIVER---------------------------------------------

		html::AddScriptFile("driver/driver-on-line.js");

		html::AddJsData(
			array_merge(
				$orderModel->getItems(['state'=>'wait']),
				$orderModel->getItems(['state'=>'accepted', 'user_id'=>$user['id']])
			), 'orders');

		html::AddJsCode("
			new VMap($('#map'), DriverMechanics, {markerManagerClass: MarkerOrderManager});
		");

	} else {
//------------------------------PASSENGER---------------------------------------------

		html::AddScriptFile("passenger/order-states.js"); 
		html::AddScriptFile("passenger/driver-field.js");

		if ($order)
			html::AddJsCode("currentOrder = ".json_encode($order).';');

		html::AddTemplate('<div class="car">
	        <div class="car-image-box">
	            <img class="car-image"></img>
	            <span>{name}</span>
	        </div>
	    </div>', 'car');

		html::AddTemplate(html::RenderField(['type'=>'driver']), 'driver');
	    
		html::AddJsCode("new VMap($('#map'), Mechanics);");
	}
?>