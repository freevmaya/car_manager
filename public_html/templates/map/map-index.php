<?

html::AddScriptFiles([
	"jquery-dateformat.min.js",
	"color.js",
	"map.js",
	"tracer.js",
	'driver-manager.js',
	"https://code.jquery.com/ui/1.14.0/jquery-ui.js"
]);

html::AddStyleFile('https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css');

html::AddTemplate('<div class="driver-window">
	<h3>{username}</h3>
	<div class="content">{content}</div>
</div>', 'driver-window');

html::AddTemplate('<div class="driver-order">
	<h3>'.lang('Order').': {id}</h3>
	<div>'.lang('User').': {user_id}</div>
	<div>'.lang('State').': {state}</div>
	<div>'.lang('remaindDistance').': {remaindDistance}</div>
</div>', 'driver-order');

?>
<?=html::RenderField(['type'=>'map', 'id'=>"map"], 'map')?>