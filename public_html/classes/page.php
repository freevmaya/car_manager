<?

$user;

class Page {
	protected $title = "";
	protected $model;

	private $asDriver = -1;
	private $haveActiveOrder = -1;

	public static $current;
	public static $page;
	public static $request;
	public static $subpage;

	public static function Run($request) {
		Page::$request = $request;

		$className = 'Page';
		$page = null;
		$subpage = null;

		foreach (Page::$request as $key=>$value) {
			if ($key == 'page') {
				$page = $value;
				$classFileName = dirname(__FILE__).'/'.$page.'.php';

				if (file_exists($classFileName)) {
					$className = lcfirst($page);
					include($classFileName);
				}
			}

			if ($key == 'subpage') {
				if (is_numeric($value))
					Page::$request['id'] = $value;
				else {
					$subpage = $value;

					$classFileName = dirname(__FILE__).'/'.$page.'/'.$subpage.'.php';

					if (file_exists($classFileName)) {
						$className = lcfirst($subpage);
						include($classFileName);
					}
				}
			}
		}

		Page::$page = $page;
		Page::$subpage = $subpage;

		$page = new $className();
		$page->Render(Page::$page.(Page::$subpage ? ('/'.Page::$subpage) : ''));
		$page->Close();
	}

	public function __construct() {
		GLOBAL $lang, $dbp, $_GET, $user;

		Page::$current = $this;
		$dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);

		if (DEV) {
			//print_r($_SERVER['HTTP_USER_AGENT']);

			$user = json_decode(DEVUSER, true);
			$this->setUser($user);

			//print_r($user);
		} else {
			if (isset($_GET['username']))
				$this->setUser($_GET);
			else if (Page::getSession('user')) {
				$user = Page::getSession('user');
				if (!isset($user['id'])) {
					if (DEVUSER)
						$this->setUser($user = array_merge(json_decode(DEVUSER, true), $user));
				}
				if (!is_array($db_user = (new UserModel())->getItem($user['id']))) {
					$this->setUser($user);
					//trace($user['id']);
				}
			}
			else if (DEVUSER) 
				$this->setUser(json_decode(DEVUSER, true));
		}
		//exit;

		if ($user) {
			if ($userDB = (new UserModel())->getItem($user['id']))
				$user = array_merge($user, $userDB);
			$language = $user['language_code'];
		} else die("There isn't authorize");
		
		include_once(BASEDIR.'/languages/'.$language.'.php');

		$this->model = $this->initModel();

		if ($this->model && $this->isReciveData()) {
			if ($this->requiestIdModel(Page::$request['form-request-id']) == get_class($this->model)) {
				$this->requiestRemove(Page::$request['form-request-id']);
				$this->model->Update(Page::$request);
			}
		}
	}

	protected function isReciveData() {
		return isset(Page::$request['form-request-id']);
	}

	protected function initModel() {
	}

	public function asDriver() {
		GLOBAL $user;
		
		if ($this->asDriver == -1) {
			$driverOnTheLine = (new DriverModel())->getItem(['user_id'=>$user['id']]);
			if ($driverOnTheLine && ($driverOnTheLine['active'] > 0))
				$this->asDriver = $driverOnTheLine['id'];
			else $this->asDriver = 0;
		}

		return $this->asDriver;
	}

	public function haveActiveOrder() {
		GLOBAL $user;

		if ($this->haveActiveOrder == -1) {
			if ((new OrderModel())->haveActiveOrder($user['id']))
				$this->haveActiveOrder = 1;
			else $this->haveActiveOrder = 0;
		}

		return $this->haveActiveOrder > 0;
	}

	public function sendCoordinates() {
		return $this->asDriver() || $this->haveActiveOrder();
	}

	public static function link($params = null) {
		$result = BASEURL;
		if ($params) {
			if (is_string($params))
				return $result.'/'.$params;

			for ($i=0; $i<count($params); $i++)
				$result .= '/'.$params[$i];
		}
		return $result;
	} 

	protected static function currentURL() {
		return BASEURL.'/'.Page::$page.(Page::$subpage ? ('/'.Page::$subpage) : '');
	}

	protected function requiestRemove($requestId) {
		if ($requestIds = Page::getSession('requestIds')) {
			foreach ($requestIds as $model=>$value)
				if ($value == $requestId) {
					unset($requestIds[$model]);
					Page::setSession('requestIds', $requestIds);
					break;
				}
		}
	}

	protected function requiestIdModel($requestId) {
		if ($requestId && ($requestIds = Page::getSession('requestIds'))) {
			foreach ($requestIds as $model=>$value)
				if ($value == $requestId)
					return $model;
		}
		return false;
	}

	protected function createRequestId($classModel) {

		if (!$requestIds = Page::getSession('requestIds'))
			$requestIds = [];

		if (!isset($requestIds[$classModel])) {
			$requestIds[$classModel] = getGUID();
			Page::setSession('requestIds', $requestIds);
		}

		return $requestIds[$classModel];
	}

	public function getUser() {
		GLOBAL $user;
		return $user;
	}

	protected function setUser($data) {
		GLOBAL $dbp, $user;
		if (!Page::getSession('user'))
			Page::setSession('user', $user = $data);

		if ($set = isset($user['id'])) {
			$userModel = new UserModel();
			$item = $userModel->getItem($user['id']);
			
			if ($item) {
				$dbp->query("UPDATE users SET last_time = NOW() WHERE id = {$user['id']}");
			} else {
				$query = "INSERT INTO users (`id`, `first_name`, `last_name`, `username`, `language_code`, `create_date`, `last_time`) VALUES ({$user['id']}, '{$user['first_name']}', '{$user['last_name']}', '{$user['username']}', '{$user['language_code']}', NOW(), NOW())";
				$dbp->query($query);
			}
		}

		return ["result"=>$set ? "ok" : "fail", 'asDriver' => $this->asDriver()];
	}

	protected function getPage() {

	}

	public static function setSession($name, $value = null) {
		GLOBAL $_SESSION;
		$_SESSION[$name] = $value;
	}

	public static function getSession($name) {
		GLOBAL $_SESSION;
		return isset($_SESSION[$name]) ? $_SESSION[$name] : null;
	}

	public function colorSheme($defaultValue = null) {

		$sheme = Page::getSession('color-sheme');
		if (is_null($sheme))
			Page::setSession('color-sheme', $sheme = $defaultValue);

		return $sheme;
	}

	public function Render($page) {
		header("Content-Type: text/html; charset=".CHARSET);
		$content = $this->getContent($page);
		include(TEMPLATES_PATH.'/'."index.php");
	}

	public function Close() {
		GLOBAL $dbp;
		$dbp->Close();
	}

	protected function getContent($contentLink) {
		$content = "";
		$templateFile = TEMPLATES_PATH.'/'."{$contentLink}.php";
		if (file_exists($templateFile)) {
			$content = $this->RenderContent($templateFile);
		}
		else {
			if ($this->model)
				$content = $this->RenderContent(TEMPLATES_PATH.'/'.DEFAULTFORM.".php");
			else $content = $this->RenderContent(TEMPLATES_PATH.'/'.DEFAULTPAGE.".php");
		}

		return $content;
	}

	public function getId() {
		return isset(Page::$request['id']) ? Page::$request['id'] : 0;
	}

	protected function RenderContent($templateFile) {
		GLOBAL $dbp, $user;
		ob_start();
		include($templateFile);
		$result = ob_get_contents();
		ob_end_clean();
		return $result;
	}
}
?>