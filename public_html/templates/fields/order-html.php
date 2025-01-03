<?

	$fieldIdx = html::fieldIdx();

	html::AddScriptFile('select-place.js');
	html::AddScriptFile('color.js');
?>
<div class="field order field-<?=$fieldIdx?>">
	<div class="param stateHead">
		<span><?=lang('State')?></span>: <span class="state"><?=lang($value['state'])?></span>
	</div>
	<div class="data">
		<div class="block route">
			<h3><?=lang('Route')?></h3>
			<div class="name">
			<div class="overlow-dot value trip">
	    		<span class="overlow-dot start-place place"><?=$value['startPlace']?></span>
	    		<span class="overlow-dot finish-place place"><?=$value['finishPlace']?></span>
	    	</div>
	    	</div>
			<div class="param"><span><?=lang('Distance')?></span><span class="distance"><?=$value['meters']?></span></div>
			<div class="param"><span><?=lang('Remaining distance')?></span><span class="remaindDistance"><?=$value['remaindDistance']?></span></div>
    	</div>
		<div class="block driver">
			<h3><?=lang('Driver/auto')?></h3>
			<div>
				<div class="driver-info">
					<div class="name"><?=$value['driverName']?></div>
					<div class="param"><span><?=lang('Number')?></span><span><?=$value['number']?></span></div>
					<div class="param comfort"><span><?=lang('Comfort')?></span><span><?=$value['comfort']?></span></div>
					<div class="param seating"><span><?=lang('Seating')?></span><span><?=$value['seating']?></span></div>
					<div class="param carbody"><span><?=lang('Carbody')?></span><span><?=$value['car_body']?></span></div>
					<div class="param"><span><?=lang('Car color')?></span><span><?=$value['car_colorName']?></span></div>
					<div class="param">
						<div class="item-image" style="background-image: url(<?=BASEURL?>/css/images/<?=$value['car_body']?>.png)" data-color="<?=$value['car_color']?>">
					</div>
					</div>
				</div>
				<div class="name wait">
					<div><?=lang('Please wait, we are selecting a driver')?>.</div>
					<div><span><?=lang('Offer count')?></span>: <span id="offer-count"><span></div>
					<?=html::RenderField(['type'=>'loader']);?>
				</div>
			</div>
		</div>
	</div>
</div>