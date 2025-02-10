<?

	$fieldIdx = html::fieldIdx();
	html::AddScriptFile('driver/trips.js');
?>
<div class="view" data-id="<?=$value['id']?>">
	<div class="field order field-<?=$fieldIdx?>">
		<div class="param stateHead">
			<span><?=lang('State')?></span>: <span class="state"><?=lang($value['state'])?></span>
		</div>
		<div class="data">
			<div class="block route">
				<h3><?=lang('Route')?></h3>
				<div class="name">
				<div class="overlow-dot value trip">
		    		<span class="overlow-dot start-place place"><?=$value['route']['startPlace']?></span>
		    		<span class="overlow-dot finish-place place"><?=$value['route']['finishPlace']?></span>
		    	</div>
		    	</div>
				<div class="param"><span><?=lang('Distance')?></span><span class="distance"><?=$value['meters']?></span></div>
				<div class="param"><span><?=lang('Remaining distance')?></span><span class="remaindDistance"><?=$value['remaindDistance']?></span></div>
	    	</div>
			<div class="block driver">
				<h3><?=lang('Passenger')?></h3>
				<div>
					<div class="driver-info">
						<div class="name"><?=$value['username']?></div>
					</div>
				</div>
			</div>
		</div>
		<div class="btn-block">
			<button class="button" onclick="cancelTrip($(this).closest('.view'))"><?=lang('Reject')?></button>
		</div>
	</div>
</div>