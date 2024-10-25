<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
	
	if ($this->model) {
		html::$scripts[] = 'https://rawgit.com/RobinHerbots/jquery.inputmask/3.x/dist/jquery.inputmask.bundle.js';
?>

<div class="pageContent">
	<h2><?=$this->model->getTitle();?></h2>
	<form method="POST" action="<?=Page::currentURL()?>">
		<input type="hidden" name="form-request-id" value="<?=$this->createRequestId(get_class($this->model))?>">
		<div class="<?=Page::$page?> sliderView">
			<div class="form slider">
				<?=html::GetFields($this->model->getItem($this->user['id']), $this->model, 5);?>
			</div>
		</div>
		<div class="footer">
			<input type="submit" class="button"></input>
		</div>
	</form>
</div>

<?}?>