<?
	include_once(TEMPLATES_PATH.'/toolbar.php');
	$this->scripts[] = 'https://rawgit.com/RobinHerbots/jquery.inputmask/3.x/dist/jquery.inputmask.bundle.js';
?>

<div class="pageContent">
	<form method="POST" action="<?=Page::currentURL()?>">
		<div class="<?=Page::$page?> sliderView">
			<div class="form slider">
				<?=html::GetFields($this->model->getItem($this->user['id']), $this->model->getFields(), 5);?>
			</div>
		</div>
		<div class="footer">
			<input type="submit" class="button"></input>
		</div>
	</form>
</div>