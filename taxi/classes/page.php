<?

define("DEFAULTPAGE", "baseForm");

function checkAndLoad($pathFile) {
	if (file_exists($pathFile)) {
    	include_once($pathFile);
    	return true;
	}

	//echo $pathFile."\n";
	return false;
}

spl_autoload_register(function ($class_name) {

	if (!checkAndLoad(MODEL_PATH.'/'.$class_name.'.php')) {

		if (!checkAndLoad(MODEL_PATH.'/'.Page::$page.'/'.$class_name.'.php')) {

	    	if (!checkAndLoad(CLASSES_PATH.'/'.$class_name.'.php')) 

	    		if (!checkAndLoad(TEMPLATES_PATH.'/'.$class_name.'.php')) {

	    			throw new Exception("Can't load class {$class_name}, request: ".print_r(Page::$request, true), 1);
	    			
	    		}
		}
    }
});

if (!function_exists('array_is_list')) {
    function array_is_list(array $arr)
    {
        if ($arr === []) {
            return true;
        }
        return array_keys($arr) === range(0, count($arr) - 1);
    }
}

$dbp;

class Page {
	protected $title = "";
	protected $scripts = [];
	protected $styles = [];
	protected $user;
	protected $model;
	public static $page;
	public static $request;
	public static $subpage;

	public static function Run($request) {
		Page::$request = $request;

		$className = 'Page';
		$page = "";
		foreach (Page::$request as $key=>$value) {
			if ($key == 'page') {
				$page = $value;
				$className = lcfirst($page);
			}
		}

		Page::$page = $page;
		Page::$subpage = isset(Page::$request['subpage']) ? Page::$request['subpage'] : null;
		$pageObject = new $className();
		$pageObject->Render($page.(Page::$subpage ? ('/'.Page::$subpage) : ''));
		$pageObject->Close();
	}

	public function __construct() {
		GLOBAL $lang, $defUser, $dbp;
		$dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);

		if (isset(Page::$request['username']))
			$this->setUser(Page::$request);
		else if ($this->getSession('user'))
			$this->user = $this->getSession('user');
		else if (isset($defUser)) 
			$this->setUser(json_decode($defUser, true));

		if ($this->user) {
			$language = $this->user['language_code'];
		} else $language = 'en';
		
		include_once(BASEDIR.'/languages/'.$language.'.php');

		if ($this->user)
			$this->model = $this->initModel();
	}

	protected function initModel() {

	}

	protected static function link($params) {
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

	protected function setUser($data) {
		GLOBAL $dbp;
		if (!$this->getSession('user'))
			$this->setSession('user', $this->user = $data);
		
		if ($set = isset($this->user['id'])) {
			$dbp->query("UPDATE users SET last_time = NOW() WHERE id = {$this->user['id']}");
			$this->user['asDriver'] = $dbp->line("SELECT * FROM driverOnTheLine WHERE user_id={$this->user['id']} AND active=1");
		}

		return ["result"=>$set ? "ok" : "fail", 'asDriver' => @$this->user['asDriver']];
	}

	protected function getPage() {

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
		GLOBAL $dbp;
		$dbp->Close();
	}

	protected function getContent($contentLink) {
		$content = "";
		$templateFile = TEMPLATES_PATH.'/'."{$contentLink}.php";
		if (file_exists($templateFile))
			$content = $this->RenderContent($templateFile);
		else $content = $this->RenderContent(TEMPLATES_PATH.'/'.DEFAULTPAGE.".php");

		return $content;
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