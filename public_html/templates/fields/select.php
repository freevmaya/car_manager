<div class="field" data-id="<?=html::fieldIdx()?>">
	<?if (isset($options['label'])) {?>
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<?}?>
	<select name="<?=$options['name']?>">
		<?foreach ($options['options'] as $option) {?>
			<option <?$value == $option ? ' selected="selected"' : ''?>><?=$option?></option>
		<?}?>
	</select>
</div>