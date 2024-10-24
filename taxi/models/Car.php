<?
class Car {
	protected $car_id;
	public function __construct($car_id) {
		$this->car_id = $car_id;
	}

	public function getItem() {
		GLOBAL $dbp;
		return $this->car_id ? $dbp->line("SELECT * FROM car WHERE id={$this->car_id}") : null;
	}
}
?>