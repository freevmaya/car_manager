<?
class OrderModel extends BaseModel {

	protected function getTable() {
		return 'orders';
	}

	public function getItem($options) {
		GLOBAL $dbp;
		if (is_array($options)) {
			$where = implode(" AND ", BaseModel::AddWhere([], $options, 'state'));
		} else $where = "id = {$options}";
		
		$query = "SELECT * FROM {$this->getTable()} WHERE {$where}";
		return $where ? $dbp->line($query) : null;
	}

	public function haveActiveOrder($user_id) {
		GLOBAL $dbp;
		return $dbp->line("SELECT id FROM {$this->getTable()} WHERE user_id={$user_id} AND `state` IN ('wait', 'accepted')");
	}

	public function getItems($options) {
		GLOBAL $dbp;

		$where = BaseModel::AddWhere(
					BaseModel::AddWhere([], $options, 'state'), 
				$options, 'o.user_id');
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT o.*, o.id AS order_id, u.username, u.first_name, u.last_name, r.start AS start, r.finish AS finish, r.travelMode, r.meters FROM {$this->getTable()} o INNER JOIN `users` u ON u.id = o.user_id INNER JOIN `route` r ON o.route_id = r.id ".
			"LEFT JOIN driverOnTheLine d ON d.user_id=o.driver_id ".
			"LEFT JOIN users driver ON d.user_id=o.driver_id ".
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