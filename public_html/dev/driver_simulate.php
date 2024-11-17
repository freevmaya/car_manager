<?
$fp = fopen("lock", "w+");

if (flock($fp, LOCK_EX | LOCK_NB)) {

	include("engine.php");


	$user = json_decode(DEVUSER, true);
	$dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);

	$simulateModel = new SimulateModel();
	$driverModel = new DriverModel();
	$routeModel = new RouteModel();
	$userModel = new UserModel();


	$tracers = [];

	do {

		$drivers = BaseModel::FullItems($simulateModel->getItems(), ['route_id'=>$routeModel]);

		foreach ($drivers as $driver) {
			$driverModel->Update($driver);

			$routes = json_decode($driver['route']['routes'], true);

			if ($routes) {

				if (!isset($tracers[$driver['id']])) {
					$tracers[$driver['id']] = new Tracer($routes, 30); // 5 km/h
				}
				
				$tracer = $tracers[$driver['id']];
				$tracer->Update();

				$userModel->UpdatePosition($driver['user_id'], $tracer->routePos, $tracer->routeAngle);
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