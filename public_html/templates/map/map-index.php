<?
html::AddScriptFiles([
	"jquery-dateformat.min.js",
	"color.js",
	"map.js",
	"views.js",
	"tracer.js",
	'driver-manager.js',
	"https://code.jquery.com/ui/1.14.0/jquery-ui.js"
]);

html::AddStyleFile('https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css');
?>

<div id="windows"></div>
<?=html::RenderField(['type'=>'map', 'id'=>"map"], 'map')?>