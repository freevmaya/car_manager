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
			<div class="overflow-dot value trip">
	    		<span class="overflow-dot start-place place">{PlaceName(data.start)}</span>
	    		<span class="overflow-dot finish-place place">{PlaceName(data.finish)}</span>
	    	</div>
	    	</div>
			<div class="param"><span class="name"><?=lang('Distance')?></span><span class="distance">{DistanceToStr(data.meters)}</span></div>
			<div class="dynParam"><span class="name"><?=lang('Remaining distance')?></span><span class="remaindDistance">{toLang(data.remaindDistance)}</span></div>
			<div class="dynParam"><span class="name"><?=lang('Departure time')?></span><span class="">{DepartureTime(data.pickUpTime)}</span></div>
    	</div>
		<div class="block driver">
			<h3><?=lang('Driver/auto')?></h3>
			<div>
				<div class="driver-info">
					<div class="name">{driverName}</div>
					<div class="param"><span class="name"><?=lang('Number')?></span><span>{number}</span></div>
					<div class="param comfort"><span class="name"><?=lang('Comfort')?></span><span>{comfort}</span></div>
					<div class="param seating"><span class="name"><?=lang('Seating')?></span><span>{seating}</span></div>
					<div class="param carbody"><span class="name"><?=lang('Carbody')?></span><span>{car_body}</span></div>
					<div class="param"><span class="name"><?=lang('Car color')?></span><span>{car_colorName}</span></div>
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