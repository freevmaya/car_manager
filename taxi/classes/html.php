<?

class html {
	public static function GetFields($data, $fields=null) {
		if (!$fields) $fields = array_keys($data);

		$result = '';
		foreach ($fields as $key)
			$result .= html::GetField($key, $data[$key], 'input');

		return $result;
	}

	public static function GetField($name, $value, $type) {
		
		return '<input type="text" value="'.$value.'"></input>'."\n";
	}

	public static function RenderContent($templateFile) {
		ob_start();
		include($templateFile);
		$result = ob_get_contents();
		ob_end_clean();
		return $result;
	}
}

?>