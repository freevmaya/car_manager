<?
class OrderModel extends BaseModel {

	protected function getTable() {
		return 'orders';
	}

	public function getItem($id) {
		GLOBAL $dbp;
		return $id ? $dbp->line("SELECT * FROM {$this->getTable()} WHERE id={$id}") : null;
	}

	public function haveActiveOrder($user_id) {
		GLOBAL $dbp;
		return $dbp->line("SELECT id FROM {$this->getTable()} WHERE user_id={$user_id} AND `state` IN ('wait', 'accepted')");
	}

	public function getItems($options) {
		GLOBAL $dbp;

		$where = BaseModel::AddWhere(
					BaseModel::AddWhere([], $options, 'state'), 
				$options, 'user_id');
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT o.*, u.id AS user_id, u.username, u.first_name, u.last_name FROM {$this->getTable()} o LEFT JOIN `users` u ON u.id = o.user_id WHERE $whereStr";
		//trace($query);
		return $dbp->asArray($query);
	}

	public function AddOrder($data) {
		GLOBAL $dbp;

		$start = json_encode($data['start']);
		$finish = json_encode($data['finish']);

		$startAddress = $data['startAddress'];
		$finishAddress = $data['finishAddress'];

		$pickUpTime = date('Y-m-d H:i:s', strtotime($data['pickUpTime']));

		$dbp->bquery("INSERT INTO orders (`user_id`, `time`, `pickUpTime`, `startPlace`, `finishPlace`, `startName`, `finishName`, `startAddress`, `finishAddress`, `meters`) VALUES (?,NOW(),?,?,?,?,?,?,?,?)", 
			'isssssssi', [$data['user_id'], $pickUpTime, $start, $finish, $data['startName'], $data['finishName'], $startAddress, $finishAddress, $data['meters']]);
		return $dbp->lastID();
	}

	public function CancelOrder($id) {
		GLOBAL $dbp;

		$query = "UPDATE `orders` SET state = 'cancel' WHERE `id` = ?";
		return $dbp->bquery($query, 'i', [$id]);
	}
}
?>