<?
class CarModel extends BaseModel {

	protected function getTable() {
		return 'car';
	}

	public function getItem($id) {
		GLOBAL $dbp;
		return $id ? $dbp->line("SELECT * FROM {$this->getTable()} WHERE id={$id}") : null;
	}

	public function getItems($options) {
		GLOBAL $dbp;
		return $dbp->asArray("SELECT * FROM {$this->getTable()} WHERE user_id={$options['user_id']}");
	}

	public function Update($values) {
		GLOBAL $dbp;

		if (!$values['id']) {
			$dbp->bquery("INSERT {$this->getTable()} (`user_id`, `number`, `car_body_id`, `color_id`) VALUES (?, ?, ?, ?)", 
				'isii', 
				[$values['user_id'], $values['number'], $values['car_body_id'], $values['color_id']]);
		} else {

		}
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
				'validator'=> 'unique'
			],
			'car_body_id' => [
				'model'=> 'CarbodyModel',
				'label'=> 'Carbody',
				'type'=> 'carbody',
				'default' => ['symbol'=> 'default'],
				'validator'=> 'required'
			],
			'color_id' => [
				'model'=> 'ColorModel',
				'label'=> 'Color',
				'type'=> 'color',
				'default' => ['name'=> 'default', 'rgb' => '#AAA'],
				'validator'=> 'required'
			]
		];
	}

	public function checkUnique($value) { 
		GLOBAL $dbp;
		return $dbp->one("SELECT `number` FROM {$this->getTable()} WHERE `number` = '{$value}'") === false; 
	}

	public function getTitle() {
		return lang(Page::$current->getId() ? 'Edit car' : 'Add car');
	}
}
?>