<?	
include_once(TEMPLATES_PATH.'/toolbar.php');

if ($this->asDriver()) {
	include_once(TEMPLATES_PATH.'/driver/begin.php');
} else {

	html::AddScriptFiles(['views.js', 'driver-manager.js', 'map.js', 'passenger/order-states.js', 'trips.js', 'validator.js',
						  'jquery-dateformat.min.js',
						  'https://code.jquery.com/ui/1.14.0/jquery-ui.js']);
	html::AddStyleFile('css/jquery-ui.css');


	$ordTripCount = 0;
	$lastTripCount = 0;
	$currentTripCount = 0;
	$orederModel = new OrderModel();

	$orders = $orederModel->getItems(['o.user_id'=>$user['id'], 'state'=>ACTIVEORDERLIST_ARR, 'limit'=>3]);
	$currentList = BaseModel::FullItems($orders, ['route_id'=>new RouteModel()]);
	$currentTripCount = count($currentList);

	$ordinaryTrips = (new OrdinaryTripsModel())->getItems(['limit'=>3]);
	$ordTripCount = count($ordinaryTrips);

	Группировать по номеру маршрута
	
	$lastTrips = BaseModel::FullItems($orederModel->getItems(['o.user_id'=>$user['id'], 'state'=>'finished', 'limit'=>3]), ['route_id'=>new RouteModel()]);
	
	$lastTripCount = count($lastTrips);

	if ($currentTripCount > 0)
		html::AddJsCode('createOrderList($("#currentList"), '.json_encode($currentList).');');
		
	html::AddTemplate(html::RenderField(['type'=>'order']), 'order');
	html::AddTemplate('
	<div class="field trip-item" id="{name}" data-place=\'{place}\'>
	    <label for="{name}" class="title">{label}</label>
	    <div class="container">
	        <div class="selectView" data-callback-index="{name}">
	            <div class="block">
	                <div class="value">{placeName}</div>
	                <a class="button popup-button"></a>
	            </div>
	        </div>
	    </div>
        '.html::RenderField(['type'=>'map', 'id'=>"map-{field_number}"], 'map').'
	</div>', 'trip-item');

	//html::AddTemplate(html::RenderField(['type'=>'driver']), 'driver');
?>
<div class="pageContent trips">
	<div class="sliderView">
		<div class="form slider">
			<?if ($currentTripCount > 0) {?>
			<div class="group">
				<h2><?=lang('My current trips')?></h2>
				<div id="currentList">
				</div>
			</div>
			<?}?>
			<?if ($ordTripCount > 0) {?>
			<div class="group">
				<h2><?=lang('Ordinary trips')?></h2>
				<?
				for ($i=0; $i<$ordTripCount; $i++)
					echo html::RenderField(['type'=>'trip_point'], $ordinaryTrips[$i]);
				?>
			</div>
			<?}?>
			<?if ($lastTripCount > 0) {?>
			<h3><?=lang('BeginPageDescription')?></h3>
			<div class="group">
				<h2><?=lang('My last trips')?></h2>
				<?
				for ($i=0; $i<$lastTripCount; $i++)
					echo html::RenderField(['type'=>'trip_point'], $lastTrips[$i]['route']);
				?>
			</div>
			<?}?>
		</div>
	</div>
</div>
<?}?>