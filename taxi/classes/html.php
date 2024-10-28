<?

class html {
	public static $scripts = [];
	public static $styles = [];
	public static $jscode = [];
	public static $field_id = 0;
	protected static $autoKey = 0;

	public static function GetFields($data, $fieldsOrModel=null, $group=0) {

		$fieldsList = [];
		$nameModel = null;
		$result = '';

		//print_r($data);

		if ($fieldsOrModel instanceof BaseModel) {
			$nameModel = get_class($fieldsOrModel);
			$fields = $fieldsOrModel->getFields();
		} else $fields = $fieldsOrModel;

		if ($fields) {

			if (!$fields) $fieldsList = array_keys($data);
			else {
				foreach ($fields as $key=>$value)
					$fieldsList[$key] = is_string($key) ? $key: $value;
			}
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
				if (isset($fieldOptions['model'])) {

					$model = new $fieldOptions['model']();
					$value = ['items' => $model->getItems($fieldOptions)];
					if (isset($data[$key])) {
						$item = $model->getItem($data[$key]);
						$value['item'] = $item ? $item : @$fieldOptions['default'];
					} else $value['item'] = @$fieldOptions['default'];

				} else
					$value = isset($data[$key]) ? $data[$key] : @$fieldOptions['default'];

				if ($group > 0) {
					$groupBuffer .= html::RenderField($fieldOptions , $value, $nameModel);
					$i++;

					if ($i >= $group) {
						$result .= '<div class="group">'.$groupBuffer.'</div>';
						$groupBuffer = '';
						$i=0;
					}
				} else $result .= html::RenderField($fieldOptions , $value, $nameModel);
			}

			if (($group > 0) && ($i > 0))
				$result .= '<div class="group">'.$groupBuffer.'</div>';
		}

		return $result;
	}

	public static function AddJsCode($code, $key=null) {
		if (!$key) {
			html::$jscode[html::$autoKey] = $code;
			html::$autoKey++;
		}
		else if (!isset(html::$jscode[$key]))
			html::$jscode[$key] = $code;
	}

	public static function AddScriptFile($fileName) {
		if (!in_array($fileName, html::$scripts))
			html::$scripts[] = $fileName;
	}

	public static function AddStyleFile($fileName) {
		if (!in_array($fileName, html::$styles))
			html::$styles[] = $fileName;
	}

	public static function FiledId() {
		return 'field-'.html::$field_id;
	}

	protected static function addValidator($validator, $options, $nameModel) {
		html::AddScriptFile('validator.js');

		if (is_array($validator)) {
			foreach ($validator as $v)
				html::AddJsCode('validator.add(new '.$v."Validator('{$options['name']}', '{$nameModel}'));\n");
		} else html::AddJsCode('validator.add(new '.$validator."Validator('{$options['name']}', '{$nameModel}'));\n");
	}

	public static function RenderField($options, $value, $nameModel=null) {
		$fileName = TEMPLATES_PATH.'/fields/'.$options['type'].'.php';

		if (file_exists($fileName)) {
			ob_start();
			include($fileName);
			$result = ob_get_contents();
			ob_end_clean();

			if (isset($options['validator']) && $nameModel)
				html::addValidator($options['validator'], $options, $nameModel);

			html::$field_id++;
		} else $result = "File {$fileName} not found";
		return $result;
	}
}

?>