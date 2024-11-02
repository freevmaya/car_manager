
<pre>
<?

	/*
	$url = "colors.html";
	$patterns = ['/<tr[\s\w=\"]+>[\s]+<td[\s\w=\"]+>([\w\s]+)<\/td>[\s]+<td>([\w\d#]+)<\/td>/'];
	$fieldsAll = [['name', 'rgb']];
	*/

	$table = 'car_producer';
	$url = "auto_brands.html";
	$patterns = ['/background-image:[\s]*url\(\'([\d\w\/:=\.-]*)\'\);"[\s]aria-label="([\w\s\d-]*)"/'];
	$fieldsAll = [['logo', 'name']];//, 'name', 'years', 'country'];

	error_reporting(E_ALL);
	$content = str_replace("\n", '', file_get_contents($url));

	$result = [];


	echo phpversion()."\n";
	foreach ($patterns as $i=>$reg) {
		echo strlen($content)." ".preg_match_all($reg, $content, $list)."\n";

		$fields = $fieldsAll[$i];
		$result[$i] = [];

		//echo 'INSERT INTO [table name] (`'.implode('`, `', $fields)."`) VALUES\n";
		for ($i=0; $i<count($list[0]); $i++) {
			$line = [];
			for ($n=0; $n<count($fields); $n++)
				$line[$fields[$n]] = $list[$n + 1][$i];

			$result[$i][] = $line;
			//echo "('".implode("','", $line)."'),\n";
		}
	}

	foreach ($result as $items) {
		$fields = [];
		foreach ($items as $item) {
			foreach ($item as $field=>$value)
				$fields[] = $field;
		}		
		echo "INSERT INTO {$table} (`".implode("`,`", $fields)."`) VALUES ";
		break;
	}

	foreach ($result as $items) {
		$values = [];
		foreach ($items as $item) {
			foreach ($item as $field=>$value)
				$values[] = $value;

		}
		echo "('".implode("','", $values)."'),\n";
	}
?>
</pre>