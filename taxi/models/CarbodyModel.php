<?
class CarbodyModel extends BaseModel {
	protected function getTable() {
		return 'car_bodys';
	}

	public function getItems($options) {
		GLOBAL $dbp;
		return $dbp->asArray("SELECT * FROM {$this->getTable()}");
	}
}
?>