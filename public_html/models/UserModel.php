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

	public function OnLine($user_id) {
		GLOBAL $dbp;
		return $dbp->query("UPDATE users SET last_time = NOW() WHERE id = {$user_id}");
	}

	public function UpdatePosition($user_id, $data, $angle = 0) {
		GLOBAL $dbp;
		return $dbp->bquery("UPDATE users SET last_time = NOW(), lat = ?, lng = ?, angle = ? WHERE id = ?", 'dddi', 
							[$data['lat'], $data['lng'], $angle, $user_id]);
	}

	public function Update($values) {
		GLOBAL $dbp;

		if ($dbp->one("SELECT id FROM {$this->getTable()} WHERE `id` = {$values['id']}")) {
			return $dbp->bquery("UPDATE {$this->getTable()} SET `first_name` = ?, `last_name` = ?, `username` = ?, `phone` = ? WHERE `id` = ?", 'ssssi', 
				[$values['first_name'], $values['last_name'], $values['username'], $values['phone'], $values['id']]);
		}
		return false;
	}

	public function checkUnique($value) { 
		GLOBAL $dbp;
		return $dbp->one("SELECT id FROM {$this->getTable()} WHERE `username` = '{$value}'") === false; 
	}

	public function GetAnyRealOnLine() {
		GLOBAL $dbp;
		$query = "SELECT * FROM {$this->getTable()} WHERE isReal = 1 AND `last_time` >= NOW() - ".OFFLINEINTERVAL;
		return $dbp->line($query);
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