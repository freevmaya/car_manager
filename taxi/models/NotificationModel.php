<?
class NotificationModel extends BaseModel {

	protected function getTable() {
		return 'notifications';
	}

	public function getItems($options) {
		GLOBAL $dbp;

		$where = BaseModel::AddWhere(
					BaseModel::AddWhere(
						BaseModel::AddWhere([], $options, 'content_type')
					, $options, 'state'), 
				$options, 'user_id');
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT * FROM {$this->getTable()} WHERE $whereStr";
		return $dbp->asArray($query);
	}

	public function getOffers($user_id, $notify_id=false) {
		GLOBAL $dbp;
		$whereStr = "n.`content_type` = 'offerToPerform' AND n.`state` IN ('active', 'receive', 'read') AND d.active = 1";
		if ($notify_id)
			$whereStr .= ' AND n.id = '.$notify_id;
		else $whereStr .= " AND n.`user_id`={$user_id}";

		$query = "SELECT n.*, d.*, u.first_name, u.last_name, u.username, c.*, cb.symbol, cc.* FROM {$this->getTable()} n INNER JOIN `driverOnTheLine` d ON n.offered_driver_id = d.id INNER JOIN `users` u ON d.user_id = u.id INNER JOIN `car` c ON c.id = d.car_id INNER JOIN `car_bodies` cb ON c.car_body_id=cb.id INNER JOIN `car_color` cc ON c.color_id=cc.id WHERE $whereStr";

		return $dbp->asArray($query);
	}

	public function getOffersByOrder($order_id) {
		GLOBAL $dbp;
		$whereStr = "n.`content_type` = 'offerToPerform' AND n.`state` IN ('active', 'receive', 'read') AND d.active = 1 AND n.content_id = {$order_id}";


		$query = "SELECT n.*, d.*, u.first_name, u.last_name, u.username, c.*, cb.symbol, cc.* FROM {$this->getTable()} n INNER JOIN `driverOnTheLine` d ON n.offered_driver_id = d.id INNER JOIN `users` u ON d.user_id = u.id INNER JOIN `car` c ON c.id = d.car_id INNER JOIN `car_bodies` cb ON c.car_body_id=cb.id INNER JOIN `car_color` cc ON c.color_id=cc.id WHERE $whereStr";

		return $dbp->asArray($query);
	}

	public function AddNotify($content_id, $content_type, $user_id, $text='', $offered_driver_id=null) {
		GLOBAL $dbp;
		$result = false;
		if ($offered_driver_id) {
			$query = "INSERT INTO notifications (`content_id`, `content_type`, `user_id`, `text`, `offered_driver_id`) VALUES (?, ?, ?, ?, ?)";
			$result = $dbp->bquery($query, 'isisi', [$content_id, $content_type, $user_id, $text, $offered_driver_id]);
		} else {
			$query = "INSERT INTO notifications (`content_id`, `content_type`, `user_id`, `text`) VALUES (?, ?, ?, ?)";
			$result = $dbp->bquery($query, 'isis', [$content_id, $content_type, $user_id, $text]);
		}
		return $result;
	}
}