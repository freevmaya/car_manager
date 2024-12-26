<?
$fp = fopen("lock_ps", "w+");

if (flock($fp, LOCK_EX | LOCK_NB)) {

	include("engine.php");

	/*
	$directions = new Directions();

	$path = $directions->getPath(['placeId'=>'ChIJbxInKtyTxUMRB6IjYt3JRC8'], ['lat'=>55.1934509, 'lng'=>61.3193359]);

	print_r($path);
	*/


	$user = json_decode(DEVUSER, true);
	$dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);

	$simulateModel = new SimulatePassModel();
	$routeModel = new RouteModel();
	$userModel = new UserModel();
	$nModel = new NotificationModel();
	$orderModel = new OrderModel();


	$tracers = [];

	function replyPath($path, $data) {
		GLOBAL $simulateModel, $routeModel, $nModel;

		$driver = $data['driver'];
		$order = $data['order'];

		$pathToDb = [
			'start'=>$path['request']['origin'],
			'finish'=>$path['request']['destination'],
			'travelMode'=>$path['request']['travelMode'],
			'routes'=>$path['routes'][0]['overview_path'],
			'user_id'=>$driver['user_id']
		];

		$route_id = $routeModel->Update($pathToDb);
		$simulateModel->Start($driver['user_id'], $route_id);

		$nModel->AddNotify($order['id'], 'pathToStart', $order['user_id'], json_encode($path));
	}

	function isNotAllowRoute($route) {
		GLOBAL $passengers;

		$start = json_decode($route['start'], true);
		if (!isset($start['lat']))
			return true;

		foreach ($passengers as $pass)
			if (isset($passengers['order']) && ($passengers['order']['route_id'] == $route['id']))
				return true;

		return false;
	}

	function NearestOffer($offers, $user) {
		$min_distance = PHP_FLOAT_MAX;
		$result = null;
		foreach ($offers as $offer) {
			$driver = json_decode($offer['text'], true);
			$distance = Distance($user['lat'], $user['lng'], $driver['lat'], $driver['lng']) + (isset($driver['remaindDistance']) ? $driver['remaindDistance'] : 0);

			if ($distance < $min_distance)
				$result = $offer;
		}
		return $result;
	}

	do {

		$passengers = BaseModel::FullItems($simulateModel->getItems(), ['order_id'=>$orderModel]);

		//trace($passengers);

		foreach ($passengers as $pass) {

			if (!$pass['order_id']) {
				$routes = $routeModel->getItems([]);
				$count = count($routes);
				if ($count > 0) {
					do {
						$rndRoute = $routes[rand(0, $count - 1)];
					} while (isNotAllowRoute($rndRoute) || ($count <= count($passengers)));
					
					print_r("Start order {$pass['user_id']} route_id: {$rndRoute['id']}\n");
					$simulateModel->Start($pass['user_id'], $rndRoute);
				}
			}

			$items = $nModel->getItems(['user_id'=>$pass['user_id'], 'content_type'=>['offerToPerform', 'changeOrder', 'pathToStart'], 'state'=>'active']);

			$offers = [];
			foreach ($items as $notify) {

				if ($notify['content_type'] == 'offerToPerform') {

					$offers[] = $notify;
					$nModel->SetState(['id'=>$notify['id'], 'state'=>'read']);

				} elseif ($notify['content_type'] == 'pathToStart') {

					$order = $orderModel->getItem($notify['content_id'], true);

					print_r("Driver {$order['driver_id']} begin go to start\n");
					$nModel->SetState(['id'=>$notify['id'], 'state'=>'read']);

				} else if ($notify['content_type'] == 'changeOrder') {

					$order = array_merge($orderModel->getItem($notify['content_id']), json_decode($notify['text'], true));
					if ($order['state'] == 'wait_meeting') {
						$route = $routeModel->getItem($order['route_id']);

						print_r("Set position for meeting\n");
						$start = json_decode($route['start'], true);

						$userModel->UpdatePosition($pass['user_id'], $start);
						$nModel->SetState(['id'=>$notify['id'], 'state'=>'read']);
					} else {
						print_r("Change order {$order['id']} to {$order['state']}\n");
						$nModel->SetState(['id'=>$notify['id'], 'state'=>'read']);
					}
				}
			}

			if (count($offers) > 0) {
				print_r("There is offer\n");
				if ($offer = NearestOffer($offers, $pass)) {

					$driver = json_decode($offer['text'], true);
					print_r("Accept offer from driver {$driver['id']}/{$driver['user_id']}\n");
					$simulateModel->AcceptOffer($pass['user_id'], $driver);
				}
			}

			usleep(1000000);
		}
	} while (count($passengers) > 0);

	$dbp->close();

	flock($fp, LOCK_UN); // отпираем файл

	fclose($fp);
	unlink("lock_ps");
} else { 
    echo "Не удалось получить блокировку, файл 'lock' уже заблокирован!";
}
?>