<?
class LogGeoPosModel extends BaseModel {

	protected function getTable() {
		return 'log_geoPos';
	}

	public function Update($values) {
		GLOBAL $dbp, $user;
		
		return $dbp->bquery("INSERT INTO {$this->getTable()} (`user_id`, `latitude`, `longitude`, `accuracy`, `altitude`, `altitudeAccuracy`, `heading`, `speed`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 'iddddddd', [$user['id'], $values['latitude'], $values['longitude'], $values['accuracy'], $values['altitude'], $values['altitudeAccuracy'], $values['heading'], $values['speed']]);		
	}

	public function getItems($options) {
		GLOBAL $dbp;
		$where = BaseModel::GetConditions($options, ['user_id']);

		if (isset($options['dateTime'])) {
			$where[] = "`time` >= '".date('Y-m-d H:k:s', strtotime($options['dateTime']))."'";
		}

		$query = "SELECT * FROM {$this->getTable()} WHERE ".implode(" AND ", $where);
		return $dbp->asArray($query);
	}
}
?>