<?
class RouteModel extends BaseModel {

	protected function getTable() {
		return 'route';
	}

	public function getItem($id) {
		GLOBAL $dbp, $user;

		$query = "SELECT r.*, r.id AS route_id, sp.id AS startPlaceId, fp.id AS finishPlaceId, sp.aliase as startPlace, fp.aliase as finishPlace FROM {$this->getTable()} r ".
			"LEFT JOIN places sp ON r.startPlaceId = sp.id AND sp.lang='{$user['language_code']}' ".
			"LEFT JOIN places fp ON r.finishPlaceId = fp.id AND fp.lang='{$user['language_code']}' ".
			"WHERE r.id = {$id}";
		
		$item = $dbp->line($query);

		if ($item) {
			if (!$item['startPlace'])
				$item['startPlace'] = latLngToString(json_decode($item['start'], true));

			if (!$item['finishPlace'])
				$item['finishPlace'] = latLngToString(json_decode($item['finish'], true));
		}
		return $item;
	}

	public function Update($value) {
		GLOBAL $dbp;

		$route_id = null;

		$start = $value['start'];
		$finish = $value['finish'];

		$value['user_id'] = Page::$current->getUser()['id'];

		if (is_string($start))
			$start = json_decode($start, true);

		if (is_string($finish))
			$finish = json_decode($finish, true);

		if ($start && $finish) {

			$place = new PlaceModel();

			$value['startPlaceId'] = $place->InsertFromRoute($start);
			$value['finishPlaceId'] = $place->InsertFromRoute($finish);

			if ($value['startPlaceId'] && $value['finishPlaceId']) {
				$route_id = $dbp->one("SELECT id FROM {$this->getTable()} WHERE startPlaceId = '{$value['startPlaceId']}' AND finishPlaceId = '{$value['finishPlaceId']}'");
			}
		}

		if (!$route_id) {

			unset($start['displayName']);
			unset($start['formattedAddress']);

			unset($finish['displayName']);
			unset($finish['formattedAddress']);

			$dbp->bquery("INSERT INTO {$this->getTable()} (`user_id`, `start`, `finish`, `startPlaceId`, `finishPlaceId`, `travelMode`, `meters`, `routes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			'isssssds', 
			BaseModel::getValues($value, ['user_id', 'start', 'finish', 'startPlaceId', 'finishPlaceId', 'travelMode', 'meters', 'routes'], [0, '{}', '{}', null, null, null, 0, null]));
			return $dbp->lastID();
		}

		return $route_id;
	}
}
?>