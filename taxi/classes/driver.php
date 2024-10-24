<?
class Driver extends Page {

	private $driver;
	protected function initModel() {

		if (Page::$subpage == 'prepare_trip')
			return new PrepareTripModel();

		return new DriverModel();
	}
}
?>