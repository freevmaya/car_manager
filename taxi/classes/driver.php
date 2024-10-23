<?
class Driver extends Page {

	private $driver;
	protected function initModel($dbp, $user) {
		return new DriverModel($dbp, $user['id']);
	}
}
?>