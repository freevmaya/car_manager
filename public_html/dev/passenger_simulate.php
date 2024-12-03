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

	do {

		$passengers = BaseModel::FullItems($simulateModel->getItems(), ['order_id'=>$orderModel]);

		foreach ($passengers as $pass) {

			if (!$pass['order_id']) {
				$routes = $routeModel->getItems([]);
				$count = count($routes);
				if ($count > 0) {
					do {
						$rndRoute = $routes[rand(0, $count - 1)];
					} while (isNotAllowRoute($rndRoute) || ($count <= count($passengers)));
					
					$simulateModel->Start($pass['user_id'], $rndRoute);

					print_r($pass);
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