<?
	$fieldIdx = html::fieldIdx();
?>
<div class="field field-<?=$fieldIdx?>">
	<div class="container">
    	<div class="selectView" data-callback-index="field-<?=$fieldIdx?>">
        	<div class="block">
            	<a class="value trip" href="<?=Page::link(['map', $value['id']])?>">
            		<?=$value['startPlace']?>
            		>
            		<?=$value['finishPlace']?>
            	</a>
        	</div>
        </div>
    </div>
</div>