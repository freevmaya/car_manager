<?
    html::AddScriptFile('select-place.js');
	$fieldIdx = html::fieldIdx();
?>
<div class="field field-<?=$fieldIdx?>" <?if (isset($value['route_id'])) {?>data-route_id="<?=$value['route_id']?>"<?}?>>
	<div class="container">
    	<div class="selectView" data-callback-index="field-<?=$fieldIdx?>">
        	<div class="block">
            	<a class="value trip" data-startPlaceId="<?=$value['startPlaceId']?>" data-finishPlaceId="<?=$value['finishPlaceId']?>">
            		<?=$value['startPlace']?>
            		>
            		<?=$value['finishPlace']?>
            	</a>
        	</div>
        </div>
    </div>
</div>