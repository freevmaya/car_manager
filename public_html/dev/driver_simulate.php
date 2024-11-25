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

		$path['user_id'] = $driver['user_id'];

		$route_id = $routeModel->Update($path);
		$simulateModel->Start($driver['user_id'], $route_id);

		$nModel->AddNotify($order['id'], 'pathToStart', $order['user_id'], json_encode($path));
	}

	do {

		$drivers = BaseModel::FullItems($simulateModel->getItems(), ['route_id'=>$routeModel]);

		foreach ($drivers as $driver) {
			$driverModel->Update($driver);

			$routes = @$driver['route'] ? json_decode($driver['route']['routes'], true) : null;

			if ($routes) {

				if (!isset($tracers[$driver['id']])) {
					$tracers[$driver['id']] = new Tracer($routes, 30); // 5 km/h
				}
				
				$tracer = $tracers[$driver['id']];
				$tracer->Update();

				if ($tracer->finished) {
					// Закончили рейс, идем отдыхать! 


					unset($tracers[$driver['id']]);
					$simulateModel->Stop($driver['user_id']);
				}

				$userModel->UpdatePosition($driver['user_id'], $tracer->routePos, $tracer->routeAngle);
			} else {
				//Если есть активная заявка.
				$order = $orderModel->getActiveOrder(['driver_id' => $driver['driver_id']]);
				if ($order) {
					// Здесь отправляем на место начала поездки по заявке
					// если не найдет еще путь к точке сбора
					if (count($nModel->getItems(['user_id'=>$order['user_id'], 'content_type'=>'pathToStart', 'state'=>'active'])) == 0) {

						$order = BaseModel::FullItem($order, ['route_id'=>$routeModel]);
						$nModel->getData($driver['user_id'], $order['user_id'], json_encode(['action'=>'getPath', 'start'=>$driver, 'finish'=>$order['route']['start']]), 'replyPath', 
							['driver'=>$driver, 'order'=>$order]);
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

				$nModel->SetState(['id'=>$notify['id'], 'state'=>'read']);

				if ($notify['content_type'] == 'orderCreated') {
					$order = $orderModel->getItem($notify['content_id']);
					if ($order && ($order['state'] == 'wait')) {
						$driverDetail = $driverModel->getItem(['user_id'=>$driver['user_id']]);

						if (isset($tracers[$driver['id']])) {
							$tracer = $tracers[$driver['id']];
							$driverDetail['route_id'] = $driver['route_id'];
							$driverDetail['remindDistance'] = $tracer->remindDistance();
						}

						$nModel->AddNotify($order['id'], 'offerToPerform', $order['user_id'], json_encode($driverDetail), $driver['id']);
					}
				} else if ($notify['content_type'] == 'orderCreated') {
				}
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