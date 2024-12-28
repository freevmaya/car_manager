<?
	html::AddScriptFile('select-view.js');
	html::AddScriptFile('views.js');
	html::AddScriptFile('color.js');

	$rgb = @$value['item']['rgb'];
	$id = @$value['item']['id'];
    $fieldIdx = html::fieldIdx();

	html::AddJsCode("

	let vcolor = (new Color('{$rgb}')).grayscale().light() ? 'black' : 'white';
	$('.field[data-id=\'{$fieldIdx}\']').find('.color-demo .value').css('color', vcolor);

	InitSelectView(".$fieldIdx.", '{$options['name']}', (elem, option)=>{
		let color = option.find('.img').css('background-color');
		let vcolor = (new Color(color)).grayscale().light() ? 'black' : 'white';

		elem.find('.color-demo').css('background-color', color);
		elem.find('.value').
			text(option.find('.header').text())
			.css('color', vcolor);
	});");
?>
<div class="field" data-id="<?=$fieldIdx?>">
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<div class="container">
        <div class="selectView" data-callback-index="<?=$fieldIdx?>">
	        <div class="block color-demo" style="background-color: <?=$rgb?>;">
	            <div class="value"><?=$value['item']['name']?></div>
	        	<a class="button popup-button"></a>
	        </div>

	        <div class="items colors">
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