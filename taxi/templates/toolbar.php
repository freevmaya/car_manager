<?
	html::AddScriptFile('views.js');
	$notifyModel = new NotificationModel();
	$driverModel = new DriverModel();

	$options = ['user_id' => Page::$current->user['id'], 'state'=>['receive', 'active']];

	html::addStyleFile(BASEURL.'/css/toolbar.css');
	html::AddScriptFile("toolbar.js");
	html::AddJsCode("
		$(window).ready(()=>{
			new ToolbarUser($('.toolbar .user'), ".json_encode($notifyModel->getItems($options)).");
		});
	");

	$driverOnTheLine = $driverModel->getItem(Page::$current->user['id']);

	$menu = [
		lang('Services')=> [
			[ Page::link('map'), lang('Go') ],
			(@$driverOnTheLine['active'] == 1) ?
				[ Page::link(['map','driver']), lang('Give a ride') ] :
			[ Page::link('driver'), lang('Driver') ]
		],
		lang('Settings')=> [
			[ Page::link(['settings', 'user']), lang('User') ],
			[ Page::link('driver'), lang('Driver') ]
		]
	]


?>
<div id="toolbarMenu">
	<div class="toolbar top shadow">
		<div>
			<a class="menu" onclick="$('#toolbarMenu').toggleClass('open')"><img src="<?=BASEURL?>/css/images/menu.png"></a>
		</div>
		<a class="user">
			<div class="warning"></div>
		</a>
	</div>

	<div class="submenu shadow">
		<div class="header"></div>
<?
	foreach ($menu as $title=>$submenuList) {
		echo "<div><i>{$title}:</i></div>\n";
		foreach ($submenuList as $submenu)
			echo "<div class=\"item\"><a href=\"{$submenu[0]}\">{$submenu[1]}</a></div>";
	}
?>
	</div>
</div>