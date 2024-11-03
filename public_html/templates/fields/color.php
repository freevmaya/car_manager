<?
	html::AddScriptFile('select-view.js');
	html::AddScriptFile('views.js');
	html::AddScriptFile('color.js');

	$rgb = @$value['item']['rgb'];
	$id = @$value['item']['id'];
	$fieldId = html::FiledId();

	html::AddJsCode("InitSelectView('{$fieldId}', '{$options['name']}', (elem, option)=>{
		let color = option.find('.img').css('background-color');
		let vcolor = (new Color(color)).grayscale().light() ? 'black' : 'white';

		elem.find('.color-demo').css('background-color', color);
		elem.find('.value').
			text(option.find('.header').text())
			.css('color', vcolor);
	});");
?>
<div class="field" id="<?=$fieldId?>">
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<div class="container">
        <div class="selectView" data-callback-index="<?=$fieldId?>">
	        <div class="block color-demo">
	            <div class="value"><?=$value['item']['name']?></div>
	        	<a class="button popup-button"></a>
	        </div>
	        <!--<div class="color-demo" style="background-color: <?=$rgb?>;"></div>-->
	        <div class="items">
	        	<?foreach ($value['items'] as $item) {?>
	        	<div class="option" data-id="<?=$item['id']?>">
	        		<div class="header"><?=$item['name']?></div>
	        		<div class="img" style="background-color: <?=$item['rgb']?>">
	        		</div>
	        	</div>
	        	<?}?>
	        </div>
			<input type="hidden" name="<?=$options['name']?>" value="<?=$id?>">
        </div>
    </div>
</div>