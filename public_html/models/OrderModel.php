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

	public function getItems($options) {
		GLOBAL $dbp;

		$where = BaseModel::GetConditions($options, ['state', 'o.user_id', 'driver_id', 'o.id']);
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT o.*, o.id AS order_id, u.username, u.first_name, u.last_name, r.start AS start, r.finish AS finish, r.travelMode, r.meters, ROUND(r.meters / 1000, 1) AS distance ".(isset($options['routes'])?', r.routes':'').", driver.id AS driverId, driver.username AS driverName, c.number, c.comfort, c.seating, cb.symbol AS car_body, cc.rgb AS car_color, cc.name AS car_colorName ".
			"FROM {$this->getTable()} o INNER JOIN `users` u ON u.id = o.user_id INNER JOIN `route` r ON o.route_id = r.id ".
			"LEFT JOIN driverOnTheLine ON driverOnTheLine.id=o.driver_id ".
			"LEFT JOIN users driver ON driver.id=driverOnTheLine.user_id ".
			"LEFT JOIN car c ON c.id=driverOnTheLine.car_id ".
			"LEFT JOIN car_bodies cb ON cb.id=c.car_body_id ".
			"LEFT JOIN car_color cc ON cc.id=c.color_id ".
			"WHERE $whereStr ORDER BY `id` DESC";

		if (isset($options['limit']))
			$query .= " LIMIT 0, {$options['limit']}";
		return $dbp->asArray($query);
	}

	public function AddOrder($data) {
		GLOBAL $dbp;

		$pickUpTime = date('Y-m-d H:i:s', strtotime(isset($data['pickUpTime'])?$data['pickUpTime']:'NOW'));

		$dbp->bquery("INSERT INTO orders (`user_id`, `time`, `pickUpTime`, `route_id`) VALUES (?,NOW(),?,?)", 
			'iss', [$data['user_id'], $pickUpTime, $data['route_id']]);
		return $dbp->lastID();
	}

	public function SetRemaindDistance($order_id, $remaindDistance) {
		GLOBAL $dbp;
		return $dbp->bquery("UPDATE orders SET remaindDistance=? WHERE id=?", 'di', [$remaindDistance, $order_id]);
	}

	public function SetState($id, $state, $driver_id = false) {
		GLOBAL $dbp;

		$result = false;
		if ($driver_id)
			$result = $dbp->bquery("UPDATE {$this->getTable()} SET `state`=?, `driver_id`=? WHERE id=?", 
				'sii', [$state, $driver_id, $id]);
		else $result = $dbp->bquery("UPDATE {$this->getTable()} SET `state`=? WHERE id=?", 'si', [$state, $id]);

		(new OrderListeners())->SendNotify($id, 'changeOrder', json_encode(['state'=>$state]));
		
		return $result;
	}
}
?>