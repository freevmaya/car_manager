<?
	$this->scripts[] = "map.js";
	$this->scripts[] = "driver.js";
	$this->scripts[] = "driver_manager.js";
?>
<style type="text/css">
	#map {
	  height: 100%;
	}

	html,
	body {
	  height: 100%;
	  margin: 0;
	  padding: 0;
	}
</style>
<div id="map"></div>

<script>(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
        ({key: "<?=APIKEY?>", v: "weekly"});</script>


<script type="text/javascript">
	let map;
	var Classes = {};
	var trans;

	async function initMap(crd) {

		const position = { lat: crd.latitude, lng: crd.longitude };

		const { Map } = await google.maps.importLibrary("maps");
		const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
		const { DirectionsService } = await google.maps.importLibrary("routes");

		var directionsService = new DirectionsService();

		map = new Map(document.getElementById("map"), {
			zoom: 18,
			disableDefaultUI: true,
			center: position,
			mapId: "MAIN_MAP_ID",
			zoomControl: true,
			scaleControl: true
		});

		Classes["AdvancedMarkerElement"] = AdvancedMarkerElement;
		Classes["DirectionsService"] = DirectionsService;

		var driverManager = new DriverManager(map);

		var marker1 = new AdvancedMarkerElement({
			map: map,
			position: position,
			title: "Main position",
		});

		map.addListener("click", (e) => {
			//console.log(e);
			//driverManager.CreateCarToRoute(marker1.position, e.latLng);

			driverManager.CreateRandomCar(e.latLng);
			trans.SendEvent('CreateDrive', e.latLng);
		});

		trans = new AjaxTransport(1000);

		trans.AddListener('moveDrive', (params)=>{
			console.log(params);
		});
	}

	function startGeo() {
		navigator.geolocation.getCurrentPosition((pos) => {
			initMap(pos.coords);
		});
	}

	setTimeout(()=>{
		if (!map) startGeo();
	}, 10000);
	startGeo();

</script>