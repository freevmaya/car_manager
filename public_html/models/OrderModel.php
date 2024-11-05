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

		$pickUpTime = date('Y-m-d H:i:s', strtotime(isset($data['pickUpTime'])?$data['pickUpTime']:'NOW'));

		$dbp->bquery("INSERT INTO orders (`user_id`, `time`, `pickUpTime`, `route_id`) VALUES (?,NOW(),?,?)", 
			'iss', [$data['user_id'], $pickUpTime, $data['route_id']]);
		return $dbp->lastID();
	}

	public function CancelOrder($id) {
		GLOBAL $dbp;

		$query = "UPDATE `orders` SET state = 'cancel' WHERE `id` = ?";
		return $dbp->bquery($query, 'i', [$id]);
	}
}
?>