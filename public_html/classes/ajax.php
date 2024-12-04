<?
class Ajax extends Page {

	public function Render($page) {
		header("Content-Type: text/json; charset=".CHARSET);
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

	protected function checkState($data) {
		GLOBAL $dbp, $user;

		$result = [];
		$notificationList = (new NotificationModel())->getItems(
			['user_id'=>$user['id'], 'state'=>'active']
		);

		//trace($notificationList);
		//$dbp->asArray("SELECT * FROM notifications WHERE state='active' AND user_id = {$user['id']}");
		$count = count($notificationList);

		if ($count > 0)
			$result['notificationList'] = $notificationList;

		if (isset($data['lat'])) {

			//trace(array_merge($data, $user));
			(new UserModel())->UpdatePosition($user['id'], $data);

			$user['lat'] = $data['lat'];
			$user['lng'] = $data['lng'];
			Page::setSession('user', $user);			

			if (isset($data['requireDrivers']))
				$result['SuitableDrivers'] = (new DriverModel())->SuitableDrivers($data['lat'], $data['lng']);
			/*
			if (isset($data['order_id'])) {
				$order = (new OrderModel())->getItem($data['order_id']);
				if ($order && $order['driver_id']) {
					$result['driver'] = (new DriverModel())->getItem(['driver_id'=>$order['driver_id']]);
				}
			}*/

		}
		else $dbp->query("UPDATE users SET last_time = NOW() WHERE id = {$user['id']}");
		return $result;
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
			return (new RouteModel())->getItem($order['route_id']);

		if (isset($data['driver_id']))
			$data['d.id'] = $data['driver_id'];

		if ($simulate = (new SimulateModel())->getItem($data))
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

		if ($data['route_id'] && 
			($order_id = (new OrderModel())->AddOrder($data))) {

			$drivers = (new DriverModel())->SuitableDrivers();
			$countDriver = count($drivers);

			if ($countDriver > 0)
				$this->NotifyOrderToDrivers($drivers, $order_id);
		} else $order_id = 'An error was caused by update route';

		return ["result"=>$order_id];
	}

	protected function catchError($data) {
		return (new ErrorsModel())->Add($data['message'], $data['stack']);
	}

	protected function GetDriver($data) {
		return ["result"=>(new DriverModel())->getItem($data)];
	}

	protected function Go($data) {
		$route_id = (new RouteModel())->Update($data);
		return ["id"=>$route_id];
	}

	protected function SetState($data) {
		$result = (new OrderModel())->SetState($data['id'], $data['state'], @$data['driver_id']);

		$notificationModel = new NotificationModel();
		if ($result) {
			if ($data['state'] == 'accepted') {
				$driver = (new DriverModel())->getItem($data);
				$result = $result && $notificationModel->AddNotify($data['id'], 'acceptedOffer', $driver['user_id'], Lang('The offer has been accepted'));
			}
			else if ($data['state'] == 'cancel') {

				$notificationModel->SetState(['content_type'=>'pathToStart', 
					'state'=>'rejected', 'content_id'=>$data['id']]);

				$oldList = $notificationModel->NotifiedDrivers($data['id'], 'orderCreated');
				if (count($oldList) > 0) {

					$notificationModel->SetState(['content_type'=>'offerToPerform', 
						'state'=>'rejected', 'content_id'=>BaseModel::getListValues($oldList, 'content_id')]);

					$result = $result && $this->NotifyOrderToDrivers($oldList, $data['id'], 'orderCancelled', 'Order cancelled');
				}
			}
		}

		return ["result"=>$result ? 'ok' : false];
	}

	protected function NotifyOrderToDrivers($drivers, $content_id, $content_type='orderCreated', $text="Order сreated") {
		foreach ($drivers as $driver)
			(new NotificationModel())->AddNotify($content_id, $content_type, $driver['user_id'], Lang($text));

		return true;
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

	protected function getOrderProcess($data) {
		GLOBAL $user;

		$result = 'Order not found';
		$orders = (new OrderModel())->getItems(['o.user_id'=>$user['id'], 'state'=>['wait', 'accepted', 'execution', 'finished'], 'limit'=>1]);
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