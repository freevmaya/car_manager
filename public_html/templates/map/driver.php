<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');


	$options = ['state'=>'wait'];
	html::AddJsCode("
		startOrders = ".json_encode((new OrderModel())->getItems($options)).";
	");
	html::AddScriptFile("driver-on-line.js");
?>
