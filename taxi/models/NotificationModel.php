<?
class NotificationModel extends BaseModel {

	protected function getTable() {
		return 'notifications';
	}

	public function getItems($options) {
		GLOBAL $dbp;

		$where = implode(" AND ", BaseModel::AddWhere(["user_id={$options['user_id']}"], $options, 'state'));
		$query = "SELECT * FROM {$this->getTable()} WHERE $where";
		return $dbp->asArray($query);
	}

	public function AddNotify($content_id, $content_type, $user_id, $text='') {
		GLOBAL $dbp;
		$query = "INSERT INTO notifications (`content_id`, `content_type`, `user_id`, `text`) VALUES (?, ?, ?, ?)";
		$dbp->bquery($query, 'isis', [$content_id, $content_type, $user_id, $text]);
	}
}