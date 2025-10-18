<?
class Driver extends Page {

	protected function initModel() {
		GLOBAL $user;
		return new DriverModel();
	}

	public function getId() {
		GLOBAL $user;
		return ['user_id'=>$user['id']];
	}
}
?>