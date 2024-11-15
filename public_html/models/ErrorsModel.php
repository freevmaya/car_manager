<?
class ErrorsModel extends BaseModel {
	
	protected function getTable() {
		return 'errors';
	}

	public function Add($message, $stack, $type = 'js') {
		GLOBAL $dbp;

		return $dbp->bquery("INSERT {$this->getTable()} (`type`, `message`, `stack`) VALUES (?, ?, ?)", 
				'sss', 
				[$type, $message, $stack]);
	}
}
?>