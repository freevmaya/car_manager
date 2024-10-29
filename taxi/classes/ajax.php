<?
class Ajax extends Page {

	public function Render($page) {
		header("Content-Type: text/json; charset=".CHARSET);
		echo json_encode($this->ajax());
	}

	public function ajax() {

		if (isset(Page::$request['action'])) {
			$action = Page::$request['action'];
			$requestId = @Page::$request['ajax-request-id'];
			if (method_exists($this, $action) && Page::requiestIdModel($requestId)) {
				$data = isset(Page::$request['data']) ? json_decode(Page::$request['data'], true) : null;

				return $this->$action($data);
			}
		}

		return Page::$request;
	}
	protected function BeganRouteCar($data) {
		GLOBAL $dbp;
		
		$dbp->query("INSERT INTO route (`driver_id`, `car_id`, `path`) VALUES ({$data['driver_id']}, {$data['car_id']}, '{$data['path']}')");

		return ["guid"=>$dbp->lastID()];
	}

	protected function finishWork($data) {
		GLOBAL $dbp;
		$result = $dbp->query("UPDATE driverOnTheLine SET `active`=0, `closeTime`=NOW() WHERE user_id={$data['user_id']}");

		return ["result"=>$result];
	}

	protected function BeginDriver($data) {
		GLOBAL $dbp;
		$result = $dbp->query("REPLACE driverOnTheLine (`user_id`, `car_id`, `active`, `activationTime`, `closeTime`) VALUES ({$this->user['id']}, {$data['car_id']}, 1, NOW(), null)");

		return ["result"=>$result];
	}

	protected function checkState($data) {
		GLOBAL $dbp;

		$result = [];
		$notificationList = $dbp->asArray("SELECT * FROM notifications WHERE state='active' AND user_id = {$this->user['id']}");

		for ($i=0;$i<count($notificationList);$i++) {
			if ($notificationList[$i]['content_type'] == 'orderCreated')
				$notificationList[$i]['order'] = $this->getOrder($notificationList[$i]['content_id']);
		}
		if (count($notificationList))
			$result['notificationList'] = $notificationList;

		return $result;
	}

	protected function StateNotification($data) {
		GLOBAL $dbp;
		$result = $dbp->query("UPDATE notifications SET state = '{$data['state']}' WHERE id = {$data['id']}");
		return ['result'=> $result];
	}

	protected function offerToPerform($data) {
		if ($order = (new OrderModel())->getItem($data['id']))
			(new NotificationModel())->AddNotify($order['id'], 'offerToPerform', $order['user_id'], Lang('OfferToPerform'));
		return $order;
	}

	protected function AddOrder($data) {

		$order_id = (new OrderModel())->AddOrder($data);
		$this->Notify($order_id, 'orderReceive', $this->user['id'], Lang("OrderToProcess"));
		$this->NotifyOrderToDrivers($order_id);

		return ["id"=>$order_id];
	}

	protected function NotifyOrderToDrivers($order_id) {
		GLOBAL $dbp;
		$drivers = $dbp->asArray("SELECT * FROM driverOnTheLine WHERE `active` = 1 AND activationTime > DATE_SUB(NOW(),INTERVAL 1 DAY)");
		foreach ($drivers as $driver)
			$this->Notify($order_id, 'orderCreated', $driver['user_id'], Lang("OrderCreated"));
	}

	protected function getOrder($order_id) {
		GLOBAL $dbp;
		return $dbp->line("SELECT *, u.first_name, u.last_name, u.username ".
			"FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id={$order_id}");
	}

	protected function getOrders($data) {
		GLOBAL $dbp;
		return $dbp->asArray("SELECT *, u.first_name, u.last_name, u.username ".
			"FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE `state`='wait'");
	}

	public function Notify($content_id, $content_type, $user_id, $text='') {
		GLOBAL $dbp;

		$model = new NotificationModel();
		$model->AddNotify($content_id, $content_type, $user_id, $text);
	}

	public function checkUnique($data) {
		$model = new $data['model']();
		return $model->checkUnique($data['value']);
	}
}
?>