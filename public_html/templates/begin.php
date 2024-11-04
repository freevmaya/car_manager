<?	
include_once(TEMPLATES_PATH.'/toolbar.php');

$ordinaryTrips = ['Bir billing takeoff', 'Delhi airport terminal 3', 'Palampur'];
$ordTripCount = count($ordinaryTrips);

$lastTrips = ['Bir billing takeoff (yesterday)', 'Gunihar (03/11)'];
$lastTripCount = count($lastTrips);

$tcount = $ordTripCount + $lastTripCount;
$n = 0;
?>
<div class="pageContent trips">
	<div class="sliderView">
		<div class="form slider">
			<div class="group">
				<h2><?=lang('Ordinary trips')?></h2>
				<?for ($i=0; $i<$ordTripCount; $i++) {?>
				<div class="field">
			    	<div class="container">
			        	<div class="selectView" data-callback-index="field-3">
			            	<div class="block" style="animation-delay: <?=$n / $tcount?>s">
			                	<a class="value"><?=$ordinaryTrips[$i]?></a>
			                	<a class="button">Now</a>
			            	</div>
				        </div>
				    </div>
				</div>
				<? $n++; }?>
			</div>
			<div class="group">
				<h2><?=lang('Last trips')?></h2>
				<?for ($i=0; $i<$lastTripCount; $i++) {?>
				<div class="field">
			    	<div class="container">
			        	<div class="selectView" data-callback-index="field-3">
			            	<div class="block" style="animation-delay: <?=$n / $tcount?>s">
			                	<a class="value"><?=$lastTrips[$i]?></a>
			                	<a class="button">Now</a>
			            	</div>
				        </div>
				    </div>
				</div>
				<? $n++; }?>
			</div>
		</div>
	</div>
</div>