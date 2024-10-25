<?
class BaseModel {

	public function Update($values) {}
	public function getItem($id) {}
	public function getFields() {return [];}
	public function checkUnique($data) { return true; }
	public function getTitle() { return Lang(get_class($this)); }
}
?>