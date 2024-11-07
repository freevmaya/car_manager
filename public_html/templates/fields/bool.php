
<?
	html::AddScriptFile('iphone-style-checkboxes.js');
	html::AddStyleFile(BASEURL.'/css/style-swith.css');

	html::AddJsCode("
		$(document).ready(function() {
	      	$(':checkbox').iphoneStyle();
	    });", 'checkbox');
?>
<div class="field" data-id="<?=html::fieldIdx()?>">
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<div class="container">
		<input type="checkbox" name="<?=$options['name']?>" <?=$value ? 'checked' : '';?>></input>
    </div>
</div>