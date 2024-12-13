<div class="view shadow radius dialog target-view">
	<div class="header"><button class="close button"></button></div>
	<div class="cols">
		<div class="content">
			<div class="field InfoField field-1" data-id="startPlace">
				<p></p>
				<span class="infoView nowrap"></span>
			</div>

			<div class="field field-1"><div class="divider"></div></div>

			<div class="field InfoField field-2" data-id="finishPlace">
				<p></p>
				<span class="infoView nowrap"></span>
			</div>
		</div>
		<div class="btn-block">
			<button class="button go">{toLang('Go')}</button>
		</div>
	</div>
	<div class="cols line-fields">
		<div class="DateTime" name="pickUpTime"></div>
		<?=html::RenderField(['type'=>'select', 'name'=>'sits', 'label'=>'Number of seats', 'options'=>[1,2,3,4,5,6,7,8]], 1);?>
	</div>
</div>