<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');
    
	html::AddJsCode("new VMap($('#map'));");
?>
