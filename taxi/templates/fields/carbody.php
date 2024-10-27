<?
	html::AddScriptFile('select-view.js');
	//html::AddScriptFile('window.js');
	html::AddScriptFile('views.js');

	$symbol = $value['item']['symbol'];
	$id = @$value['item']['car_body_id'];
	$fieldId = html::FiledId();

	html::AddJsCode("InitSelectView('{$fieldId}', '{$options['name']}', (elem, option)=>{
		elem.find('.item-image').css('background-image', option.find('.img').css('background-image'));
		elem.find('.value').text(option.find('.header').text());
	});");
?>
<div class="field" id="<?=$fieldId?>">
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<div class="container">
        <div class="item-image-box chess light">
        	<?if ($symbol) {?>
            <div class="item-image" style="background-image: url(<?=BASEURL?>/css/images/<?=$symbol?>.png)"></div>
            <?}?>
        </div>
        <div class="selectView" data-callback-index="<?=$fieldId?>">
	        <div class="block">
	            <div class="value"><?=$symbol?></div>
	        	<a class="button popup-button"></a>
	        </div>
	        <div class="items">
	        	<?foreach ($value['items'] as $item) {?>
	        	<div class="option" data-id="<?=$item['id']?>">
	        		<div class="header"><?=$item['symbol']?></div>
	        		<div class="img" style="background-image: url(<?=BASEURL?>/css/images/<?=$item['symbol']?>.png)">
	        		</div>
	        	</div>
	        	<?}?>
	        </div>
			<input type="hidden" name="<?=$options['name']?>" value="<?=$id?>">
        </div>
    </div>
</div>