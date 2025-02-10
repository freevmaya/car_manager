<?
$orders = BaseModel::FullItems((new OrderModel())->getItems(['driver_id'=>$this->asDriver, 'state'=>ACTIVEORDERLIST_ARR]), ['route_id'=>new RouteModel()]);

if (count($orders) > 0) {
?>
<div class="pageContent trips">
	<div class="sliderView">
		<div class="form slider">
			<div class="group">
				<h2><?=lang('Trips')?></h2>
				<div id="currentList">
				<?
				foreach ($orders as $order)
					echo html::RenderField(['type'=>'order-for-driver'], $order);
				?>
				</div>
			</div>
	</div>
</div>
<?}?>
