<?

	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');

	if (DEV)
		html::AddScriptFile("passenger/dev.js");

	$orderModel = new OrderModel();

	if ($this->asDriver) {
//------------------------------DRIVER---------------------------------------------

		html::AddScriptFile("driver/orderView.js");
		html::AddScriptFile("driver/tracerOrderView.js");
		html::AddScriptFile("driver/driver-on-line.js");

		$wait_orders = $orderModel->getItems(['state'=>'wait']);
		html::AddJsData(
				$wait_orders
			, 'all_orders');

		if (count($wait_orders) > 0)
			(new OrderListeners())->AddListener(BaseModel::getListValues($wait_orders, 'id'), $user['id']);

		html::AddJsData(
				$orderModel->getItemsWithChanges(['driver_id'=>$this->asDriver, 'state'=>ACTIVEORDERLIST_ARR])
			, 'taken_orders');
		html::AddJsData(
				(new DriverModel())->getItem(['user_id'=>$user['id']])
			, 'driver');

		html::AddJsCode("
			new DMap($('#map'));
		");

		html::AddTemplateFile('driver/orderInfo.php', 'orderInfo');
		html::AddTemplateFile('driver/offerView.php', 'offerView');
		html::AddTemplateFile('driver/orderView.php', 'orderView');

	} else {
//------------------------------PASSENGER---------------------------------------------

		html::AddScriptFile("passenger/order-states.js");
		
		$orders = (new OrderModel())->getItems(['o.user_id'=>$user['id'], 'state'=>ACTIVEORDERLIST_ARR, 'limit'=>1]);

		$order = count($orders) > 0 ? $orders[0] : null;
		if ($order)
			html::AddJsData($order, 'currentOrder');

		html::AddTemplate('<div class="car">
	        <div class="car-image-box">
	            <img class="car-image"></img>
	            <span>{name}</span>
	        </div>
	    </div>', 'car');

	    html::AddTemplate(html::RenderField(['type'=>'order'], $order), 'order');
		html::AddTemplate(html::RenderField(['type'=>'target-view']), 'target-view');

		html::AddTemplate(html::RenderField(['type'=>'driver']), 'driver');
	    
		html::AddJsCode("new VMap($('#map'), Mechanics);");
	}
?>