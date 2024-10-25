<?
class CarModel extends BaseModel {

	public function getItem($id) {
		GLOBAL $dbp;
		return $id ? $dbp->line("SELECT * FROM car WHERE id={$id}") : null;
	}

	public function getFields() {
		return [
			'driver' => [
				'label'=> 'Driver',
				'readonly' => true
			],
			'car' => [
				'type' => 'Car',
				'label' => 'Car',
				'indexField' => 'car_id',
				'required' => true
			]
		];
	}
}
?>