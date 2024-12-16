<?
class OrderListeners extends BaseModel {

	protected function getTable() {
		return 'order_listeners';
	}

	public function AddListener($order_id, $user_or_users_id) {
		GLOBAL $dbp;

		trace($user_or_users_id);

		$query = "REPLACE INTO {$this->getTable()} (`order_id`, `user_id`) VALUES ";

		if (is_array($user_or_users_id)) {

			$items = [];
			foreach ($user_or_users_id as $id)
				$items[] = "($order_id, $id)";

			$query .= implode(',', $items);

		} else $query .= "($order_id, $user_or_users_id)";

		return $dbp->query($query);
	}

	public function SendNotify($order_id, $content_type, $text) {

		$items = $this->getItems(['order_id'=>$order_id]);
		$notifyModel = new NotificationModel();
		foreach ($items as $item)
			$notifyModel->AddNotify($order_id, $content_type, $item['user_id'], Lang($text));
	}

	public function RemoveListeners($order_id) {
		GLOBAL $dbp;
		return $dbp->query("DELETE FROM {$this->getTable()} WHERE `order_id`={$order_id}");
	}

	public function getItems($options) {

		GLOBAL $dbp;
		$where 		= BaseModel::GetConditions($options, ['order_id', 'user_id']);
		$whereStr 	= implode(" AND ", $where);

		return $dbp->asArray("SELECT * FROM {$this->getTable()} WHERE {$whereStr}");
	}
}
?>