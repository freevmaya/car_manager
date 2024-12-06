<?
$fp = fopen("lock", "w+");

if (flock($fp, LOCK_EX | LOCK_NB)) {

	include("engine.php");

	/*
	$directions = new Directions();

	$path = $directions->getPath(['placeId'=>'ChIJbxInKtyTxUMRB6IjYt3JRC8'], ['lat'=>55.1934509, 'lng'=>61.3193359]);

	print_r($path);
	*/


	$user = json_decode(DEVUSER, true);
	$dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);

	$simulateModel = new SimulateModel();
	$driverModel = new DriverModel();
	$routeModel = new RouteModel();
	$userModel = new UserModel();
	$nModel = new NotificationModel();
	$orderModel = new OrderModel();


	$tracers = [];

	function replyPath($path, $data) {
		GLOBAL $simulateModel, $routeModel, $nModel, $orderModel;

		$driver = $data['driver'];
		$order = $data['order'];

		$overview_path = $path['routes'][0]['overview_path'];

		if (count($overview_path) > 1) {

			$pathToDb = [
				'start'=>$path['start'],
				'finish'=>$path['finish'],
				'travelMode'=>$path['request']['travelMode'],
				'routes'=>$overview_path,
				'user_id'=>$driver['user_id']
			];

			$route_id = $routeModel->Update($pathToDb);
			$simulateModel->Start($driver['user_id'], $route_id);

			$nModel->AddNotify($order['id'], 'pathToStart', $order['user_id'], json_encode($path));
			$orderModel->SetState($order['id'], 'driver_move');
		} else {
			print_r("Error route path: ".print_r($path, true));
			$orderModel->SetState($order['id'], 'rejected');
		}
	}

	function isNotAllowRoute($route_id) {
		GLOBAL $drivers;

		foreach ($drivers as $driver)
			if ($driver['route_id'] == $route_id)
				return true;

		return false;
	}

	do {

		$drivers = BaseModel::FullItems($simulateModel->getItems(), ['route_id'=>$routeModel]);

		foreach ($drivers as $driver) {

			//print_r($driver);
			$driverModel->Update($driver);

			$routes = @$driver['route'] ? json_decode($driver['route']['routes'], true) : null;
			$tracer = null;
			$order = $orderModel->getActiveOrder(['driver_id' => $driver['id']]);

			if ($routes) {

				if (!isset($tracers[$driver['id']])) {
					$tracers[$driver['id']] = new Tracer($routes, 60);
					print_r("Got new course ({$driver['id']}, route_id: {$driver['route_id']}) and began\n");
				}
				
				$tracer = $tracers[$driver['id']];
				$tracer->Update();

				$userModel->UpdatePosition($driver['user_id'], $tracer->routePos, $tracer->routeAngle);
				if ($order)
					$orderModel->SetRemaindDistance($order['id'], $tracer->remaindDistance());


				if ($tracer->finished) {
					// Закончили рейс, идем отдыхать! 

					unset($tracers[$driver['id']]);
					$simulateModel->Stop($driver['user_id']);
					print_r("Finished course {$driver['id']}\n");
				}
			}

			if (!$tracer || $tracer->finished) {
				//Если есть активная заявка.
				if ($order) {

					if ($order['state'] == 'accepted') {

						// Здесь отправляем на место начала поездки по заявке
						// если не найдет еще путь к точке сбора

						$pathToStart = $nModel->getItems(['user_id'=>$order['user_id'], 'content_id'=>$order['id'], 'content_type'=>'pathToStart', 'state'=>'active']);

						if (count($pathToStart) == 0) {

							print_r("There isn't path to start for order {$order['id']}\n");

							$order = BaseModel::FullItem($order, ['route_id'=>$routeModel]);
							$realUser = $userModel->GetAnyRealOnLine();
							if ($realUser) {

								if ($nModel->getData($driver['user_id'], $realUser['id'], json_encode(['action'=>'getPath', 'start'=>['lat'=>$driver['lat'], 'lng'=>$driver['lng']], 'finish'=>$order['route']['start']]), 'replyPath', 
									['driver'=>$driver, 'order'=>$order])) {

									print_r("Get path to start from {$realUser['id']}\n");
								}

							} else print_r("Not found real user online\n");

						} else $nModel->SetState(['id'=>$pathToStart[0]['id'], 'state'=>'read']);

					} else if ($order['state'] == 'driver_move') {

						print_r("Finished path to start\n");
						$orderModel->SetState($order['id'], 'wait_meeting', false, true);
						print_r("Wait meeting\n");

					} else if ($order['state'] == 'wait_meeting') {

						$user = $userModel->getItem($order['user_id']);

						$distance = Distance($user['lat'], $user['lng'], $driver['lat'], $driver['lng']);
						if ($distance < 40) { // Если заказчик на растоянии меньше 40 метров
							sleep(1);

							print_r("Ok! Execution order\n");
							$orderModel->SetState($order['id'], 'execution', false, true);
							$simulateModel->Start($driver['user_id'], $order['route_id']);

						} else {

							print_r("Order: {$order['id']}. Distance to user: ".$distance."\n");

							$order = BaseModel::FullItem($order, ['route_id'=>$routeModel]);
							$start = json_decode($order['route']['start'], true);
							$distance = Distance($start['lat'], $start['lng'], $driver['lat'], $driver['lng']);

							if ($distance > 50) {

								print_r("Driver distance to start: ".$distance."\n");
								$orderModel->SetState($order['id'], 'accepted');
							}
						}


					} else if ($order['state'] == 'execution') {
						print_r("Finished order\n");

						$orderModel->SetState($order['id'], 'finished', false, true);
						$simulateModel->Stop($driver['user_id']);
					}

				} else if (!$driver['waitUntil'] || (strtotime($driver['waitUntil']) < strtotime('now'))) {
					// Отдохнули, начинаем новый рейс!

					$routes = $routeModel->getItems([]);
					$count = count($routes);
					if ($count > 0) {
						do {
							$rndRoute = $routes[rand(0, $count - 1)];
						} while (isNotAllowRoute($rndRoute['id']) || ($count <= count($drivers)));
						
						$simulateModel->Start($driver['user_id'], $rndRoute['id']);
					}

				}
				$userModel->OnLine($driver['user_id']);
			}

			$items = $nModel->getItems(['user_id'=>$driver['user_id'], 'content_type'=>['orderCreated', 'changeOrder'], 'state'=>'active']);

			foreach ($items as $notify) {

				if (($notify['content_type'] == 'orderCreated') && !$order) {
					$newOrder = $orderModel->getItem($notify['content_id']);
					if ($newOrder && ($newOrder['state'] == 'wait')) {
						$driverDetail = $driverModel->getItem(['user_id'=>$driver['user_id']]);

						if (isset($tracers[$driver['id']])) {
							$tracer = $tracers[$driver['id']];
							$driverDetail['route_id'] = $driver['route_id'];
							$driverDetail['remaindDistance'] = $tracer->remaindDistance();
						}

						$nModel->AddNotify($newOrder['id'], 'offerToPerform', $newOrder['user_id'], json_encode($driverDetail), $driver['id']);
					}
				} else if ($notify['content_type'] == 'changeOrder') {

					$orderChng = json_decode($notify['text'], true);

					if ($orderChng['state'] = 'cancel') {

						$order = $orderModel->getItem($notify['content_id']);

						if (($order['driver_id'] == $driver['id']) && isset($tracers[$driver['id']])) {

							$simulateModel->Stop($driver['user_id']);
							if (isset($tracers[$driver['id']]))
								unset($tracers[$driver['id']]);
						}
					}
				}

				$nModel->SetState(['id'=>$notify['id'], 'state'=>'read']);
			}

			usleep(100000);
		}
	} while (count($drivers) > 0);

	$dbp->close();

	flock($fp, LOCK_UN); // отпираем файл

	fclose($fp);
	unlink("lock");
} else { 
    echo "Не удалось получить блокировку, файл 'lock' уже заблокирован!";
}
?>