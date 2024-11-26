<?
abstract class BaseModel {
	abstract protected function getTable();
	public function Update($values) {}
	public function getItem($id) {}
	public function getItems($options) { return []; }
	public function getFields() {return [];}
	public function checkUnique($data) { return false; }
	public function getTitle() { return Lang(get_class($this)); }

	public static  function AddWhere($whereList, $options, $paramName, $operand = '=') {
		$optionCondition = '';
		if (isset($options[$paramName])) {
			if (is_array($options[$paramName]))
				$optionCondition = "{$paramName} IN ('".implode("','", $options[$paramName])."')";
			else $optionCondition = "{$paramName} {$operand} '{$options[$paramName]}'";
		}
		if ($optionCondition) $whereList[] = $optionCondition;
		return $whereList;
	}

	public static  function GetConditions($values, $paramsName, $operand = '=') {
		$list = [];
		foreach ($paramsName as $key=>$param)
			$list = BaseModel::AddWhere($list, $values, $param, $operand);

		return $list;
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

	public static function getListValues($items, $field) {
		$result = [];

		foreach ($items as $item)
			$result[] = $item[$field];

		return array_unique($result);
	}

	public static function FullItem($item, $models) {

		foreach ($models as $key=>$model) {
			$idpos = strpos($key, '_id');
			if ($idpos > -1) {
				$outfield = substr($key, 0, $idpos);
				if (@$item[$key])
					$item[$outfield] = $model->getItem($item[$key]);
			}
		}

		return $item;
	}

	public static function FullItems($items, $models) {
		for ($i=0; $i<count($items); $i++)
			$items[$i] = BaseModel::FullItem($items[$i], $models);

		return $items;
	}
}
?>