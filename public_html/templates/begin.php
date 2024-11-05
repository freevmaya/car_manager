<?	
include_once(TEMPLATES_PATH.'/toolbar.php');

html::AddScriptFiles(['views.js', 'trips.js',
					  'jquery-dateformat.min.js',
					  'https://code.jquery.com/ui/1.14.0/jquery-ui.js']);
html::AddStyleFile('https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css');

$ordinaryTrips = (new OrdinaryTripsModel())->getItems();

$ordTripCount = count($ordinaryTrips);

$lastTrips = BaseModel::FullItems((new OrderModel())->getItems(['state'=>'finished']), ['route_id'=>new RouteModel()]);
$lastTripCount = count($lastTrips);

$tcount = $ordTripCount + $lastTripCount;
$n = 0;
?>
<div class="pageContent trips">
	<div class="header"><p><?=lang('BeginPageDescription')?></p></div>
	<div class="sliderView">
		<div class="form slider">
			<div class="group">
				<h2><?=lang('Ordinary trips')?></h2>
				<?for ($i=0; $i<$ordTripCount; $i++) {?>
				<div class="field">
			    	<div class="container">
			        	<div class="selectView" data-callback-index="field-3">
			            	<div class="block" style="animation-delay: <?=$n / $tcount?>s">
			                	<a class="value trip" data-startPlaceId="<?=$ordinaryTrips[$i]['startPlaceId']?>" data-finishPlaceId="<?=$ordinaryTrips[$i]['finishPlaceId']?>">
			                		<?=$ordinaryTrips[$i]['startPlace']?>  <?=$ordinaryTrips[$i]['finishPlace']?>
			                		>
			                		<?=$ordinaryTrips[$i]['finishPlace']?>  <?=$ordinaryTrips[$i]['finishPlace']?>
			                	</a>
			            	</div>
				        </div>
				    </div>
				</div>
				<? $n++; }?>
			</div>
			<div class="group">
				<h2><?=lang('My last trips')?></h2>
				<?for ($i=0; $i<$lastTripCount; $i++) {?>
				<div class="field">
			    	<div class="container">
			        	<div class="selectView" data-callback-index="field-3">
			            	<div class="block" style="animation-delay: <?=$n / $tcount?>s">
			                	<a class="value trip" data-route_id="<?=$lastTrips[$i]['id']?>">
			                		<?=$lastTrips[$i]['route']['startPlaceAliase']?> > 
			                		<?=$lastTrips[$i]['route']['finishPlaceAliase']?>
			                	</a>
			            	</div>
				        </div>
				    </div>
				</div>
				<? $n++; }?>
			</div>
		</div>
	</div>
</div>