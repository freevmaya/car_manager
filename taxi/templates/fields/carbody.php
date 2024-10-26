<?
	html::AddScriptFile('select-view.js');
	//html::AddScriptFile('window.js');
	html::AddScriptFile('views.js');

	$symbol = $value['item']['symbol'];
	$id = @$value['item']['car_body_id'];
	$fieldId = html::FiledId();

	html::AddJsCode("SelectViewCallback['".$fieldId."'] = (option) => {
		let id = option.data('id');
		let elem = $('#".$fieldId."');
		elem.find('.car-image').attr('src', option.find('img').attr('src'));
		elem.find('.value').text(option.find('.header').text());
		$('input[name=\"".$options['indexField']."\"]').val(id);
	};");
?>
<div class="field" id="<?=$fieldId?>">
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<div class="car">
        <div class="car-image-box chess light">
        	<?if ($symbol) {?>
            <img class="car-image" src="<?=BASEURL?>/css/images/<?=$symbol?>.png"></img>
            <?}?>
        </div>
        <div class="selectView" data-callback-index="<?=$fieldId?>">
			<input type="hidden" name="<?=$options['indexField']?>" value="<?=$id?>">
	        <div class="block">
	            <div class="value"><?=$symbol?></div>
	        	<a class="button popup-button"></a>
	        </div>
	        <div class="popup shadow radius">
	        	<div class="header">
		        	<div class="close"></div>
		    	</div>
	        	<div class="sliderView">
		        	<div class="slider">
			        	<?foreach ($value['items'] as $item) {?>
			        	<div class="option" data-id="<?=$item['id']?>">
			        		<div class="header"><?=$item['symbol']?></div>
			        		<img src="<?=BASEURL?>/css/images/<?=$item['symbol']?>.png">
			        	</div>
			        	<?}?>
		        	</div>
	        	</div>
	        </div>
        </div>
    </div>
</div>