<?
class Driver extends Page {

	protected function initModel() {
		GLOBAL $user;

		if (Page::$subpage == 'editcar') {
			$this->dataId = @Page::$request['id'];
			return new CarModel();
		}

		return new DriverModel();
	}

	public function getId() {
		GLOBAL $user;
		return ['user_id'=>$user['id']];
	}
}
?>