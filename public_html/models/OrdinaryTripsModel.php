<?
class OrdinaryTripsModel extends BaseModel {

	protected function getTable() {
		return 'ordinary_trips';
	}

	public function Update($data) {

	}

	public function getItems($options=null) {
		GLOBAL $dbp;

		return $dbp->asArray("SELECT sp.id, sp.id AS startPlaceId, fp.id AS finishPlaceId, sp.aliase AS startPlace, fp.aliase AS finishPlace FROM {$this->getTable()} t LEFT JOIN places sp ON t.startPlaceId = sp.id LEFT JOIN places fp ON t.finishPlaceId = fp.id ORDER BY t.`sort`");
	}
}
?>