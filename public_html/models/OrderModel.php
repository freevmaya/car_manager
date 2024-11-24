<?
class OrderModel extends BaseModel {

	protected function getTable() {
		return 'orders';
	}

	public function getItem($options) {
		GLOBAL $dbp;
		if (is_array($options)) {
			$where = implode(" AND ", BaseModel::AddWhere([], $options, 'o.state'));
		} else $where = "o.id = {$options}";
		
		$query = "SELECT o.*, u.username, u.first_name, u.last_name, r.meters, r.start, r.finish, r.routes ".
			"FROM {$this->getTable()} o LEFT JOIN users u ON u.id = o.user_id ".
			"LEFT JOIN route r ON o.route_id=r.id ".
			"WHERE {$where}";
		return $where ? $dbp->line($query) : null;
	}

	public function haveActiveOrder($user_id) {
		return $this->getActiveOrder($user_id) != null;
	}

	public function getActiveOrder($options) {
		GLOBAL $dbp;
		$where = ["`state` IN ('wait', 'accepted')"];

		if (is_array($options)) {
			$where = BaseModel::AddWhere(
					BaseModel::AddWhere($where, $options, 'driver_id'), 
				$options, 'user_id');
		} else $where[] = "user_id={$options}";
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT * FROM {$this->getTable()} WHERE {$whereStr}";
		return $dbp->line($query);
	}

	public function getItems($options) {
		GLOBAL $dbp;

		$where = BaseModel::AddWhere(
					BaseModel::AddWhere([], $options, 'state'), 
				$options, 'o.user_id');
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT o.*, o.id AS order_id, u.username, u.first_name, u.last_name, r.start AS start, r.finish AS finish, r.travelMode, r.meters ".(isset($options['routes'])?', r.routes':'').", driver.id AS driverId, driver.username AS driverName, c.number, c.comfort, c.seating, cb.symbol AS car_body, cc.rgb AS car_color, cc.name AS car_colorName ".
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

	public function SetState($id, $state, $driver_id = false) {
		GLOBAL $dbp;

		$result = false;
		if ($driver_id)
			$result = $dbp->bquery("UPDATE {$this->getTable()} SET `state`=?, `driver_id`=? WHERE id=?", 
				'sii', [$state, $driver_id, $id]);
		else $result = $dbp->bquery("UPDATE {$this->getTable()} SET `state`=? WHERE id=?", 'si', [$state, $id]);
		
		return $result;
	}
}
?>