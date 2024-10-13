<?
class User {
	protected $dbp;
	protected $data;
	public function __construct($dbp, $request) {
		$this->dbp = $dbp;
		$this->data = $request;
		$this->checkRecord();
	}

	protected function checkRecord() {
		if (!($line = $this->dbp->line("SELECT * FROM users WHERE id={$this->data['id']}"))) {
			$this->dbp->query("INSERT INTO users (`id`, `first_name`, `last_name`, `username`, `language`, `create_date`, `last_time`) VALUES ({$this->data['id']}, '{$this->data['first_name']}', '{$this->data['last_name']}', '{$this->data['username']}', '{$this->data['language_code']}', NOW(), NOW())");
		}
	}
}
?>