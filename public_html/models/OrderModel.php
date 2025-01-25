<?

class OrderModel extends BaseModel {

	protected function getTable() {
		return 'orders';
	}

	public function getItem($id) {
		$items = $this->getItems(['limit' => 1, 'o.id' => $id]);
		if (count($items) > 0)
			return $items[0];
		return null;
	}

	public function haveActiveOrder($user_id) {
		return $this->getActiveOrder($user_id) != null;
	}

	public function getActiveOrder($options, $states=null) {
		GLOBAL $dbp;
		$where = ["`state` IN (".($states ? $states : ACTIVEORDERLIST).")"];

		if (is_array($options)) {
			$where = array_merge(BaseModel::GetConditions($options, ['driver_id', 'user_id', 'id']), $where);
		} else $where[] = "user_id={$options}";
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT * FROM {$this->getTable()} WHERE {$whereStr}";
		return $dbp->line($query);
	}

	public function getTakenSeats($driver_id) {
		GLOBAL $dbp;

		$query = "SELECT SUM(`seats`) FROM {$this->getTable()} WHERE `driver_id`={$driver_id} AND `state` IN (".ACTIVEORDERLIST.")";
		return $dbp->one($query);
	}

	public function getItems($options) {
		GLOBAL $dbp;

		$options = array_merge(['order'=>'`id` DESC'], $options);

		$where = BaseModel::GetConditions($options, ['state', 'o.user_id', 'driver_id', 'o.id']);
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT o.*, o.id AS order_id, u.username, u.first_name, u.last_name, r.start AS start, r.finish AS finish, r.travelMode, r.meters, ROUND(r.meters / 1000, 1) AS distance ".(isset($options['routes'])?', r.routes':'').", driver.id AS driverId, driver.username AS driverName, c.number, c.comfort, c.seating, cb.symbol AS car_body, cc.rgb AS car_color, cc.name AS car_colorName ".
		
			"FROM {$this->getTable()} o INNER JOIN `users` u ON u.id = o.user_id INNER JOIN `route` r ON o.route_id = r.id ".
			"LEFT JOIN driverOnTheLine ON driverOnTheLine.id=o.driver_id ".
			"LEFT JOIN users driver ON driver.id=driverOnTheLine.user_id ".
			"LEFT JOIN car c ON c.id=driverOnTheLine.car_id ".
			"LEFT JOIN car_bodies cb ON cb.id=c.car_body_id ".
			"LEFT JOIN car_color cc ON cc.id=c.color_id ".

			"WHERE $whereStr";

		if (isset($options['group']))
			$query .= " GROUP BY {$options['group']}";
			
		$query .= " ORDER BY {$options['order']}";

		if (isset($options['limit']))
			$query .= " LIMIT 0, {$options['limit']}";

		return $dbp->asArray($query);
	}

	public function getItemsWithChanges($options) {
		GLOBAL $dbp, $user;

		$result = $this->getItems($options);
		$nModel = new NotificationModel();

		for ($i=0; $i<count($result); $i++)
			$result[$i]['changeList'] = $nModel->getItems(['user_id'=>$user['id'], 'content_id'=>$result[$i]['id'], 'content_type'=>'changeOrder'], '`text`, `time`');

		return $result;
	}

	public function AddOrder($data, $distanceToListeners = 0) {
		GLOBAL $dbp;

		$pickUpTime = date('Y-m-d H:i:s', strtotime(isset($data['pickUpTime'])?$data['pickUpTime']:'NOW'));

		$seats = isset($data['seats']) ? $data['seats'] : 1;

		$dbp->bquery("INSERT INTO orders (`user_id`, `time`, `pickUpTime`, `seats`, `route_id`) VALUES (?,NOW(),?,?,?)", 
			'isii', [$data['user_id'], $pickUpTime, $seats, $data['route_id']]);
		
		if ($order_id = $dbp->lastID()) {

			$users = [$data['user_id']];

			if ($distanceToListeners > 0) {

				$route = (new RouteModel())->getItem($data['route_id']);
				$latLng = json_decode($route['start'], true);

				$drivers = (new DriverModel())->SuitableDrivers($latLng['lat'], $latLng['lng'], null, $distanceToListeners);// , $seats); // разкоментировать если требуется учитывать количество свободных мест в машине

				if (count($drivers) > 0)
					$users = array_merge($users, BaseModel::getListValues($drivers, 'user_id'));
			}

			(new OrderListeners())->AddListener($order_id, $users);
			(new OrderListeners())->SendNotify($order_id, 'changeOrder', json_encode(['state'=>'wait']));
		}

		return $order_id;
	}

	public function SetRemaindDistance($order_id, $remaindDistance) {
		GLOBAL $dbp;
		return $dbp->bquery("UPDATE {$this->getTable()} SET remaindDistance=? WHERE id=?", 'di', [$remaindDistance, $order_id]);
	}

	public function GetRemaindDistance($order_id) {
		GLOBAL $dbp;
		if (($order_id = intval($order_id)) > 0) {
			$query = "SELECT orders.remaindDistance FROM {$this->getTable()} WHERE id={$order_id}";
			return $dbp->one($query);
		}
		return $order_id;
	}

	public function SetState($id, $state, $driver_id = false, $setter_user_id=null) {
		GLOBAL $dbp, $user;

		$result = false;
		$data = ['state'=>$state];

		if ($setter_user_id)
			(new OrderListeners())->AddListener($id, $setter_user_id); // Слушает тот, кто и устанавливает статус

		$query = "UPDATE {$this->getTable()} SET `state`=?";

		$driver_id = Page::$current->asDriver();
		if ($driver_id) {
			$data['driver_id'] = $driver_id;
			$query .= ", `driver_id`={$driver_id}";
		}

		if ($state == 'wait_meeting') {
			$data['beganWaitTime'] = date('Y-m-d H:i:s');
			$query .= ", `beganWaitTime`='{$data['beganWaitTime']}'";
		}
		else if ($state == 'execution') {
			$data['beganExecuteTime'] = date('Y-m-d H:i:s');
			$query .= ", `beganExecuteTime`='{$data['beganExecuteTime']}'";
		}
		
		$query .= " WHERE id=?";

		$result = $dbp->bquery($query, 'si', [$state, $id]);
		
		$orderListeners = new OrderListeners();
		$orderListeners->SendNotify($id, 'changeOrder', json_encode($data));

		if (in_array($state, INACTIVEORDERLIST_ARR))
			$orderListeners->RemoveListeners($id);
		
		return $result ? $data : false;
	}
}
?>