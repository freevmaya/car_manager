<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
	
	if ($this->model) {
		html::AddScriptFile('form.js');
		html::AddScriptFile('jquery.inputmask.min.js');

		$modelName = get_class($this->model);
		$requiestId = $this->createRequestId($modelName);

		html::AddJsData("'{$requiestId}'", 'formRequestId');
?>

<div class="pageContent data-model">
	<h2><?=$this->model->getTitle();?></h2>
	<form method="POST" action="<?=Page::currentURL()?>" data-model="<?=$modelName?>">
		<input type="hidden" name="form-request-id" value="<?=$requiestId?>">
		<div class="<?=Page::$page?> sliderView">
			<div class="form slider">
				<?=html::GetFields($this->model->getItem($this->getId()), $this->model, 5);?>
			</div>
		</div>
		<div class="footer">
			<input type="submit" class="button"></input>
		</div>
	</form>
</div>

<?}?>