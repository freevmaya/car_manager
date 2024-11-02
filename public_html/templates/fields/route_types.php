<?
	$items = $value['items'];//(new RouteTypesModel())->getItems($options['user_id']);
?>

<div class="field" id="<?=html::FiledId()?>">
	<label for="<?=$options['name']?>"><?=lang($options['label'])?></label>
	<div class="container">
		<div class="items listView">
			<?for ($i=0; $i<count($items); $i++) {
				$item = $items[$i];
				?>
				<div class="option hori">
					<div class="label"><?=$item['name']?></div>
					<div class="button"></div>
				</div>
			<?}?>
		</div>
		<button class="button"><?=lang('Add')?></button>
	</div>
</div>