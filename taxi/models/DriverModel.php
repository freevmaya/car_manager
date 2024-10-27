<?
class DriverModel extends BaseModel {
	
	protected function getTable() {
		return 'driverOnTheLine';
	}

	public function Update($values) {
		GLOBAL $dbp;

		if (!$values['car_id']) {
			$dbp->bquery("UPDATE {$this->getTable()} (`user_id`, `number`, `car_body_id`, `color_id`) VALUES (?, ?, ?, ?)", 
				'isii', 
				[$values['user_id'], $values['number'], $values['car_body_id'], 2]);
		}
	}

	public function getItem($user_id) {
		GLOBAL $dbp;

		if ($user_id) {
			$query = "SELECT CONCAT(u.username, ' ', u.phone) as driver, d.car_id FROM users u ".
					"LEFT JOIN {$this->getTable()} d ON d.user_id = u.id ".
					"WHERE u.id = {$user_id}";

			return $dbp->line($query);
		}

		return null;
	}

	public function getFields() {
		return [
			'driver' => [
				'label'=> 'Driver',
				'readonly' => true
			],
			'car_id' => [
				'type' => 'Car',
				'label' => 'Car',
				'user_id'=> Page::$current->getUser()['id'],
				'model' => 'CarModel',
				'required' => true
			]
		];
	}
}
?>