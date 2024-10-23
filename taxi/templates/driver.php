<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
?>
<div class="content driver">
	<?=html::getFields($this->model->getDriver());?>
</div>