<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');
	$currenOrder = (new OrderModel())->getItems(['state'=>'wait', 'user_id'=>$this->getUser()['id']]);
	trace($this->getUser()['id']);
	if (count($currenOrder) > 0)
		html::AddJsCode("currentOrder = cnvDbOrder(".json_encode($currenOrder[0]).");");
?>