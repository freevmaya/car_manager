<?
class CarModel extends BaseModel {

	public function getItem($id) {
		GLOBAL $dbp;
		return $id ? $dbp->line("SELECT * FROM car WHERE id={$id}") : null;
	}

	public function getFields() {
		return [
			'id' => [
				'type' => 'hidden'
			],
			'user_id' => [
				'type' => 'hidden',
				'default' => Page::$current->getUser()['id']
			],
			'number' => [
				'label'=> 'Number',
				'validator'=> 'required'
			],
			'car_body' => [
				'label'=> 'Carbody',
				'type'=> 'carbody',
				'model'=> 'CarbodyModel',
				'indexField'=>'car_body_id'
			],
			'color' => [
				'label'=> 'Color',
				'type'=> 'color',
				'model'=> 'ColorModel',
				'indexField'=>'color_id'
			]
		];
	}

	public function getTitle() {
		return lang(Page::$current->getId() ? 'Edit car' : 'Add car');
	}
}
?>