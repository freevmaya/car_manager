<?
class UserModel {

	public function getItem($user_id) {
		GLOBAL $dbp;

		if ($user_id) {
			$query = "SELECT u.*, d.* FROM users u ".
					"LEFT JOIN driverOnTheLine d ON d.user_id = u.id ".
					"WHERE u.id = {$user_id}";

			return $dbp->line($query);
		}

		return null;
	}

	public function getFields() {
		return [
			'first_name' => [
				'label'=> 'First name',
				'required' => true
			],
			'last_name' => [
				'label'=> 'Last name'
			],
			'phone' => [
				'label' => 'Phone',
				'type' => 'phone',
				'required' => true
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