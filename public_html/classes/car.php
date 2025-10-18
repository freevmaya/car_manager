<?
class Car extends Page {
	
	public function GetTemplateForm() { return 'formCar'; }

	protected function initModel() {
		return new CarModel();
	}
}
?>