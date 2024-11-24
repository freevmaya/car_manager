<?
class NotificationModel extends BaseModel {

	private $callbacks;
	public function __construct() {
		$this->callbacks = [];
	}

	protected function getTable() {
		return 'notifications';
	}

	public function SetState($options) {
		GLOBAL $dbp;

		$where = BaseModel::AddWhere(BaseModel::AddWhere(BaseModel::AddWhere([], 
					$options, 'content_type'),
					$options, 'content_id'),
					$options, 'id');

		$whereStr = implode(" AND ", $where);
		return $dbp->query("UPDATE notifications SET state = '{$options['state']}' WHERE $whereStr");
	}

	public function getActiveOffers($user_id) {
		GLOBAL $dbp;
		return $this->getItems(['user_id'=>$user_id, 'content_type'=>'offerToPerform', 'state'=>'active']);
	}

	public function getItems($options) {
		GLOBAL $dbp, $user;

		$where = BaseModel::AddWhere(BaseModel::AddWhere(BaseModel::AddWhere([],
						$options, 'content_type'),
						$options, 'state'), 
						$options, 'user_id');
		
		$whereStr = implode(" AND ", $where);

		$query = "SELECT * FROM {$this->getTable()} WHERE $whereStr";

		$notificationList = $dbp->asArray($query);
		$count = count($notificationList);

		if ($count > 0) {

			$orderModel = new OrderModel();

			for ($i=0;$i<$count;$i++) {

				$ct = $notificationList[$i]['content_type'];
				if (($ct == 'orderCreated') || ($ct == 'orderCancelled'))
					$notificationList[$i]['content'] = $orderModel->getItem($notificationList[$i]['content_id']);
			}
			
		}


		return $notificationList;
	}

	public function getOffers($user_id, $notify_id=false) {
		GLOBAL $dbp;
		$whereStr = "o.state = 'wait' AND n.`content_type` = 'offerToPerform' AND n.`state` IN ('active', 'receive', 'read') AND d.active = 1";
		if ($notify_id)
			$whereStr .= ' AND n.id = '.$notify_id;
		else $whereStr .= " AND n.`user_id`={$user_id}";

		$query = "SELECT n.*, d.*, u.first_name, u.last_name, u.username, c.*, cb.symbol, cc.* ".
				"FROM {$this->getTable()} n ".
				"INNER JOIN `orders` o ON o.id = n.content_id ".
				"INNER JOIN `driverOnTheLine` d ON n.offered_driver_id = d.id ".
				"INNER JOIN `users` u ON d.user_id = u.id ".
				"INNER JOIN `car` c ON c.id = d.car_id ".
				"INNER JOIN `car_bodies` cb ON c.car_body_id=cb.id ".
				"INNER JOIN `car_color` cc ON c.color_id=cc.id WHERE $whereStr";

		return $dbp->asArray($query);
	}

	public function getOffersByOrder($order_id) {
		GLOBAL $dbp;
		$whereStr = "n.`content_type` = 'offerToPerform' AND n.`state` IN ('active', 'receive', 'read') AND d.active = 1 AND n.content_id = {$order_id}";


		$query = "SELECT n.*, d.*, u.first_name, u.last_name, u.username, c.*, cb.symbol, cc.* FROM {$this->getTable()} n INNER JOIN `driverOnTheLine` d ON n.offered_driver_id = d.id INNER JOIN `users` u ON d.user_id = u.id INNER JOIN `car` c ON c.id = d.car_id INNER JOIN `car_bodies` cb ON c.car_body_id=cb.id INNER JOIN `car_color` cc ON c.color_id=cc.id WHERE $whereStr";

		return $dbp->asArray($query);
	}

	public function NotifiedDrivers($content_id, $content_type) {
		GLOBAL $dbp;

		$query = "SELECT user_id, content_id FROM {$this->getTable()} WHERE `content_id`={$content_id} AND content_type='{$content_type}'";
		return $dbp->asArray($query);

	}

	public function AddNotify($content_id, $content_type, $user_id, $text='', $offered_driver_id=null) {
		GLOBAL $dbp;
		$result = false;
		if ($offered_driver_id) {
			$query = "INSERT INTO {$this->getTable()} (`content_id`, `content_type`, `user_id`, `text`, `offered_driver_id`) VALUES (?, ?, ?, ?, ?)";
			$result = $dbp->bquery($query, 'isisi', [$content_id, $content_type, $user_id, $text, $offered_driver_id]);
		} else {
			$query = "INSERT INTO {$this->getTable()} (`content_id`, `content_type`, `user_id`, `text`) VALUES (?, ?, ?, ?)";
			$result = $dbp->bquery($query, 'isis', [$content_id, $content_type, $user_id, $text]);
		}
		return $result;
	}

	public function checkReply($user_id) {

		$replyList = $this->getItems(['content_type'=>'replyData', 'state'=>'active', 'user_id'=>$user_id]);

		for ($i=0; $i<count($replyList); $i++) {

			$reply 	= $replyList[$i];
			$id 	= $reply['id'];

			if (isset($this->callbacks[$id])) {
				$this->callbacks[$id](json_decode($reply['text']));
				unset($this->callbacks[$id]);
			}

			$this->SetState(['id'=>$id, 'state'=>'read']);
		}
	}

	public function getData($content_id, $user_id, $request, $callback) {
		GLOBAL $dbp;

		if (count($this->getItems(['content_type'=>'requestData', 'state'=>'active', 'user_id'=>$user_id])) == 0) {
			$this->AddNotify($content_id, 'requestData', $user_id, is_array($request) ? json_encode($request) : $request);
			$this->callbacks[$dbp->lastID()] = $callback;
		}
	}
}