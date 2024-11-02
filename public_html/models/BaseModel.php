<?
abstract class BaseModel {
	abstract protected function getTable();
	public function Update($values) {}
	public function getItem($id) {}
	public function getItems($options) { return []; }
	public function getFields() {return [];}
	public function checkUnique($data) { return false; }
	public function getTitle() { return Lang(get_class($this)); }

	public static function AddWhere($whereList, $options, $paramName, $operand = '=') {
		$optionCondition = '';
		if (isset($options[$paramName])) {
			if (is_array($options[$paramName]))
				$optionCondition = "`{$paramName}` IN ('".implode("','", $options[$paramName])."')";
			else $optionCondition = "`{$paramName}` {$operand} '{$options[$paramName]}'";
		}
		if ($optionCondition) $whereList[] = $optionCondition;
		return $whereList;
	}

	public static function getValues($values, $fields, $defaults) {
		$result = [];
		foreach ($fields as $i=>$field) {
			$v = isset($values[$field]) ? $values[$field] : $defaults[$i];
			if (is_object($v) || is_array($v))
				$v = json_encode($v);
			$result[] = $v;
		}
		return $result;
	}
}
?>