<?
class RouteModel extends BaseModel {

	protected function getTable() {
		return 'route';
	}

	public function getItem($id) {
		GLOBAL $dbp;
		$item = $dbp->line("SELECT r.*, sp.id AS startPlaceId, fp.id AS finishPlaceId, sp.aliase as startPlaceAliase, fp.aliase as finishPlaceAliase FROM {$this->getTable()} r LEFT JOIN places sp ON r.startPlaceId = sp.id  LEFT JOIN places fp ON r.finishPlaceId = fp.id  WHERE r.id = {$id}");

		if ($item) {
			if (!$item['startPlaceAliase']) {
				$path = json_decode($item['path'], true);
				$item['startPlaceAliase'] = latLngToString($path['start']);
			}
			if (!$item['finishPlaceAliase']) {
				$path = json_decode($item['path'], true);
				$item['finishPlaceAliase'] = latLngToString($path['finish']);
			}
		}
		return $item;
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

			$dbp->bquery("INSERT INTO {$this->getTable()} (`user_id`, `path`, `startPlaceId`, `finishPlaceId`, `meters`) VALUES (?, ?, ?, ?, ?)",
			'isssd', 
			BaseModel::getValues($value, ['user_id', 'path', 'startPlaceId', 'finishPlaceId', 'meters', 'state'], [0, '{}', null, null, 0]));
			return $dbp->lastID();
		}
	}
}
?>