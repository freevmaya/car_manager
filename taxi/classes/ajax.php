<?
class Ajax extends Page {

	public function Render($page) {
		header("Content-Type: text/json; charset=".CHARSET);
		echo json_encode($this->ajax());
	}

	public function ajax() {

		if (isset(Page::$request['action'])) {
			$action = Page::$request['action'];
			if (method_exists($this, $action)) {
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

	protected function AddOrder($data) {
		GLOBAL $dbp;

		$start = json_encode($data['start']);
		$finish = json_encode($data['finish']);

		$startAddress = $data['startAddress'];
		$finishAddress = $data['finishAddress'];

		$pickUpTime = date('Y-m-d H:i:s', strtotime($data['pickUpTime']));

		$dbp->query("INSERT INTO orders (`user_id`, `time`, `pickUpTime`, `startPlace`, `finishPlace`, `startAddress`, `finishAddress`, `meters`) ".
				"VALUES ({$data['user_id']}, NOW(), '{$pickUpTime}', '{$start}', '{$finish}', '{$startAddress}', '{$finishAddress}', '{$data['meters']}')");
		$order_id = $dbp->lastID();

		$this->Notify($order_id, 'orderReceive', $this->user['id'], Lang("OrderToProcess"));
		$this->NotifyOrderToDrivers($order_id);

		return ["id"=>$order_id];
	}

	protected function NotifyOrderToDrivers($order_id) {
		GLOBAL $dbp;
		$drivers = $dbp->asArray("SELECT * FROM driverOnTheLine WHERE `active` = 1 AND activationTime > DATE_SUB(NOW(),INTERVAL 1 DAY)");
		foreach ($drivers as $driver)
			$this->Notify($order_id, 'orderCreated', $driver['user_id']);
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
		$query = "INSERT INTO notifications (`content_id`, `content_type`, `user_id`, `text`) VALUES ". 
				"({$content_id}, '{$content_type}', {$user_id}, '{$text}')";
		$dbp->query($query);
	}

	public function checkUnique($data) {
		$model = new $data['model']();
		return $model->checkUnique($data['value']);
	}
}
?>