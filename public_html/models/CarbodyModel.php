<?
class CarbodyModel extends BaseModel {
	protected function getTable() {
		return 'car_bodies';
	}

	public function getFields() {
		return [
			'id' => [
				'type' => 'hidden',
				'dbtype' => 'i'
			],
			'symbol' => [
				'dbtype' => 's'
			]
		];
	}
}
?>