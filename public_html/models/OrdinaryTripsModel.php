<?
class OrdinaryTripsModel extends BaseModel {

	protected function getTable() {
		return 'ordinary_trips';
	}

	public function Update($data) {

	}

	public function getItems($options=null) {
		GLOBAL $dbp, $user;

		$query = "SELECT sp.id, sp.id AS startPlaceId, fp.id AS finishPlaceId, sp.aliase AS startPlace, fp.aliase AS finishPlace FROM {$this->getTable()} t LEFT JOIN places sp ON t.startPlaceId = sp.id AND sp.lang='{$user['language_code']}' LEFT JOIN places fp ON t.finishPlaceId = fp.id AND fp.lang='{$user['language_code']}' ORDER BY t.`sort`";

		if (isset($options['limit']))
			$query .= " LIMIT 0, {$options['limit']}";

		$items = $dbp->asArray($query);
		for ($i=0; $i<count($items); $i++) {
			$im = $items[$i];

			if ($im['startPlaceId'])
				$items[$i]['start'] = json_encode(['placeId'=>$im['startPlaceId'], 'displayName'=>$im['startPlace']]);

			if ($im['finishPlaceId'])
				$items[$i]['finish'] = json_encode(['placeId'=>$im['finishPlaceId'], 'displayName'=>$im['finishPlace']]);
		}
		return $items;
	}
}
?>