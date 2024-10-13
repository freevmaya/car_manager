<?
class BaseController {

	protected $request;
	protected $language;
	protected $dbp;
	protected $user;

	public function __construct($dbp, $request, $user) {
		$this->dbp = $dbp;
		$this->request = $request;
		$this->language = $this->getc('language', 'en');
		$this->user  = $user;
		include(BASEDIR."/languages/{$this->language}.php");
	}

	public function get($session_var, $default) {
		return isset($_SESSION[$session_var]) ? $_SESSION[$session_var] : $default;
	}

	public function set($session_var, $value) {
		$_SESSION[$session_var] = $value;
	}

	public function getc($cook_var, $default) {
		return isset($_COOKIE[$cook_var]) ? $_COOKIE[$cook_var] : $default;
	}

	public function setc($cook_var, $value) {
		$_COOKIE[$cook_var] = $value;
	}
}
?>