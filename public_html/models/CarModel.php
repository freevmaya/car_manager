<?
class CarModel extends BaseModel {

	protected function getTable() {
		return 'car';
	}

	public function getItems($options) {
		GLOBAL $dbp;
		$where = BaseModel::GetConditions($options, ['user_id', 'id']);
		return $dbp->asArray("SELECT * FROM {$this->getTable()} WHERE ".implode(" AND ", $where));
	}

	public function getFields() {
		return [
			'id' => [
				'type' => 'hidden'
			],
			'user_id' => [
				'type' => 'hidden',
				'dbtype' => 'i',
				'default' => Page::$current->getUser()['id']
			],
			'number' => [
				'label'=> 'Number',
				'dbtype' => 's',
				'validator'=> 'unique'
			],
			'car_body_id' => [
				'model'=> 'CarbodyModel',
				'dbtype' => 'i',
				'label'=> 'Carbody',
				'type'=> 'carbody',
				'default' => ['symbol'=> 'default'],
				'validator'=> 'required'
			],
			'color_id' => [
				'model'=> 'ColorModel',
				'dbtype' => 'i',
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

    public static function getCarIndent($item) {
    	if ($item)
        	return "{$item['number']}/{$item['comfort']}/{$item['seating']} seats";
        return '';
    }
}
?>