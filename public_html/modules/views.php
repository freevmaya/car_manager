<?
html::AddScriptFiles([
	"data-view.js",
	"views.js"
]);

html::AddTemplateFile('default-view.php', 'view');

/*
html::AddTemplate('<div class="view shadow radius dialog">
	<div class="header"><button class="close button-flat"></button></div>
	<div class="cols">
		<div class="content"></div>
		<div class="btn-block"></div>
	</div>
</div>', 'view-right-btn-block');*/
?>