<?

abstract class BaseModel {
	abstract protected function getTable();
	public function getFields() {return [];}
	public function checkUnique($data) { return false; }
	public function getTitle() { return Lang(get_class($this)); }

	public function Update($values) {
		GLOBAL $dbp;
		$types = $this->dbTypes(array_keys($values));

		$id = isset($values['id']) ? $values['id'] : null;

		$values = $this->allowUpdateValues($values );

		if ($id)
			return $dbp->bquery($this->updateQuery($id, $values), $types, array_values($values));
		else 
			return $dbp->bquery($this->insertQuery($values), $types, array_values($values));
	}

	protected function allowUpdateValues($values) {
		$fields = $this->getFields();
		$result = [];
		foreach ($values as $field=>$value)
			if (isset($fields[$field]) && isset($fields[$field]['dbtype']))
				$result[$field] = $value;

		return $result;
	}

	protected function updateQuery($id, $values) {

		$updateList = [];
		foreach($this->getFields() as $fieldName=>$field)
			if (($fieldName != 'id') && isset($values[$fieldName]))
				$updateList[] = "`{$fieldName}`=?";

		return "UPDATE `{$this->getTable()}` SET ".implode(',', $updateList)." WHERE id={$id}";
	}

	protected function insertQuery($values) {
		unset($values['id']);

		$fieldList = array_keys($values);
		$valuesList = [];
		foreach($fieldList as $fieldName) $valuesList[] = '?';

		return "INSERT INTO {$this->getTable()} (".implode(',', $fieldList).") VALUES (".implode(',', $valuesList).")";
	}

	protected function dbTypes($fieldsList)
	{
		$fields = $this->getFields();
		$types = '';
		foreach ($fieldsList as $field)
			if (($field != 'id') and isset($fields[$field]))
				$types .= isset($fields[$field]['dbtype']) ? $fields[$field]['dbtype'] : 's';

		return $types;
	}

	public function getItems($options) {
		GLOBAL $dbp;
		return $dbp->asArray("SELECT * FROM {$this->getTable()}");
	}

	public function getItem($id) {		
		GLOBAL $dbp;
		return $id ? $dbp->line("SELECT * FROM {$this->getTable()} WHERE id={$id}") : null;
	}

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

	public static  function GetConditions($values, $paramsNames, $operand = '=') {
		$list = [];
		foreach ($paramsNames as $key=>$param)
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
			if (isset($item[$field]))
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
			} else trace_error('Field '.$idpos.' not found');
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