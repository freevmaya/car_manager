<?
    html::AddScriptFile('select-place.js');
	$fieldIdx = html::fieldIdx();
?>
<div class="field field-<?=$fieldIdx?>" <?if (isset($value['route_id'])) {?>data-route_id="<?=$value['route_id']?>"<?}?>>
	<div class="container">
    	<div class="selectView" data-callback-index="field-<?=$fieldIdx?>">
        	<div class="block">
            	<a class="value trip"<?=isset($value['start']) ? " data-start='{$value['start']}'" : ''?><?=isset($value['finish']) ? " data-finish='{$value['finish']}'" : ''?> data-meters="<?=@$value['meters']?>">
            		<?=$value['startPlace']?>
            		>
            		<?=$value['finishPlace']?>
            	</a>
        	</div>
        </div>
    </div>
</div>