<?
class CarbodyModel extends BaseModel {

	public function getItems($options) {
		GLOBAL $dbp;
		return $dbp->asArray("SELECT * FROM car_bodys");
	}
}
?>