<?	
include_once(TEMPLATES_PATH.'/toolbar.php');

html::AddScriptFiles(['views.js', 'map.js', 'trips.js',
					  'jquery-dateformat.min.js',
					  'https://code.jquery.com/ui/1.14.0/jquery-ui.js']);
html::AddStyleFile('css/jquery-ui.css');

$ordinaryTrips = (new OrdinaryTripsModel())->getItems();

$ordTripCount = count($ordinaryTrips);

$lastTrips = BaseModel::FullItems((new OrderModel())->getItems(['state'=>'finished']), ['route_id'=>new RouteModel()]);
$lastTripCount = count($lastTrips);
?>
<div class="pageContent trips">
	<div class="header"><p><?=lang('BeginPageDescription')?></p></div>
	<div class="sliderView">
		<div class="form slider">
			<div class="group">
				<h2><?=lang('Ordinary trips')?></h2>
				<?
				for ($i=0; $i<$ordTripCount; $i++)
					echo html::RenderField(['type'=>'trip_point'], $ordinaryTrips[$i]);
				?>
			</div>
			<div class="group">
				<h2><?=lang('My last trips')?></h2>
				<?
				for ($i=0; $i<$lastTripCount; $i++)
					echo html::RenderField(['type'=>'trip_point'], $lastTrips[$i]['route']);
				?>
			</div>
		</div>
	</div>
</div>


<div class="templates">
	<div class="field" id="{name}">
	    <label for="{name}" class="title">{label}</label>
	    <input type="hidden" name="{name}" value="{placeId}">
	    <div class="container">
	        <div class="selectView" data-callback-index="{name}">
	            <div class="block">
	                <div class="value">{placeName}</div>
	                <a class="button popup-button"></a>
	            </div>
	        </div>
	    </div>
        <?=html::RenderField(['type'=>'map', 'id'=>"map-{field_number}"], 'map')?>
	</div>
</div>