<?
	if ($this->user)
		include_once(TEMPLATES_PATH.'/toolbar.php');
	else include_once(TEMPLATES_PATH.'/login.php');
?>