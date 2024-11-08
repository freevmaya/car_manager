<?
class PlaceModel extends BaseModel {

	protected function getTable() {
		return 'places';
	}

	public function Update($data) {

	}

	public function InsertFromRoute($value) {
		GLOBAL $dbp;

		if ($placeId = @$value['placeId']) {

			if (!$dbp->line("SELECT id FROM {$this->getTable()} WHERE id = '{$placeId}'")) {
				$dbp->bquery("INSERT INTO {$this->getTable()} (`id`, `aliase`, `description`) VALUES (?,?,?)",
						'sss', [$placeId, $value['name'], $value['address']]);
			}
		}
		return $placeId;
	}
}
?>