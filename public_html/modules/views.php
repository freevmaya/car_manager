<?
html::AddScriptFiles([
	"data-view.js",
	"views.js"
]);

html::AddTemplate('<div class="view shadow radius dialog">
	<div class="header"><button class="close button"></button></div>
	<div class="content"></div>
	<div class="footer btn-block"></div>
</div>', 'view');

/*
html::AddTemplate('<div class="view shadow radius dialog">
	<div class="header"><button class="close button"></button></div>
	<div class="cols">
		<div class="content"></div>
		<div class="btn-block"></div>
	</div>
</div>', 'view-right-btn-block');*/
?>