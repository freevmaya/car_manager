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

		$place = new PlaceModel();
		$value['startPlaceId'] = $place->InsertFromRoute($value['path'], 'start');
		$value['finishPlaceId'] = $place->InsertFromRoute($value['path'], 'finish');

		$route_id = null;

		if ($value['startPlaceId'] && $value['finishPlaceId']) {
			$route_id = $dbp->one("SELECT id FROM {$this->getTable()} WHERE startPlaceId = '{$value['startPlaceId']}' AND finishPlaceId = '{$value['finishPlaceId']}'");
		}

		if (!$route_id) {
			$value['meters'] = $value['path']['meters'];

			$dbp->bquery("INSERT INTO {$this->getTable()} (`user_id`, `path`, `startPlaceId`, `finishPlaceId`, `meters`, `state`) VALUES (?, ?, ?, ?, ?, ?)",
			'isssds', 
			BaseModel::getValues($value, ['user_id', 'path', 'startPlaceId', 'finishPlaceId', 'meters', 'state'], [0, '{}', null, null, 0, 'active']));
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