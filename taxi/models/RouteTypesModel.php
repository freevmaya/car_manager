<?
class RouteTypesModel extends BaseModel {

	protected function getTable() {
		return 'route_types';
	}

	public function getItems($options) {
		GLOBAL $dbp;

		return $dbp->asArray("SELECT * FROM {$this->getTable()} WHERE user_id = {$options['user_id']}");
	}
}
?>