<?
class Map extends Page {
	protected function RenderContent($templateFile) {
		html::AddScriptFiles([
			"jquery-dateformat.min.js",
			"map.js",
			"views.js",
			"notifications.js",
			"https://code.jquery.com/ui/1.14.0/jquery-ui.js",
			"https://code.jquery.com/ui/1.14.0/themes/base/jquery-ui.css"
		]);

		if (Page::$subpage == 'driver')
			html::AddScriptFile("driver-on-line.js");
		else html::AddScriptFile("select-target.js");

		//html::AddScriptFile("driver.js");
		//html::AddScriptFile("driver-manager.js");
		return parent::RenderContent($templateFile);
	}
}
?>