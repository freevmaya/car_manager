<?
class RouteModel extends BaseModel {

	protected function getTable() {
		return 'route';
	}

	public function getItem($id) {
		GLOBAL $dbp;
		return $dbp->line("SELECT * FROM {$this->getTable()} WHERE id = {$id}");
	}

	public function Update($value) {
		GLOBAL $dbp;
		if (isset($value['id']) && $dbp->line("SELECT * FROM {$this->getTable()} WHERE id = {$id}")) {

		} else {

			$dbp->bquery("INSERT INTO {$this->getTable()} (`user_id`, `driver_id`, `car_id`, `path`, `state`) VALUES (?, ?, ?, ?, ?)",
			'iiiss', 
			BaseModel::getValues($value, ['user_id', 'driver_id','car_id','path','state'], [0, 0, 0, '{}', 'active']));
			return $dbp->lastID();
		}
	}

	public function Stop($id) {
		GLOBAL $dbp;
		return $dbp->bquery("UPDATE {$this->getTable()} SET `state`='finished' WHERE id=?", 'i', [$id]);
	}

	public function getCurrentRoute() {
		GLOBAL $dbp;
		return $dbp->line("SELECT * FROM {$this->getTable()} WHERE `state` = 'active' AND user_id = ".Page::$current->getUser()['id']);
	}
}
?>