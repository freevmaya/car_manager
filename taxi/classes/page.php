<?

class Page {
	protected $title = "";
	protected $styles = [];
	protected $user;
	protected $model;
	protected $dataId;
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
				$subpage = $value;
				$classFileName = dirname(__FILE__).'/'.$page.'/'.$subpage.'.php';

				if (file_exists($classFileName)) {
					$className = lcfirst($subpage);
					include($classFileName);
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
		GLOBAL $lang, $defUser, $dbp, $_GET;

		Page::$current = $this;
		$dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);

		if (isset($_GET['username']))
			$this->setUser($_GET);
		else if (Page::getSession('user'))
			$this->user = Page::getSession('user');
		else if (isset($defUser)) 
			$this->setUser(json_decode($defUser, true));

		if ($this->user) {
			$language = $this->user['language_code'];
		} else $language = 'en';
		
		include_once(BASEDIR.'/languages/'.$language.'.php');

		if ($this->user) {

			$this->dataId = $this->user['id'];
			$this->model = $this->initModel();

			if ($this->model && isset(Page::$request['form-request-id'])) {
				if ($this->requiestIdModel(Page::$request['form-request-id']) == get_class($this->model)) {
					$this->requiestRemove(Page::$request['form-request-id']);
					$this->model->Update(Page::$request);
				}
			}
		}
	}

	protected function initModel() {

	}

	public static function link($params) {
		$result = BASEURL;
		if (is_string($params))
			return $result.'/'.$params;

		for ($i=0; $i<count($params); $i++)
			$result .= '/'.$params[$i];
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
		return $this->user;
	}

	protected function setUser($data) {
		GLOBAL $dbp;
		if (!Page::getSession('user'))
			Page::setSession('user', $this->user = $data);
		
		if ($set = isset($this->user['id'])) {
			$dbp->query("UPDATE users SET last_time = NOW() WHERE id = {$this->user['id']}");
			$this->user['asDriver'] = $dbp->line("SELECT * FROM driverOnTheLine WHERE user_id={$this->user['id']} AND active=1");
		}

		return ["result"=>$set ? "ok" : "fail", 'asDriver' => @$this->user['asDriver']];
	}

	protected function getPage() {

	}

	protected static function setSession($name, $value = null) {
		GLOBAL $_SESSION;
		$_SESSION[$name] = $value;
	}

	protected static function getSession($name) {
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
		return $this->dataId;
	}

	protected function RenderContent($templateFile) {
		GLOBAL $dbp;
		ob_start();
		include($templateFile);
		$result = ob_get_contents();
		ob_end_clean();
		return $result;
	}
}
?>