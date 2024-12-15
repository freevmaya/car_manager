<?
class SimulatePassModel extends BaseModel {

	protected function getTable() {
		return 'simulate_pass';
	}

	public function getItem($options) {
		GLOBAL $dbp;

		if (is_array($options)) {
			$where = BaseModel::GetConditions($options, ['s.user_id']);
			$whereStr = implode(" AND ", $where);
		} else $whereStr = "o.user_id={$options}";

		$query = "SELECT s.*, u.*, o.id AS order_id FROM {$this->getTable()} s ".
					"INNER JOIN users u ON u.id = s.user_id ".
					"LEFT JOIN orders o ON s.user_id = o.user_id AND o.`state` IN (".ACTIVEORDERLIST.") ".
					"WHERE $whereStr";
		return $dbp->line($query);
	}

	public function getItems($options=null) {
		GLOBAL $dbp;

		$query = "SELECT s.*, u.*, o.id AS order_id FROM {$this->getTable()} s ".
					"INNER JOIN users u ON u.id = s.user_id ".
					"LEFT JOIN orders o ON s.user_id = o.user_id AND o.`state` IN (".ACTIVEORDERLIST.") ".
					"WHERE `waitUntil` <= NOW() OR `waitUntil` IS NULL";

		return $dbp->asArray($query);
	}

	protected function NotifyOrderToDrivers($drivers, $content_id, $content_type='changeOrder', $text="{'state':'wait'}") {
		foreach ($drivers as $driver)
			(new NotificationModel())->AddNotify($content_id, $content_type, $driver['user_id'], Lang($text));

		return true;
	}

	public function Start($user_id, $route) {
		GLOBAL $dbp;

		$start = json_decode($route['start'], true);

		$user = (new UserModel())->getItem($user_id);

		$drivers = (new DriverModel())->SuitableDrivers($start['lat'], $start['lng'], null, AREA_RADIUS);

		if (count($drivers) > 0) {

			if ($order_id = (new OrderModel())->AddOrder(['user_id'=>$user_id, 'route_id'=>$route['id'], 'seats'=>rand(1, 4)], AREA_RADIUS)) {

				$userModel = new UserModel();

				$user['lat'] = $start['lat'];
				$user['lng'] = $start['lng'];
				
				$userModel->Update($user);

				return $dbp->query("UPDATE {$this->getTable()} SET `waitUntil` = NULL WHERE user_id={$user_id}");
			}
		} else print_r("There aren't free drivers");

		return null;
	}

	public function AcceptOffer($user_id, $offer) {
		GLOBAL $dbp;

		$orderModel = new OrderModel();

		if ($order = $orderModel->getActiveOrder(['user_id'=>$user_id])) {
			$orderModel->SetState($order['id'], 'accepted', $offer['id']);
			/*
			(new NotificationModel())->AddNotify($order['id'], 'acceptedOffer', $offer['user_id'], Lang('The offer has been accepted'));
			*/
		}

		return null;
	}

	public function Stop($user_id) {
		GLOBAL $dbp;
		$minutes = rand(2, 6);
		return $dbp->query("UPDATE {$this->getTable()} SET waitUntil=NOW() + INTERVAL {$minutes} MINUTE WHERE user_id={$user_id}");
	}
}

?>