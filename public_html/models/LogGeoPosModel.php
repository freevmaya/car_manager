<?
class LogGeoPosModel extends BaseModel {

	protected function getTable() {
		return 'log_geoPos';
	}

	public function Update($values) {
		GLOBAL $dbp;
		$result = $dbp->query("INSERT INTO {$this->getTable()} (`user_id`, `date`, `time`, `lat`, `lng`) VALUES ({$values['user_id']}, NOW(), NOW(), {$values['lat']}, {$values['lng']})");		
	}

	public function getItems($options) {
		GLOBAL $dbp;
		$where = BaseModel::GetConditions($options, ['user_id']);
		return $dbp->asArray("SELECT * FROM {$this->getTable()} WHERE ".implode(" AND ", $where));
	}
}
?>