<?
class Ajax extends Page {

	public function Render($page) {
		header("Content-Type: text/json; charset=".CHARSET);
		header('Server-Time:'.date("Y-m-d H:i:s"));
		echo json_encode($this->ajax());
	}

	public function ajax() {

		if (isset(Page::$request['action'])) {
			$action = Page::$request['action'];
			$requestId = @Page::$request['ajax-request-id'];
			if (method_exists($this, $action) && Page::requiestIdModel($requestId)) {
				$data = isset(Page::$request['data']) ? json_decode(Page::$request['data'], true) : null;

				return $this->$action($data);
			}
		}

		return Page::$request;
	}

	protected function setGeoPos($data) {
		GLOBAL $user;
		return (new LogGeoPosModel())->Update(['user_id'=>$user['id'], 'lat'=>$data['lat'], 'lng'=>$data['lng']]);
	}

	protected function setPosition($data) {
		GLOBAL $user;
		if (isset($data['avgSpeed']))
			$this->setValue(['model'=>'DriverModel', 'id'=>$this->asDriver(), 'name'=>'avgSpeed', 'value'=>$data['avgSpeed']]);

		return (new UserModel())->UpdatePosition($user['id'], $data, isset($data['angle']) ? $data['angle'] : 0);
	}

	protected function setValue($data) {
		$result = false;
		if ($nameModel 	= @$data['model']) {
			$id 		= @$data['id'];
			$model = new ($nameModel)();
			if ($item = $model->getItem($data['id'])) {

				$item[$data['name']] = $data['value'];
				$result = $model->Update($item);
			}
		}
		return $result;
	}

	protected function BeganRouteCar($data) {
		GLOBAL $dbp;
		
		$dbp->query("INSERT INTO route (`driver_id`, `car_id`, `path`) VALUES ({$data['driver_id']}, {$data['car_id']}, '{$data['path']}')");

		return ["guid"=>$dbp->lastID()];
	}

	protected function finishWork($data) {
		GLOBAL $dbp;
		$result = $dbp->query("UPDATE driverOnTheLine SET `active`=0, `closeTime`=NOW() WHERE user_id={$data['user_id']}");

		return ["result"=>$result];
	}

	protected function BeginDriver($data) {
		GLOBAL $dbp, $user;
		$result = $dbp->query("REPLACE driverOnTheLine (`user_id`, `car_id`, `active`, `activationTime`, `closeTime`) VALUES ({$user['id']}, {$data['car_id']}, 1, NOW(), null)");

		return ["result"=>$result];
	}

	protected function logGeoPos($data) {
		GLOBAL $user;
		(new LogGeoPosModel())->Update(['user_id'=>intval($user['id']), 'lat'=>$data['lat'], 'lng'=>$data['lng']]);
	}

	protected function getLog($data) {
		return (new LogGeoPosModel())->getItems($data);
	}

	protected function checkState($data) {
		GLOBAL $dbp, $user;

		$result = [];

		$nModel = new NotificationModel();

		if (isset($data['statusesToReturn']))
			foreach ($data['statusesToReturn'] as $item)
				$nModel->SetState($item);
			
		$notificationList = $nModel->getItems(['user_id'=>$user['id'], 'state'=>'active']);

		if (count($notificationList) > 0)
			$result['notificationList'] = $notificationList;	

		if (isset($data['lat'])) {		

			if (isset($data['requireDrivers']))
				$result['SuitableDrivers'] = (new DriverModel())->SuitableDrivers($data['lat'], $data['lng'], null, AREA_RADIUS);

			//trace(array_merge($data, $user));
			(new UserModel())->UpdatePosition($user['id'], $data, isset($data['angle']) ? $data['angle'] : 0);

			$user['lat'] = $data['lat'];
			$user['lng'] = $data['lng'];
			if (isset($data['angle']))
					$user['angle'] = $data['angle'];
			Page::setSession('user', $user);
		}
		else $dbp->query("UPDATE users SET last_time = NOW() WHERE id = {$user['id']}");

		if (isset($data['extend'])) {

			$result['extendResult'] = [];

			foreach ($data['extend'] as $eitem) {
				$action = $eitem['action'];
				$result['extendResult'][] = $this->$action($eitem['data']);
			}
		}

		return $result;
	}

	protected function SetRemaindDistance($data) {
		return (new OrderModel())->SetRemaindDistance($data['order_id'], $data['remaindDistance']);
	}

	protected function GetRemaindDistance($data) {
		return (new OrderModel())->GetRemaindDistance($data);
	}

	protected function GetPosition($data) {
		$user = (new UserModel())->getItem($data);  
		return ['lat'=>$user['lat'], 'lng'=>$user['lng']];
	}

	protected function StateNotification($data) {
		return ['result'=> (new NotificationModel())->SetState($data)];
	}

	protected function offerToPerform($data) {
		GLOBAL $user;

		$result = false;
		$error = 'unknown error';
		$orderModel = new OrderModel();
		if ($order = $orderModel->getItem($data['id'])) {

			if ($driver = (new DriverModel())->getItem(['user_id'=>$user['id']])) {
				$driver['remaindDistance'] = $data['remaindDistance'];
				$result = (new NotificationModel())->AddNotify($order['id'], 'offerToPerform', $order['user_id'], json_encode($driver), $driver['id']);
			} else $error = 'Driver not activated';
		}
		return ['result'=> $result ? 'ok' : $error];
	}

	protected function getOffers($data) {
		$result = (new NotificationModel())->getOffers(@$data['user_id'], @$data['notify_id']);
		return $result;
	}

	protected function GetOrderRoute($data)
	{
		if ($order = (new OrderModel())->getActiveOrder($data))
			return BaseModel::FullItem($order, ['route_id'=>new RouteModel()]);

		if (isset($data['driver_id']))
			$data['d.id'] = $data['driver_id'];

		if (($simulate = (new SimulateModel())->getItem($data)) && (isset($simulate['route_id'])))
			return (new RouteModel())->getItem($simulate['route_id']);

		return null;
	}

	protected function GetRoute($data)
	{
		$routeModel = new RouteModel();
		if (isset($data['order_id'])) {
			return BaseModel::FullItem((new OrderModel())->getItem($data['order_id']), ['route_id'=>$routeModel]);
		}

		return $routeModel->getItem($data);
	}

	protected function AddOrder($data) {
		GLOBAL $user;

		// Параметры: 
		// path, startPlaceId, finishPlaceId, user_id, pickUpTime
		// или 
		// route_id, pickUpTime

		$order_id = false;

		if (!isset($data['route_id']))
			$data['route_id'] = (new RouteModel())->Update($data['path']);

		if (!$data['route_id'] || 
			!($order_id = (new OrderModel())->AddOrder($data, AREA_RADIUS))) 
			$order_id = 'An error was caused by update route';

		return ["result"=>$order_id];
	}

	protected function catchError($data) {
		return (new ErrorsModel())->Add($data['message'], $data['stack']);
	}

	protected function Go($data) {
		$route_id = (new RouteModel())->Update($data);
		return ["id"=>$route_id];
	}

	protected function SetState($data) {
		GLOBAL $user;

		if ($result = (new OrderModel())->SetState($data['id'], $data['state'], @$data['driver_id'], $user['id'])) 
			return ["result"=>$result];
		else return false;
	}

	protected function Notification($data) {

		$result = (new NotificationModel())->AddNotify($data['content_id'], $data['content_type'], $data['user_id'], $data['text']);

		return ['result' => $result ? 'ok' : null];
	}

	protected function Reply($data) {
		GLOBAL $user;

		$result = false;

		$notiyModule = new NotificationModel();
		if ($notify = $notiyModule->getItem($data['id'])) {
			$result = $notiyModule->AddNotify($user['id'], 'replyData', $notify['content_id'], json_encode($data, true));
		}

		return ['result' => $result];
	}

	protected function getOrders($data) {
		return (new OrderModel())->getItems($data);
	}

	protected function getOrder($data) {
		return (new OrderModel())->getItem($data);
	}

	protected function getOrderProcess($data) {
		GLOBAL $user;

		$result = 'Order not found';
		$orders = (new OrderModel())->getItems(['o.user_id'=>$user['id'], 'state'=>ACTIVEORDERLIST_ARR, 'limit'=>1]);
		if (count($orders) > 0) {
			$orders = BaseModel::FullItems($orders, ['route_id'=>new RouteModel()]);
			$result = html::RenderField(['type'=>'order'], 
							array_merge($orders[0], $orders[0]['route']));
		}

		return ['result' => $result];
	}

	public function checkUnique($data) {
		$model = new $data['model']();
		return $model->checkUnique($data['value']);
	}
}
?>