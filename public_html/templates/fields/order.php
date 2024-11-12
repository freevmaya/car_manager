<?
	html::AddScriptFile('select-place.js');
	html::AddScriptFile('color.js');


	html::AddJsCode('
		$(".param .item-image").each((i, elem)=>{
			elem = $(elem);

			const color = new Color(hexToRgb(elem.data("color")));
		    const solver = new Solver(color);
		    const result = solver.solve();
		    elem.attr("style", elem.attr("style") + ";" + result.filter);
		});
	', 'CarColorInit');

	$fieldIdx = html::fieldIdx();

    $data_block = html::toData($value, ['start', 'finish', 'meters', 'order_id', 'pickUpTime']);
?>
<div class="field field-<?=$fieldIdx?>"<?=$data_block?>>
	<div class="data">
		<div class="block">
			<h3><?=lang('Route')?></h3>
			<div class="name">
			<a class="value trip"<?=$data_block?>>
	    		<?=$value['startPlace']?>
	    		>
	    		<?=$value['finishPlace']?>
	    	</a>
	    	</div>
			<div class="param"><span><?=lang('Distance')?></span><span><?=roundv($value['meters'] / 1000, 1).lang('km.')?></span></div>
    	</div>
		<div class="block">
			<h3><?=lang('Driver/auto')?></h3>
    		<?if ($value['driverName']) {?>
			<div class="name"><?=$value['driverName']?></div>
			<div class="param"><span><?=lang('Number')?></span><span><?=$value['number']?></span></div>
			<div class="param"><span><?=lang('Comfort')?></span><span><?=$value['comfort']?></span></div>
			<div class="param"><span><?=lang('Seating')?></span><span><?=$value['seating']?></span></div>
			<div class="param"><span><?=lang('Carbody')?></span><span><?=$value['car_body']?></span></div>
			<div class="param"><span><?=lang('Car color')?></span><span><?=$value['car_colorName']?></span></div>
			<div class="param"><div class="item-image" style="background-image: url(<?=BASEURL?>/css/images/<?=$value['car_body']?>.png)" data-color="<?=$value['car_color']?>">
			</div></div>
			<?} else {?>
				<div class="param wait"><span></span></div>
			<?}?>
		</div>
	</div>
</div>