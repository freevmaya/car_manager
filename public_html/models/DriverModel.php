<?
class DriverModel extends BaseModel {

	protected $expiredInterval = 'INTERVAL 1 DAY';
	protected $offlineInterval = 'INTERVAL 15 SECOND';
	protected $lostConnectInterval = 'INTERVAL 10 MINUTE';
	protected static $maxDistanceToStart = 5000; // Удаленость от старта
	
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

	public function getItem($data) {
		GLOBAL $dbp;

		if (is_numeric($data))
			$user_id = $data;
		else $user_id = @$data['user_id'];

		$query = "SELECT d.id, d.active, d.user_id, d.useTogether, IF (u.`last_time` >= NOW() - {$this->offlineInterval}, 1, 0) AS online, u.lat, u.lng, u.angle, u.username, d.car_id, c.comfort, c.seating, c.comfort, cb.symbol AS car_body, c.number, c.seating - (SELECT COUNT(id) FROM orders WHERE driver_id = d.id AND state = 'accepted') AS available_seat, cc.name AS car_colorName, cc.rgb AS car_color ".

			"FROM {$this->getTable()} d ".
				"INNER JOIN users u ON d.user_id = u.id ".
				"INNER JOIN car c ON d.car_id = c.id ".
				"INNER JOIN car_bodies cb ON cb.id = c.car_body_id ".
				"INNER JOIN car_color cc ON cc.id = c.color_id ";

		if ($user_id) {

			$query .= "WHERE u.id = {$user_id}";
			return $dbp->line($query);
		} else if (isset($data['driver_id'])) {

			$query .= "WHERE `active` = 1 AND `expiredTime` >= NOW() AND u.`last_time` >= NOW() - {$this->lostConnectInterval} AND d.id={$data['driver_id']}";

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
			$query = "SELECT d.id, d.user_id, d.useTogether, IF (u.`last_time` >= NOW() - {$this->offlineInterval}, 1, 0) AS online, u.lat, u.lng, u.angle, u.username, c.comfort, c.seating, cb.symbol AS car_body, c.number, c.seating - (SELECT COUNT(id) FROM orders WHERE driver_id = d.id AND state = 'accepted') AS available_seat ".

			"FROM {$this->getTable()} d INNER JOIN users u ON d.user_id = u.id INNER JOIN car c ON d.car_id = c.id INNER JOIN car_bodies cb ON cb.id = c.car_body_id ".

			"WHERE `active` = 1 AND `expiredTime` >= NOW() AND u.`last_time` >= NOW() - {$this->lostConnectInterval}";
			$list = $dbp->asArray($query);

			foreach ($list as $driver) {
				$distance =  Distance($driver['lat'], $driver['lng'], $lat, $lng);
				if (($distance < DriverModel::$maxDistanceToStart) && ($driver['available_seat'] > 0)) {
					$driver['distanceStart'] = $distance;
					$drivers[] = $driver;
				}
			}

			//if (count($drivers) == 0)
				//trace($query);
		}

		return $drivers;
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
			'car_id' => [
				'type' => 'car',
				'label' => 'Car',
				'user_id'=> Page::$current->getUser()['id'],
				'model' => 'CarModel',
				'required' => true
			]/*
			,
			'driver' => [
				'label'=> 'Driver',
				'readonly' => true
			],
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