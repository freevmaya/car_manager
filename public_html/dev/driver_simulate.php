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

	do {

		$drivers = BaseModel::FullItems($simulateModel->getItems(), ['route_id'=>$routeModel]);

		foreach ($drivers as $driver) {
			$driverModel->Update($driver);

			$routes = @$driver['route'] ? json_decode($driver['route']['routes'], true) : null;
			$tracer = null;
			$order = $orderModel->getActiveOrder(['driver_id' => $driver['driver_id']]);

			if ($routes) {

				if (!isset($tracers[$driver['id']])) {
					$tracers[$driver['id']] = new Tracer($routes, 30); // 5 km/h
					print_r("Got new course {$driver['user_id']} and began\n");
				}
				
				$tracer = $tracers[$driver['id']];
				$tracer->Update();

				$userModel->UpdatePosition($driver['user_id'], $tracer->routePos, $tracer->routeAngle);
				if ($order) {
					trace($tracer);
					$orderModel->SetRemaindDistance($order['id'], $tracer->remaindDistance());
				}


				if ($tracer->finished) {
					// Закончили рейс, идем отдыхать! 

					unset($tracers[$driver['id']]);
					$simulateModel->Stop($driver['user_id']);
					print_r("Finished course {$driver['user_id']}\n");
					continue;
				}
			}

			if (!$tracer || $tracer->finished) {
				//Если есть активная заявка.
				if ($order) {
					// Здесь отправляем на место начала поездки по заявке
					// если не найдет еще путь к точке сбора

					trace($order);

					if ($order['state'] == 'accepted') {

						$pathToStart = $nModel->getItems(['user_id'=>$order['user_id'], 'content_id'=>$order['id'], 'content_type'=>'pathToStart', 'state'=>'active']);

						if (count($pathToStart) == 0) {

							print_r("Get path to start\n");
							$order = BaseModel::FullItem($order, ['route_id'=>$routeModel]);
							$nModel->getData($driver['user_id'], $order['user_id'], json_encode(['action'=>'getPath', 'start'=>$driver, 'finish'=>$order['route']['start']]), 'replyPath', 
								['driver'=>$driver, 'order'=>$order]);
						} else {
							//$simulateModel->Start($driver['user_id'], $route_id);
							print_r("Finished path to start\n");
							$nModel->SetState(['id'=>$pathToStart[0]['id'], 'state'=>'read']);
							$orderModel->SetState($order['id'], 'wait_meeting', false, true);
						}
					} else if ($order['state'] == 'wait_meeting') {
						print_r("Wait meeting\n");

						$orderModel->SetState($order['id'], 'execution', false, true);
						$simulateModel->Start($driver['user_id'], $order['route_id']);
					} else if ($order['state'] == 'execution') {
						print_r("Finished order\n");

						$orderModel->SetState($order['id'], 'finished', false, true);
						$simulateModel->Stop($driver['user_id']);
					}

				} else if (strtotime($driver['waitUntil']) < strtotime('now')) {
					// Отдохнули, начинаем новый рейс!

					$routes = $routeModel->getItems([]);
					$count = count($routes);
					if ($count > 0) {
						$rndRoute = $routes[rand(0, $count - 1)];
						$simulateModel->Start($driver['user_id'], $rndRoute['id']);
					}

				}
				$userModel->OnLine($driver['user_id']);
			}

			$items = $nModel->getItems(['user_id'=>$driver['user_id'], 'content_type'=>['orderCreated', 'acceptedOffer', 'orderCancelled'], 'state'=>'active']);

			foreach ($items as $notify) {

				if ($notify['content_type'] == 'orderCreated') {
					$order = $orderModel->getItem($notify['content_id']);
					if ($order && ($order['state'] == 'wait')) {
						$driverDetail = $driverModel->getItem(['user_id'=>$driver['user_id']]);

						if (isset($tracers[$driver['id']])) {
							$tracer = $tracers[$driver['id']];
							$driverDetail['route_id'] = $driver['route_id'];
							$driverDetail['remaindDistance'] = $tracer->remaindDistance();
						}

						$nModel->AddNotify($order['id'], 'offerToPerform', $order['user_id'], json_encode($driverDetail), $driver['id']);
					}
				} else if ($notify['content_type'] == 'orderCancelled') {

					$order = $orderModel->getItem($notify['content_id']);

					if (($order['driver_id'] == $driver['driver_id']) && isset($tracers[$driver['id']])) {

						$simulateModel->Stop($driver['user_id']);
						if (isset($tracers[$driver['id']]))
							unset($tracers[$driver['id']]);
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