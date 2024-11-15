class MarkerManager {

	constructor(mapControl) {
		this.ctrl = mapControl;
		this.markers = {
			cars: [],
			users: []
		};
	}

	CreateMarker(position, title, className, onClick = null, addClass=null) {
		let priceTag = document.createElement("div");
		priceTag.className = className;
		if (addClass) priceTag.addClass(addClass);

		let marker = new this.ctrl.Classes['AdvancedMarkerElement']({
		    map: this.ctrl.map,
		    position: position,
		    title: title,
		    content: priceTag,
			gmpClickable: onClick != null
		});

		if (onClick != null)
			marker.addListener("click", onClick);

		return marker;
	}

	CreateDriver(id, position, title, onClick = null, markerClass='marker auto') {
		let result = this.CreateMarker(position, title, markerClass, onClick);
		result.id = id;
		this.markers.cars.push(result);
		return result;
	}

	CreateUserMarker(position, title, onClick = null, markerClass='user-marker') {
		let result = this.CreateMarker(position, title, markerClass, onClick);
		this.markers.users.push(result);
		return result;
	}

	PlaceName(place) {
		return place.formattedAddress ? place.formattedAddress : (round(place.lat, 6) + ', ' + round(place.lng, 6));
	}

	ClearAllUsers() {
		for (let i=0; i<this.markers.users.length; i++) {
			this.markers.users[i].setMap(null);
			delete this.markers.users[i];
		}
		this.markers.users = [];
	}
}

var v_map;

class VMap {
	#markerManager;
	#map;
	#classes;
	#view;
	#driverManager;
	#directionsService;
	#mainMarker;
	#options;

	get map() { return this.#map; }
	get Classes() { return this.#classes; }
	get View() { return this.#view; }
	get MainMarker() { return this.#mainMarker; }

	get DriverManager() {
		if (!this.#driverManager)
			this.#driverManager = new this.#options.driverManagerClass(this.#map);
		return this.#driverManager; 
	}


	get DirectionsService() {
		if (!this.#directionsService)
			this.#directionsService = new this.Classes['DirectionsService'](this.#map);
		return this.#directionsService; 
	}

	get MarkerManager() {
		if (!this.#markerManager)
			this.#markerManager = new this.#options.markerManagerClass(this);
		return this.#markerManager; 
	}

	constructor(elem, callback = null, options) {
		v_map = this;
		this.#view = elem;
		this.#options = $.extend({
			main_marker: true, 
			start_position: false,
			driverManagerClass: DriverManager,
			markerManagerClass: MarkerManager,
		}, options);

		if (this.#options.start_position)
			this.initMap(this.#options.start_position).then(callback);
		else {
			setTimeout((()=>{
				if (!this.map) 
					this.initMap(null).then(callback);
			}).bind(this), 10000);

			getLocation(((pos) => {
				this.initMap(pos).then(callback);
			}).bind(this));
		}
	}

	async initMap(crd) {

		const position = toLatLng(crd);

		const { Map, InfoWindow } = await google.maps.importLibrary("maps");
		const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
		const { DirectionsService } = await google.maps.importLibrary("routes");
		const { Place } = await google.maps.importLibrary("places");

		this.#map = new Map(this.#view[0], {
			zoom: 15,
			disableDefaultUI: true,
			center: position,
			//clickableIcons: false,
			//mapId: "MAIN_MAP_ID",
			mapId: "319511f83a6febb1",
			zoomControl: true,
			scaleControl: true
		});

		this.#classes = {
			AdvancedMarkerElement: AdvancedMarkerElement,
			DirectionsService: DirectionsService,
			InfoWindow: InfoWindow,
			Place: Place
		};
		
		this.infoWindow = new InfoWindow();

		if (this.#options.main_marker)
			this.#mainMarker = this.CreateMarker(position, 'my-position', 'marker position');
	}

	visMainMarker(visible) {
		if (this.#mainMarker)
			this.#mainMarker.setMap(visible ? this.map : null);
	}

	setMainPosition(latLng) {
		if (latLng && this.#mainMarker)
			this.#mainMarker.position = latLng;
	}

	getMainPosition() {
		return this.#mainMarker ? this.#mainMarker.position : null;
	}

	CreateMarker(position, title, className, onClick = null) {
		return this.MarkerManager.CreateMarker(position, 'my-position', 'marker position');
	}

	getRoutes(startPlace, finishPlace, a_travelMode, callback) {
		function preparePlace(p) {
			let result = p.location ? { placeId: p.id } : 
						(p.placeId ? { placeId: p.placeId } : (p.latLng ? latLngToString(p.latLng) :  
								(p.lat ? latLngToString(p) : p)));

			return result;
		}

		let request = {
            origin: preparePlace(startPlace),
            destination: preparePlace(finishPlace),
            travelMode: a_travelMode
        }

        if (!isEmpty(request.origin) && !isEmpty(request.destination)) {
	        console.log(request);

	        this.DirectionsService.route(request, function(result, status) {
	            if (status == 'OK')
	            	callback(result);
	        });
	    }
	}

	async getPlaceDetails(placeId, fields = ["location", "displayName", "formattedAddress"]) {

	    const place = new this.Classes["Place"]({
	        id: placeId,
	        requestedLanguage: user.language_code, // optional
	    });

	    await place.fetchFields({ fields: fields });
	    return place;
	}

	DrawPath(data, options) {
		return DrawPath(this.map, data, options);
	}

	destroy() {
		this.#view.empty();
	}
}