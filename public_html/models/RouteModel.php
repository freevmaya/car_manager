<?
class RouteModel extends BaseModel {

	protected function getTable() {
		return 'route';
	}

	public function getItems($options) {
		GLOBAL $dbp;

		return $dbp->asArray("SELECT * FROM {$this->getTable()} WHERE routes IS NOT NULL");
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

	protected static function formPlace($place) {

		if ($place) {
			if (is_string($place))
				$place = json_decode($place, true);

			if (isset($place['latLng'])) {
				$place['lat'] = $place['latLng']['lat'];
				$place['lng'] = $place['latLng']['lng'];

				unset($place['latLng']);
			}
		}

		return $place;
	}

	public function Update($value) {
		GLOBAL $dbp;

		$route_id = null;

		$start = $value['start'] = RouteModel::formPlace($value['start']);
		$finish = $value['finish'] = RouteModel::formPlace($value['finish']);

		if (($start['lat'] != $finish['lat']) && ($start['lng'] != $finish['lng'])) {

			if (!isset($value['user_id']))
				$value['user_id'] = Page::$current->getUser()['id'];

			if ($start && $finish) {

				$place = new PlaceModel();

				$value['startPlaceId'] = $place->InsertFromRoute($start);
				$value['finishPlaceId'] = $place->InsertFromRoute($finish);

				if ($value['startPlaceId'] && $value['finishPlaceId']) {
					$route_id = $dbp->one("SELECT id FROM {$this->getTable()} WHERE startPlaceId = '{$value['startPlaceId']}' AND finishPlaceId = '{$value['finishPlaceId']}'");
				}
			}

			if (!$route_id) {

				if ($value['meters'] > 0) {

					unset($start['displayName']);
					unset($start['formattedAddress']);

					unset($finish['displayName']);
					unset($finish['formattedAddress']);

					$dbp->bquery("INSERT INTO {$this->getTable()} (`user_id`, `start`, `finish`, `startPlaceId`, `finishPlaceId`, `travelMode`, `meters`, `routes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
					'isssssds', 
					BaseModel::getValues($value, ['user_id', 'start', 'finish', 'startPlaceId', 'finishPlaceId', 'travelMode', 'meters', 'routes'], [0, '{}', '{}', null, null, TRAVELMODE, 0, null]));
					return $dbp->lastID();
				} else die ('Distance cannot be zero!');
				
			}
		} else throw new Exception("The starting point and the finishing point cannot be equal.", 1);
		

		return $route_id;
	}
}
?>