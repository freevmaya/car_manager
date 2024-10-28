<?
class Driver extends Page {

	protected function initModel() {

		if (Page::$subpage == 'editcar') {
			$this->dataId = @Page::$request['id'];
			return new CarModel();
		}

		$this->dataId = $this->user['id'];
		return new DriverModel();
	}

	public function getId() {
		return $this->dataId;
	}
}
?>