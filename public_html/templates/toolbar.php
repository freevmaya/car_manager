<?
	GLOBAL $user;
	html::AddScriptFiles(['views.js', 'jquery-dateformat.min.js']);

	$notifyModel = new NotificationModel();
	$driverModel = new DriverModel();

	html::addStyleFile(BASEURL.'/css/toolbar.css');
	html::AddScriptFile("toolbar.js");
	html::AddJsCode("new ToolbarUser($('.toolbar .user'));");

	$menu = [
		[
			[ Page::link(), lang('Home') ] 
		],
		lang('Services')=> [
			($this->asDriver()) ?
				[ Page::link(['map']), lang('Give a ride') ] :
			[ Page::link('map'), lang('Trip on the map') ]
		],
		lang('Settings')=> [
			[ Page::link(['settings', 'user']), lang('User') ],
			[ Page::link('driver'), lang('Driver') ]
		]
	];

	html::addTemplate('<div class="orderCreated">
		<div class="content" data-id="{id}">
			{this.getOrderInfo(true)}
		</div>
		<div class="btn-block">
			<button class="button" onclick="toolbar.acceptOrder({id})">'.lang('Accept').'</button>
			<button class="button" onclick="toolbar.toMap({id})">'.lang('To map').'</button>
		</div>
		</div>', 'orderCreated');

	html::addTemplate('<div class="orderCancelled">
			<div class="content" data-id="{id}">
				{this.getOrderInfo()}
			</div>
		</div>', 'orderCancelled');

	html::addTemplate('<div class="option notifyItem {content_type}" data-id="{id}">
			<div>
				<div class="header">
					<span>{time}</span>{text}
				</div>
				<div class="container"></div>
			</div>
			<div class="trash"></div>
		</div>', 'notifyItem');

	/*
	html::AddJsCode('
		templateClone($(".templates .orderCancelled"), {id: 123});
	');*/
?>
<div id="toolbarMenu">
	<div class="toolbar top shadow">
		<div>
			<a class="menu" onclick="$('#toolbarMenu').toggleClass('open')"><img src="<?=BASEURL?>/css/images/menu.png"></a>
		</div>
		<a class="user<?=$this->asDriver() ? ' driver' : ' passenger'?>">
			<div class="warning"></div>
		</a>
	</div>

	<div class="submenu shadow">
		<div>
			<div class="header"></div>
<?
	foreach ($menu as $title=>$submenuList) {
		if ($title)
			echo "<div><i>{$title}:</i></div>\n";
		foreach ($submenuList as $submenu)
			echo "<div class=\"item\"><a href=\"{$submenu[0]}\">{$submenu[1]}</a></div>";
	}
?>
		</div>
		<div class="handle" onmousedown="$('#toolbarMenu').toggleClass('open')">
		</div>
	</div>
</div>