<?
class PlaceModel extends BaseModel {

	protected function getTable() {
		return 'places';
	}

	public function Update($data) {

	}

	public function InsertFromRoute($value) {
		GLOBAL $dbp, $user;

		if ($placeId = @$value['placeId']) {

			$lang = $user['language_code'];

			if (!$dbp->line("SELECT id FROM {$this->getTable()} WHERE id = '{$placeId}' AND lang='{$lang}'")) {
				$dbp->bquery("INSERT INTO {$this->getTable()} (`id`, `lang`, `aliase`, `description`) VALUES (?,?,?,?)",
						'ssss', [$placeId, $lang, $value['displayName'], $value['formattedAddress']]);
			}
		}
		return $placeId;
	}
}
?>