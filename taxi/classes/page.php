<?

define("DEFAULTPAGE", "begin");

class Page {
	protected $title = "";
	protected $request;
	protected $scripts = [];
	protected $user;

	public function __construct($request) {
		$this->request = $request;
		$this->user = isset($devUser) ? json_decode($devUser) : null;
	}

	protected function getCurrentPage() {
		foreach ($this->request as $key=>$value) {
			if (empty($value))
				return $key;
		}

		return DEFAULTPAGE;
	}

	public function Render() {
		GLOBAL $anti_cache;
		$page = $this->getCurrentPage();

		if ($page == "ajax") {
			header("Content-Type: application/json; charset=".CHARSET);
			include(TEMPLATES_PATH."{$page}.php");
		}
		else {
			header("Content-Type: text/html; charset=".CHARSET);
			$content = $this->getContent($page);
			include(TEMPLATES_PATH."index.php");
		}
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

	public function ajax() {
		if ($this->request['event'])
			switch ($this->request['event']) {
				case "checkState": 
					return ["event"=>"moveDrive"];
					break;
			}
		return $this->request;
	}
}
?>