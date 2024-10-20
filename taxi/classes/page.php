<?

define("DEFAULTPAGE", "begin");

class Page {
	protected $title = "";
	protected $request;
	protected $scripts = [];
	protected $styles = [];
	protected $user;
	protected $dbp;

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

	public function __construct($request) {
		GLOBAL $_SESSION, $lang;
		$this->dbp = new mySQLProvider('localhost', _dbname_default, _dbuser, _dbpassword);
		$this->request = $request;

		if (isset($_SESSION['user'])) {
			$this->user = $_SESSION['user'];
			$language = $this->user['language_code'];
		} else $language = 'en';
		
		include_once(BASEDIR.'/languages/'.$language.'.php');

//		$this->user = isset($defUser) ? json_decode($defUser) : null;
	}

	public function Render($page) {
		header("Content-Type: text/html; charset=".CHARSET);
		$content = $this->getContent($page);
		include(TEMPLATES_PATH."index.php");
	}

	public function Close() {
		$this->dbp->Close();
	}

	protected function getContent($contentLink) {
		$content = "";
		$templateFile = TEMPLATES_PATH."{$contentLink}.php";
		if (file_exists($templateFile))
			$content = $this->RenderContent($templateFile);
		else $content = $this->RenderContent(TEMPLATES_PATH.DEFAULTPAGE.".php");

		return $content;
	}

	protected function RenderContent($templateFile) {
		ob_start();
		include($templateFile);
		$result = ob_get_contents();
		ob_end_clean();
		return $result;
	}
}
?>