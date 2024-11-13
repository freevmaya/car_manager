<?
class DriverModel extends BaseModel {

	protected $expiredInterval = 'INTERVAL 1 DAY';
	protected $offlineInterval = 'INTERVAL 15 SECOND';
	protected $lostConnectInterval = 'INTERVAL 10 MINUTE';
	
	protected function getTable() {
		return 'driverOnTheLine';
	}

	public function Update($values) {
		GLOBAL $dbp;

		$active = isset($values['active']) ? 1 : 0;
		$car_id = isset($values['car_id']) ? $values['car_id'] : null;

		if ($dbp->line("SELECT `id` FROM {$this->getTable()} WHERE `user_id` = {$values['user_id']}")) {
			$timeBlock = '';
			if ($active)
				$timeBlock = ',`activationTime` = NOW(), `expiredTime` = NOW() + '.$this->expiredInterval;

			$dbp->bquery("UPDATE {$this->getTable()} SET `car_id` = ?, `active` = ?{$timeBlock} WHERE `user_id`= ?", 
				'iii', 
				[$car_id, $active, $values['user_id']]);
		} else {
			$dbp->bquery("INSERT {$this->getTable()} (`user_id`, `car_id`, `active`, `activationTime`, `expiredTime`) VALUES (?, ?, ?, NOW(), NOW() + {$this->expiredInterval})", 
				'iii', 
				[$values['user_id'], $car_id, $active]);
		}

		//(new NotificationModel()).AddNo
	}

	public function getItem($user_id) {
		GLOBAL $dbp;

		if ($user_id) {
			$query = "SELECT CONCAT(u.username, ' ', u.phone) as driver, d.car_id, IF(`expiredTime` >= NOW(), d.active, 0) as active, d.id FROM users u ".
					"LEFT JOIN {$this->getTable()} d ON d.user_id = u.id ".
					"WHERE u.id = {$user_id}";

			return $dbp->line($query);
		}

		return null;
	}

	public function OrderDrivers($order_id) {
		GLOBAL $dbp;

		$query = "SELECT d.* FROM driverOnTheLine d INNER JOIN orders o ON o.driver_id=d.id WHERE o.id={$order_id}";

		//trace($query);
		return $dbp->asArray($query);
	}

	public function SuitableDrivers($lat = null, $lng = null) {
		GLOBAL $dbp;
		if (!$lat) {
			$user = Page::getSession('user');
			$lat = $user['lat'];
			$lng = $user['lng'];
		}

		$drivers = [];
		if ($lat) {
			$query = "SELECT d.id, d.user_id, d.useTogether, IF (u.`last_time` >= NOW() - {$this->offlineInterval}, 1, 0) AS online, u.lat, u.lng, u.username, c.comfort, c.seating, c.comfort, cb.symbol AS car_boby, c.number, c.seating - (SELECT COUNT(id) FROM orders WHERE driver_id = d.id AND state = 'accepted') AS available_seat ".

			"FROM {$this->getTable()} d INNER JOIN users u ON d.user_id = u.id INNER JOIN car c ON d.car_id = c.id INNER JOIN car_bodies cb ON cb.id = c.car_body_id ".

			"WHERE `active` = 1 AND `expiredTime` >= NOW() AND u.`last_time` >= NOW() - {$this->lostConnectInterval}";
			$list = $dbp->asArray($query);

			foreach ($list as $driver)
				if ($this->PointInArea($driver, $lat, $lng) && ($driver['available_seat'] > 0))
					$drivers[] = $driver;

			if (count($drivers) == 0)
				trace($query);
		}

		return $drivers;
	}

	public static function PointInArea($driver, $lat, $lng) {
		return Distance($driver['lat'], $driver['lng'], $lat, $lng) < 100000; // В радиусе километра для DEV
	}

	public function getFields() {
		return [
			'user_id' => [
				'type'=> 'hidden',
				'default' => Page::$current->getUser()['id']
			],
			'active' => [
				'label' => 'Active',
				'type' => 'bool'
			],
			'driver' => [
				'label'=> 'Driver',
				'readonly' => true
			],
			'car_id' => [
				'type' => 'car',
				'label' => 'Car',
				'user_id'=> Page::$current->getUser()['id'],
				'model' => 'CarModel',
				'required' => true
			]/*,
			'route_types' => [
				'label' => 'Route types',
				'type' => 'route_types',
				'model' => 'RouteTypesModel',
				'user_id'=> Page::$current->getUser()['id']
			]*/
		];
	}
}
?>