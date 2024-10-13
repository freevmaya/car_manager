<?

define("DEFAULTPAGE", "begin");

class Page {
	protected $title = "";
	protected $request;
	protected $scripts = [];

	public function __construct($request) {
		$this->request = $request;
	}

	protected function getCurrentPage() {
		foreach ($this->request as $key=>$value) {
			if (empty($value))
				return $key;
		}

		return DEFAULTPAGE;
	}

	public function Render($template = "index") {

		$content = $this->getContent($this->getCurrentPage());
		include(TEMPLATES_PATH."{$template}.php");
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