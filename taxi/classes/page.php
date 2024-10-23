<?

define("DEFAULTPAGE", "begin");

spl_autoload_register(function ($class_name) {
	$pathFile = MODEL_PATH.'/'.$class_name.'.php';
	if (file_exists($pathFile))
    	include_once($pathFile);
    else {
    	$pathFile = CLASSES_PATH.'/'.$class_name.'.php';
    	if (file_exists($pathFile))
    		include_once($pathFile);
    	else {
	    	$pathFile = TEMPLATES_PATH.'/'.$class_name.'.php';
	    	if (file_exists($pathFile))
	    		include_once($pathFile);
	    }
    }
});

class Page {
	protected $title = "";
	protected $request;
	protected $scripts = [];
	protected $styles = [];
	protected $user;
	protected $dbp;
	protected $model;

	public function __construct($request) {
		GLOBAL $lang, $defUser;
		$this->dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);
		$this->request = $request;

		if (isset($this->request['username']))
			$this->setUser($this->request);
		else if ($this->getSession('user'))
			$this->user = $this->getSession('user');
		else if (isset($defUser)) 
			$this->setUser(json_decode($defUser, true));

		if ($this->user) {
			$language = $this->user['language_code'];
		} else $language = 'en';
		
		include_once(BASEDIR.'/languages/'.$language.'.php');

		if ($this->user)
			$this->model = $this->initModel($this->dbp, $this->user);
	}

	protected function initModel($dbp, $user) {

	}

	protected function setUser($data) {
		if (!$this->getSession('user'))
			$this->setSession('user', $this->user = $data);
		
		if ($set = isset($this->user['id'])) {
			$this->dbp->query("UPDATE users SET last_time = NOW() WHERE id = {$this->user['id']}");
			$this->user['asDriver'] = $this->dbp->line("SELECT * FROM driverOnTheLine WHERE user_id={$this->user['id']} AND active=1");
		}

		return ["result"=>$set ? "ok" : "fail", 'asDriver' => @$this->user['asDriver']];
	}

	public static function Run($request) {

		$className = 'Page';
		$page = "";
		foreach ($request as $key=>$value) {
			if (empty($value)) {
				$page = $key;
				$classFileName = dirname(__FILE__).'/'.$page.'.php';

				if (file_exists($classFileName)) {
					$className = lcfirst($page);
					include($classFileName);
				}
			}
		}

		$pageObject = new $className($request);
		$pageObject->Render($page);
		$pageObject->Close();
	}

	protected function setSession($name, $value = null) {
		GLOBAL $_SESSION;
		$_SESSION[$name] = $value;
	}

	protected function getSession($name) {
		GLOBAL $_SESSION;
		return isset($_SESSION[$name]) ? $_SESSION[$name] : null;
	}

	public function colorSheme($defaultValue = null) {

		$sheme = $this->getSession('color-sheme');
		if (is_null($sheme))
			$this->setSession('color-sheme', $sheme = $defaultValue);

		return $sheme;
	}

	public function Render($page) {
		header("Content-Type: text/html; charset=".CHARSET);
		$content = $this->getContent($page);
		include(TEMPLATES_PATH.'/'."index.php");
	}

	public function Close() {
		$this->dbp->Close();
	}

	protected function getContent($contentLink) {
		$content = "";
		$templateFile = TEMPLATES_PATH.'/'."{$contentLink}.php";
		if (file_exists($templateFile))
			$content = html::RenderContent($templateFile);
		else $content = html::RenderContent(TEMPLATES_PATH.'/'.DEFAULTPAGE.".php");

		return $content;
	}
}
?>