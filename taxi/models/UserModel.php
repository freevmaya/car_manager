<?
class UserModel extends BaseModel {
	
	protected function getTable() {
		return 'users';
	}

	public function getItem($user_id) {
		GLOBAL $dbp;

		if ($user_id) {
			$query = "SELECT d.*, u.*, u.id as id  FROM {$this->getTable()} u ".
					"LEFT JOIN driverOnTheLine d ON d.user_id = u.id ".
					"WHERE u.id = {$user_id}";

			return $dbp->line($query);
		}

		return null;
	}

	public function Update($values) {
		GLOBAL $dbp;

		if ($dbp->one("SELECT id FROM {$this->getTable()} WHERE `id` = {$values['id']}")) {
			$dbp->bquery("UPDATE {$this->getTable()} SET `first_name` = ?, `last_name` = ?, `username` = ?, `phone` = ? WHERE `id` = ?", 'ssssi', 
				[$values['first_name'], $values['last_name'], $values['username'], $values['phone'], $values['id']]);
		} 
	}

	public function checkUnique($value) { 
		GLOBAL $dbp;
		return $dbp->one("SELECT id FROM {$this->getTable()} WHERE `username` = '{$value}'") === false; 
	}

	public function getFields() {
		return [
			'id' => [
				'type' => 'hidden'
			],
			'first_name' => [
				'label'=> 'First name',
				'validator'=> 'required'
			],
			'last_name' => [
				'label'=> 'Last name'
			],
			'username' => [
				'label'=> 'Username',
				'validator'=> 'unique'
			],
			'phone' => [
				'label' => 'Phone',
				'type' => 'phone'
			]
		];
	}
}
?>