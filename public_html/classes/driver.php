<?
class Driver extends Page {

	protected function initModel() {
		GLOBAL $user;

		if (Page::$subpage == 'editcar') {
			$this->dataId = @Page::$request['id'];
			return new CarModel();
		}

		$this->dataId = $user['id'];
		return new DriverModel();
	}

	public function getId() {
		return $this->dataId;
	}
}
?>