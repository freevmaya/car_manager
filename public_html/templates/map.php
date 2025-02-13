<?

	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');

	$orderModel = new OrderModel();
	$routeModel = new RouteModel();

	if ($this->asDriver) {
//------------------------------DRIVER---------------------------------------------

		html::AddScriptFile("kalman-filter.min.js");
		html::AddScriptFile("order.js");
		html::AddScriptFile("graph.js");
		html::AddScriptFile("driver/orderView.js");
		html::AddScriptFile("driver/taken-orders.js");
		html::AddScriptFile("driver/tracerOrderView.js");
		html::AddScriptFile("driver/driver-on-line.js");

		$wait_orders = $orderModel->getItems(['state'=>['wait', 'driver_move']]);
		$orders = array_merge($wait_orders, $orderModel->getItems(['driver_id'=>$this->asDriver, 'state'=>ACTIVEORDERLIST_ARR]));

		if (count($wait_orders) > 0)
			(new OrderListeners())->AddListener(BaseModel::getListValues($wait_orders, 'id'), $user['id']);

		html::AddJsData(
				(new DriverModel())->getItem(['user_id'=>$user['id']])
			, 'driver');

		html::AddJsCode("
			new DMap($('#map'));
			new TakenOrders(".json_encode($orders).");
		");

		html::AddTemplateFile('driver/orderInfo.php', 'orderInfo');
		html::AddTemplateFile('driver/offerView.php', 'offerView');
		html::AddTemplateFile('driver/orderView.php', 'orderView');
		html::AddTemplateFile('driver/takenOrderView.php', 'takenOrderView');
		html::AddTemplateFile('driver/timelineMarker.php', 'timelineMarker');

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

		html::AddJsCode('
			checkCondition(()=>{
			    return typeof(google) != "undefined";
			}, ()=>{
			    new VMap($("#map"), ()=>{
			        v_map.driverManagerOn(true);
			        v_map.add(new Passenger(jsdata.currentOrder));
			    });
			});
		', 'initMapLayer');
	}

	$services = ['logplayer', 'drawpath'];

	foreach ($services as $service)
		if (isset(Page::$request[$service])) {
			html::AddScriptFile("services/{$service}.js");
		}
?>