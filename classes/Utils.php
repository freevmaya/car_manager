<?
	function Lang($strIndex) {
		GLOBAL $lang;
		if (isset($lang[$strIndex]))
			return $lang[$strIndex];
		return $strIndex;
	}
?>