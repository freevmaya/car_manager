<?
    html::AddScriptFile('select-place.js');
	$fieldIdx = html::fieldIdx();

    $data_block = html::toData($value, ['start', 'finish', 'meters', 'order_id', 'pickUpTime']);
    //print_r($data_block);
?>
<div class="field field-<?=$fieldIdx?>" <?if (isset($value['route_id'])) {?>data-route_id="<?=$value['route_id']?>"<?}?>>
	<div class="container">
    	<div class="selectView" data-callback-index="field-<?=$fieldIdx?>">
        	<div class="block">
            	<a class="value trip"<?=$data_block?>>
            		<?=$value['startPlace']?>
            		>
            		<?=$value['finishPlace']?>
            	</a>
        	</div>
        </div>
    </div>
</div>