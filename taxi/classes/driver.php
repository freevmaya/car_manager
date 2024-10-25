<?
class Driver extends Page {

	private $driver;
	protected function initModel() {

		if (Page::$subpage == 'prepare_trip')
			return new PrepareTripModel();

		else if (Page::$subpage == 'createcar')
			return new CarModel();

		return new DriverModel();
	}
}
?>