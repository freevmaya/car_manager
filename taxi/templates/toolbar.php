<?
	$this->styles[] = BASEURL.'/css/toolbar.css';


	$menu = [
		lang('Services')=> [
			[ Page::link('map'), lang('Go') ],
			[ Page::link(['driver','prepare_trip']), lang('Give a ride') ]
		],
		lang('Settings')=> [
			[ Page::link(['settings', 'user']), lang('User') ]
		]
	]


?>
<div id="toolbarMenu">
	<div class="toolbar top shadow sliderView">
		<div class="slider">
			<a class="menu" onclick="$('#toolbarMenu').toggleClass('open')"><img src="<?=BASEURL?>/css/images/menu.png"></a>
		</div>
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



<script type="text/javascript">
	$('body').click((e)=>{
		let tm = $('#toolbarMenu');
		if (($(e.target).parents('#toolbarMenu').length == 0) && (tm.hasClass('open')))
			tm.removeClass('open');
	});
</script>