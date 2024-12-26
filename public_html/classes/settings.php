<?
class Settings extends Page {

	private $driver;
	protected function initModel() {

		if (Page::$subpage == 'user')
			return new UserModel();

		return null;
	}

	public function getId() {
		GLOBAL $user;
		if (Page::$subpage == 'user')
			return $user['id'];
	}
}
?>