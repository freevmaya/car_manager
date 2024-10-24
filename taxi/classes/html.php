<?

class html {

	public static $jscode = [];
	public static $field_id = 0;
	public static function GetFields($data, $fields=null, $group=0) {

		$fieldsList = [];

		if (!$fields) $fieldsList = array_keys($data);
		else {
			foreach ($fields as $key=>$value)
				$fieldsList[$key] = is_string($key) ? $key: $value;
		}

		$result = '';
		$groupBuffer = '';
		$i = 0;

		foreach ($fieldsList as $key) {

			$defaulField = [						// this minimal require options structure
				'name'=>$key,
				'type'=>'input',
				'label'=>lang($key)
			];

			if (isset($fields[$key])) {

				if (is_string($fields[$key]))
					$fieldOptions = array_merge($defaulField, ['name'=>$fields[$key]]);
				else $fieldOptions = array_merge($defaulField, $fields[$key]);
			}
			else $fieldOptions = $defaulField;

			$value = '';
			if (isset($data[$key]))
				$value = $data[$key];
			else if (isset($fieldOptions['indexField'])) {
				$model = new $key($data[$fieldOptions['indexField']]);
				$value = $model->getItem();
			}

			if ($group > 0) {
				$groupBuffer .= html::RenderField($fieldOptions , $value);
				$i++;

				if ($i >= $group) {
					$result .= '<div class="group">'.$groupBuffer.'</div>';
					$groupBuffer = '';
					$i=0;
				}
			} else $result .= html::RenderField($fieldOptions , $value);
		}

		if (($group > 0) && ($i > 0))
			$result .= '<div class="group">'.$groupBuffer.'</div>';

		return $result;
	}

	public static function AddJsCode($key, $code) {
		if (!isset(html::$jscode[$key]))
			html::$jscode[$key] = $code;
	}

	public static function FiledId() {
		return 'field-'.html::$field_id;
	}

	public static function RenderField($options, $value) {
		ob_start();
		include(TEMPLATES_PATH.'/fields/'.$options['type'].'.html');
		$result = ob_get_contents();
		ob_end_clean();
		html::$field_id++;
		return $result;
	}
}

?>