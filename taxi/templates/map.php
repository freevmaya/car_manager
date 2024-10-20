<?
	$this->scripts[] = "map.js";
	$this->scripts[] = "driver.js";
	$this->scripts[] = "driver_manager.js";
	$this->scripts[] = "mechanics.js";
	$this->scripts[] = "notifications.js";
	$this->scripts[] = "jquery-dateformat.min.js";
	
	$this->scripts[] = "https://code.jquery.com/ui/1.14.0/jquery-ui.js";
	$this->styles[] = "https://code.jquery.com/ui/1.14.0/themes/base/jquery-ui.css";
	$this->styles[] = 'css/colors-01.css';
?>
<div id="windows">
</div>
<div id="map"></div>

<script>(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
        ({key: "<?=APIKEY?>", v: "weekly"});</script>


<script type="text/javascript">

	var transport = new AjaxTransport(1000);
	new Notifications();

	var dateTinyFormat = "dd.MM HH:mm";
	var dateShortFormat = "dd.MM.yy HH:mm";
	var dateLongFormat = "dd.MM.yyyy HH:mm";
	var dateOnlyFormat = "dd.MM.yyyy";

	
	var v_map = new VMap();

<?if (DEV) {?>
	v_map.initMap({latitude: 32.044704, longitude: 76.726152}).then(()=>{
		viewManager = new ViewManager();
		Mechanics();
	});
<?} else {?>
	function startGeo() {
		navigator.geolocation.getCurrentPosition((pos) => {
			v_map.initMap(pos.coords).then(()=>{
				Mechanics();
			});
		});
	}

	setTimeout(()=>{
		if (!v_map.map) startGeo();
	}, 20000);
	startGeo();
<?}?>

</script>