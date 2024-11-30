<?

	$fieldIdx = html::fieldIdx();

	html::AddScriptFile('select-place.js');
	html::AddScriptFile('color.js');
?>
<div class="field order field-<?=$fieldIdx?>">
	<div class="param"><span><?=lang('State')?></span>: <span class="state">{toLang(data.state)}</span></div>
	<div class="data">
		<div class="block">
			<h3><?=lang('Route')?></h3>
			<div class="name">
			<div class="value trip">
	    		<span class="start-place">{PlaceName(data['start'])}</span>
	    		<span class="finish-place">{PlaceName(data['finish'])}</span>
	    	</div>
	    	</div>
			<div class="param"><span><?=lang('Distance')?></span><span class="distance">{distance} <?=lang('km.')?></span></div>
			<div class="param"><span><?=lang('Remaining distance')?></span><span class="remaindDistance">{toLang(data.remaindDistance)}</span></div>
    	</div>
		<div class="block">
			<h3><?=lang('Driver/auto')?></h3>
			<div class="driver">
				<div class="driver-info">
					<div class="name">{driverName}</div>
					<div class="param"><span><?=lang('Number')?></span><span>{number}</span></div>
					<div class="param"><span><?=lang('Comfort')?></span><span>{comfort}</span></div>
					<div class="param"><span><?=lang('Seating')?></span><span>{seating}</span></div>
					<div class="param"><span><?=lang('Carbody')?></span><span>{car_body}</span></div>
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