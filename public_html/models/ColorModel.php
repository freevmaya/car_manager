<?
class ColorModel extends BaseModel {
	
	protected function getTable() {
		return 'car_color';
	}

	public function getItems($options) {
		GLOBAL $dbp;
		return $dbp->asArray("SELECT * FROM {$this->getTable()}");
	}
}
?>