<?
class PrepareTripModel extends BaseModel {
	
	protected function getTable() {
		return 'driverOnTheLine';
	}

	public function getItem($user_id) {
		GLOBAL $dbp;

		if ($user_id) {
			$query = "SELECT CONCAT(u.username, ' ', u.phone) as driver, d.car_id FROM users u ".
					"LEFT JOIN {$this->getTable()} d ON d.user_id = u.id ".
					"WHERE u.id = {$user_id}";

			return $dbp->line($query);
		}

		return null;
	}

	public function getFields() {
		return [];
	}
}
?>