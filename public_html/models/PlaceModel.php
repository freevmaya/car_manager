<?
class PlaceModel extends BaseModel {

	protected function getTable() {
		return 'places';
	}

	public function Update($data) {

	}

	public function InsertFromRoute($value, $pref) {
		GLOBAL $dbp;

		if ($placeId = $value[$pref]['placeId']) {

			if (!$dbp->line("SELECT id FROM {$this->getTable()} WHERE id = '{$placeId}'")) {
				$dbp->bquery("INSERT INTO {$this->getTable()} (`id`, `aliase`, `description`) VALUES (?,?,?)",
						'sss', [$placeId, $value[$pref.'Name'], $value[$pref.'Address']]);
			}
		}
		return $placeId;
	}
}
?>