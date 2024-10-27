<?
abstract class BaseModel {
	abstract protected function getTable();
	public function Update($values) {}
	public function getItem($id) {}
	public function getItems($options) { return []; }
	public function getFields() {return [];}
	public function checkUnique($data) { return false; }
	public function getTitle() { return Lang(get_class($this)); }
}
?>