<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');
	html::AddScriptFile("driver-on-line.js");


	$options = ['state'=>'wait'];
	html::AddJsData((new OrderModel())->getItems($options), 'orders');
	html::AddJsCode("
		new VMap($('#map'), DriverMechanics, {markerManagerClass: MarkerOrderManager});
	");
?>
