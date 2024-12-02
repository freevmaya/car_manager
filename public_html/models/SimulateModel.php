<?
class SimulateModel extends BaseModel {

	protected function getTable() {
		return 'simulate';
	}

	public function getItem($options) {
		GLOBAL $dbp;

		if (is_array($options)) {
			$where = BaseModel::GetConditions($options, ['d.id', 'd.user_id', 'route_id']);
			$whereStr = implode(" AND ", $where);
		} else $whereStr = "id={$options}";

		$query = "SELECT s.*, u.*, d.id AS driver_id, d.user_id, d.car_id, d.active, d.useTogether, d.activationTime, d.expiredTime FROM {$this->getTable()} s ".
					"INNER JOIN users u ON u.id = s.user_id ".
					"INNER JOIN driverOnTheLine d ON s.user_id = d.user_id ".
					"WHERE $whereStr";

		trace($query);
		return $dbp->line($query);
	}

	public function getItems($options=null) {
		GLOBAL $dbp;

		$query = "SELECT s.*, u.*, d.id AS driver_id, d.user_id, d.car_id, d.active, d.useTogether, d.activationTime, d.expiredTime FROM {$this->getTable()} s ".
					"INNER JOIN users u ON u.id = s.user_id ".
					"INNER JOIN driverOnTheLine d ON s.user_id = d.user_id ".
					"WHERE u.id AND d.active";

		return $dbp->asArray($query);
	}

	public function Start($user_id, $route_id) {
		GLOBAL $dbp;
		return $dbp->query("UPDATE {$this->getTable()} SET route_id={$route_id}, waitUntil=NULL WHERE user_id={$user_id}");
	}

	public function Stop($user_id) {
		GLOBAL $dbp;
		$minutes = rand(2, 6);
		return $dbp->query("UPDATE {$this->getTable()} SET route_id=NULL, waitUntil=NOW() + INTERVAL {$minutes} MINUTE WHERE user_id={$user_id}");
	}
}

?>