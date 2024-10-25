<div class="field" id="<?=html::FiledId()?>">
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<input type="hidden" name="<?=$options['name']?>" value="<?=@$value['id']?>"></input>
	<div class="car">
		<?if (isset($value['id'])) {?>
        <div class="car-image-box chess light">
            <img class="car-image" src="css/images/mini.png" style="filter: invert(8%) sepia(69%) saturate(3530%) hue-rotate(340deg) brightness(110%) contrast(109%) drop-shadow(0px 0px 2px black)">
        </div>
        <button>+</button>
        <div class="block">
            <div>mini</div>
            <div>Number: ER 131321 DF</div>
        </div>
        <?} else {?>
        	<a class="button" href="<?=Page::link(['driver', 'editcar', 123]);?>">+</a>
        <?}?>
    </div>
</div>