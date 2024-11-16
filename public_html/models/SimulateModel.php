<?
class SimulateModel extends BaseModel {

	protected function getTable() {
		return 'simulate';
	}

	public function getItems($options=null) {
		GLOBAL $dbp;

		$query = "SELECT s.*, u.*, d.* FROM {$this->getTable()} s ".
					"INNER JOIN users u ON u.id = s.user_id ".
					"INNER JOIN driverOnTheLine d ON s.user_id = d.user_id ".
					"WHERE u.id AND d.active";

		return $dbp->asArray($query);
	}
}

?>