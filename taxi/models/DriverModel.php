<?
class DriverModel {
	protected $user_id;
	protected $dbp;

	private $driver;
	public function __construct($dbp, $user_id) {
		$this->user_id = $user_id;
		$this->dbp = $dbp;
	}

	public function getDriver() {
		if (!$this->driver && $this->user_id) {
			$query = "SELECT u.*, d.* FROM users u LEFT JOIN driverOnTheLine d ON d.user_id = u.id WHERE u.id = {$this->user_id}";

			//echo $query;
			$this->driver = $this->dbp->line($query);
		}

		return $this->driver;
	}
}
?>