<?
class DriverModel extends BaseModel {

	protected $expiredInterval = 'INTERVAL 1 DAY';
	protected $offlineInterval = OFFLINEINTERVAL;
	protected $lostConnectInterval = LOSTCONNECTINTERVAL;
	
	protected function getTable() {
		return 'driverOnTheLine';
	}

	public function Update($values) {
		GLOBAL $dbp;
		
		$active = (isset($values['active']) && $values['active']) ? 1 : 0;
		$car_id = isset($values['car_id']) ? $values['car_id'] : null;
		$avgSpeed = isset($values['avgSpeed']) ? $values['avgSpeed'] : 0;

		if (isset($values['id'])) 
			$field_indent = 'id';
		else if (isset($values['user_id'])) 
			$field_indent = 'user_id';
		else return false;

		$query = "SELECT `id` FROM {$this->getTable()} WHERE `{$field_indent}` = {$values[$field_indent]}";

		if ($dbp->line($query)) {
			$timeBlock = '';
			if ($active)
				$timeBlock = ',`activationTime` = NOW(), `expiredTime` = NOW() + '.$this->expiredInterval;

			$query = "UPDATE {$this->getTable()} SET `car_id` = ?, `active` = ?{$timeBlock}, `avgSpeed` = ? WHERE `{$field_indent}`= ?";

			return $dbp->bquery($query, 
				'iidi', 
				[$car_id, $active, $avgSpeed, $values[$field_indent]]);
		} else {
			return $dbp->bquery("INSERT {$this->getTable()} (`user_id`, `car_id`, `active`, `activationTime`, `expiredTime`, `avgSpeed`) VALUES (?, ?, ?, NOW(), NOW() + {$this->expiredInterval}), ?", 
				'iiid', 
				[$values['user_id'], $car_id, $active, $avgSpeed]);
		}

		return false;
	}

	public function getItem($data) {
		GLOBAL $dbp;

		$where = '';
		if (is_numeric($data))
			$where = "WHERE d.id = {$data}";
		else {
			if (isset($data['user_id']))
				$where = "WHERE u.id = {$data['user_id']}";
			else if (isset($data['driver_id']))
				$where = "WHERE `active` = 1 AND `expiredTime` >= NOW() AND u.`last_time` >= NOW() - {$this->lostConnectInterval} AND d.id={$data['driver_id']}";
			else return null;
		}

		$query = "SELECT d.id, d.avgSpeed, (d.active AND `expiredTime` >= NOW()) AS active, d.user_id, d.useTogether, IF (u.`last_time` >= NOW() - {$this->offlineInterval}, 1, 0) AS online, u.lat, u.lng, u.angle, u.username, d.car_id, c.comfort, c.seating, c.comfort, cb.symbol AS car_body, c.number, c.seating - (SELECT COUNT(id) FROM orders WHERE driver_id = d.id AND state = 'accepted') AS available_seat, cc.name AS car_colorName, cc.rgb AS car_color ".

			"FROM {$this->getTable()} d ".
				"INNER JOIN users u ON d.user_id = u.id ".
				"INNER JOIN car c ON d.car_id = c.id ".
				"INNER JOIN car_bodies cb ON cb.id = c.car_body_id ".
				"INNER JOIN car_color cc ON cc.id = c.color_id ".
				$where;

		return $dbp->line($query);
	}

	public function OrderDrivers($order_id) {
		GLOBAL $dbp;

		$query = "SELECT d.* FROM driverOnTheLine d INNER JOIN orders o ON o.driver_id=d.id WHERE o.id={$order_id}";

		//trace($query);
		return $dbp->asArray($query);
	}

	public function SuitableDrivers($lat = null, $lng = null, $a_user = null, $maxDistanceToStart = 5000, $requireSeats=-1) {
		GLOBAL $dbp, $user;

		if (!$a_user) $a_user = $user;

		if ($order = (new OrderModel())->getActiveOrder($a_user['id'], "'accepted', 'wait_meeting', 'execution', 'driver_move'")) {

			$query = "SELECT d.id, d.user_id, d.useTogether, IF (u.`last_time` >= NOW() - {$this->offlineInterval}, 1, 0) AS online, u.lat, u.lng, u.angle, u.username, c.comfort, c.seating, cb.symbol AS car_body, c.number, o.id AS order_id, o.remaindDistance ".

				"FROM {$this->getTable()} d ".
				"INNER JOIN users u ON d.user_id = u.id ".
				"INNER JOIN car c ON d.car_id = c.id ".
				"INNER JOIN car_bodies cb ON cb.id = c.car_body_id ".
				"INNER JOIN orders o ON o.driver_id = d.id ".

				"WHERE o.id={$order['id']}";

			//trace($query);
			$drivers = $dbp->asArray($query);

		} else {

			$orderModel = new OrderModel();

			if (!$lat) {
				$a_user = Page::getSession('user');
				$lat = $a_user['lat'];
				$lng = $a_user['lng'];
			}

			$drivers = [];
			if ($lat) {
				$query = "SELECT d.id, d.user_id, d.useTogether, IF (u.`last_time` >= NOW() - {$this->offlineInterval}, 1, 0) AS online, u.lat, u.lng, u.angle, u.username, c.comfort, c.seating, cb.symbol AS car_body, c.number ".

				"FROM {$this->getTable()} d ".
				"INNER JOIN users u ON d.user_id = u.id ".
				"INNER JOIN car c ON d.car_id = c.id ".
				"INNER JOIN car_bodies cb ON cb.id = c.car_body_id ".

				"WHERE `active` = 1 AND `expiredTime` >= NOW() AND u.`last_time` >= NOW() - {$this->lostConnectInterval}";
				$list = $dbp->asArray($query);
				
				foreach ($list as $driver) {
					$distance =  Distance($driver['lat'], $driver['lng'], $lat, $lng);
					if ($distance < $maxDistanceToStart) {
						$driver['distanceStart'] = $distance;

						if ($requireSeats > -1) {

							$driver['seats'] = $driver['seating'] - $orderModel->getTakenSeats($driver['id']);

							if ($driver['seats'] >= $requireSeats)
								$drivers[] = $driver;

						} else $drivers[] = $driver;
					}
				}
			}
		}

		return $drivers;
	}

	public function getFields() {
		GLOBAL $user;

		return [
			'id' => [
				'type' => 'hidden'
			],
			'active' => [
				'label' => 'Active',
				'type' => 'bool'
			],
			'car_id' => [
				'type' => 'car',
				'label' => 'Car',
				'user_id'=> $user['id'],
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