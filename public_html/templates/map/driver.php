<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');
	html::AddScriptFile("driver-on-line.js");

	$orderModel = new OrderModel();

	html::AddJsData(
		array_merge(
			$orderModel->getItems(['state'=>'wait']),
			$orderModel->getItems(['state'=>'accepted', 'user_id'=>$user['id']])
		), 'orders');

	html::AddJsCode("
		new VMap($('#map'), DriverMechanics, {markerManagerClass: MarkerOrderManager});
	");
?>
