<?
class DriverModel extends BaseModel {
	
	protected function getTable() {
		return 'driverOnTheLine';
	}

	public function Update($values) {
		GLOBAL $dbp;

		if (isset($values['car_id']) && $values['car_id']) {

			$active = isset($values['active']) ? 1 : 0;

			if ($dbp->line("SELECT `id` FROM {$this->getTable()} WHERE `user_id` = {$values['user_id']}")) {
				$dbp->bquery("UPDATE {$this->getTable()} SET `car_id` = ?, `active` = ?".($active ? ', `activationTime` = NOW()':'')." WHERE `user_id`= ?", 
					'iii', 
					[$values['car_id'], $active, $values['user_id']]);
			} else {
				$dbp->bquery("INSERT {$this->getTable()} (`user_id`, `car_id`, `active`, `activationTime`) VALUES (?, ?, ?, NOW())", 
					'iii', 
					[$values['user_id'], $values['car_id'], $active]);
			}
		}
	}

	public function getItem($user_id) {
		GLOBAL $dbp;

		if ($user_id) {
			$query = "SELECT CONCAT(u.username, ' ', u.phone) as driver, d.car_id, d.active, d.id FROM users u ".
					"LEFT JOIN {$this->getTable()} d ON d.user_id = u.id ".
					"WHERE u.id = {$user_id}";

			return $dbp->line($query);
		}

		return null;
	}

	public function getFields() {
		return [
			'user_id' => [
				'type'=> 'hidden',
				'default' => Page::$current->getUser()['id']
			],
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
			],
			'active' => [
				'label' => 'Active',
				'type' => 'bool'
			]
		];
	}
}
?>