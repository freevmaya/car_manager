<?

	include_once(TEMPLATES_PATH.'/toolbar.php');
	include_once(TEMPLATES_PATH.'/map/map-index.php');

	if (get_class($this) == 'Map')
		html::AddJsCode("user.requireDrivers = true;");

	html::AddScriptFile("select-target.js");
	html::AddScriptFile('driver-manager.js');
	html::AddJsCode("driverManager = new DriverManager();");

	if ($currentRoute = (new RouteModel())->getCurrentRoute()) {?>
<script type="text/javascript">
	var currentRoute = <?=json_encode($currentRoute)?>;
</script>
<?}?>
<div class="templates">
	<div class="car">
        <div class="car-image-box">
            <img class="car-image"></img>
            <span>{name}</span>
        </div>
    </div>
</div>