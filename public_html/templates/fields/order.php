<?

	$fieldIdx = html::fieldIdx();

	html::AddScriptFile('select-place.js');
	html::AddScriptFile('color.js');
?>
<div class="field order field-<?=$fieldIdx?>">
	<div class="param stateHead"><span><?=lang('State')?></span>: <span class="state">{toLang(data.state)}</span></div>
	<div class="data">
		<div class="block route">
			<h3><?=lang('Route')?></h3>
			<div class="name">
			<div class="value trip">
	    		<span class="start-place">{PlaceName(data.start)}</span>
	    		<span class="finish-place">{PlaceName(data.finish)}</span>
	    	</div>
	    	</div>
			<div class="param"><span><?=lang('Distance')?></span><span class="distance">{DistanceToStr(data.meters)}</span></div>
			<div class="param"><span><?=lang('Remaining distance')?></span><span class="remaindDistance">{toLang(data.remaindDistance)}</span></div>
    	</div>
		<div class="block driver">
			<h3><?=lang('Driver/auto')?></h3>
			<div>
				<div class="driver-info">
					<div class="name">{driverName}</div>
					<div class="param"><span><?=lang('Number')?></span><span>{number}</span></div>
					<div class="param comfort"><span><?=lang('Comfort')?></span><span>{comfort}</span></div>
					<div class="param seating"><span><?=lang('Seating')?></span><span>{seating}</span></div>
					<div class="param carbody"><span><?=lang('Carbody')?></span><span>{car_body}</span></div>
					<div class="param"><span><?=lang('Car color')?></span><span>{car_colorName}</span></div>
					<div class="param">
						<div class="item-image" style="background-image: url(<?=BASEURL?>/css/images/{car_body}.png)" data-color="{car_color}">
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