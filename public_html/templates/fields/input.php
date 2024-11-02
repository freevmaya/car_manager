<div class="field" id="<?=html::FiledId()?>">
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
		<input type="text" name="<?=$options['name']?>" <?=isset($options['required']) ? 'required' : ''?> <?=isset($options['readonly']) ? 'readonly' : ''?> value="<?=$value?>"></input>
</div>