<?
	$this->styles[] = 'css/toolbar.css';
?>
<div id="toolbarMenu">
	<div class="toolbar top shadow sliderView">
		<div class="slider">
			<a class="menu" onclick="$('#toolbarMenu').toggleClass('open')"><img src="css/images/menu.png"></a>
		</div>
	</div>
	<div class="submenu shadow">
		<div class="header"></div>
<?if ($this->user) {?>		
		<div><i>Services:</i></div>
		<div class="item"><a href="/map">Go</a></div>
		<div class="item"><a href="/driver">Give a ride</a></div>
<?} else {?>
		<div><i>Menu:</i></div>
		<div class="item"><a href="/login">Login</a></div>
<?}?>
	</div>
</div>



<script type="text/javascript">
	$('body').click((e)=>{
		let tm = $('#toolbarMenu');
		if (($(e.target).parents('#toolbarMenu').length == 0) && (tm.hasClass('open')))
			tm.removeClass('open');
	});
</script>