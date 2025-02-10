<?	
include_once(TEMPLATES_PATH.'/toolbar.php');

if ($this->asDriver())
	include_once(TEMPLATES_PATH.'/driver/begin.php');
else include_once(TEMPLATES_PATH.'/passenger/begin.php');