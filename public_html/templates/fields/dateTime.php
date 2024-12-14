<div class="field" data-id="<?=html::fieldIdx()?>">
	<?if (isset($options['label'])) {?>
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<?}?>
	<div class="DateTime" name="<?=$options['name']?>"></div>
</div>