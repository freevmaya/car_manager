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
			marker.addListener("click", (e) => {
				onClick(marker);
			});

		return marker;
	}

	CreateCar(id, position, title, onClick = null, markerClass='marker auto') {
		let result = this.CreateMarker(position, title, markerClass, onClick);
		result.id = id;
		this.markers.cars.push(result);
		return result;
	}

    RemoveCar(id) {
        let idx = this.IndexOfByDriver(id);
        if (idx > -1) {
            this.markers.cars[idx].setMap(null);
            this.markers.cars.splice(idx, 1);
        }
    }

    IndexOfByDriver(id) {
        for (let i in this.markers.cars)
            if (id == this.markers.cars[i].id)
                return i;

        return -1;
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

	ClearAllCars() {
		for (let i=0; i<this.markers.cars.length; i++) {
			this.markers.cars[i].setMap(null);
			delete this.markers.cars[i];
		}
		this.markers.cars = [];
	}
}

MarkerManager.setPos = (marker, latLng, angle = undefined) => {
	marker.position = latLng;
	marker.content.style = "rotate:" + (typeof(angle) != 'undefined' ? angle : 0) + "deg";
}

var v_map;

const TIMEUPDATESTEP = 5;
const UPDATESMOOTH = 0.01;

class VMap extends EventProvider {
	#markerManager;
	#map;
	#classes;
	#view;
	#driverManager;
	#directionsService;
	#mainMarker;
	#options;
    #listenerId;
    #mainTransform;
    #cameraFollowPath;
    #mapAngle;
    #mapLatLng;
    #updateTimerId;
    #toLatLng;
    #toAngle;

	get map() { return this.#map; }
	get Classes() { return this.#classes; }
	get View() { return this.#view; }
	get MainMarker() { return this.#mainMarker; }
	get CameraFollowPath() { return this.#cameraFollowPath; }
	set CameraFollowPath(value) { 
		this.#cameraFollowPath = value;
		this.#mapLatLng = this.#toLatLng = this.MainMarker.position;

		if (value) 
			this.#updateTimerId = setInterval(this.update.bind(this), TIMEUPDATESTEP);
		else {
			clearInterval(this.#updateTimerId);
			this.#updateTimerId = null;
			this.map.moveCamera({
	            heading: 0
	        });
		}
	}

	constructor(elem, callback = null, options) {
		super();
		v_map = this;
		this.#mapAngle = this.#toAngle = 0;
		this.#view = elem;
		this.#options = $.extend({
			main_marker: true, 
			start_position: user.lat ? toLatLng(user) : false,
			markerManagerClass: MarkerManager,
			driverManagerClass: DriverManager,
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
        this.#listenerId = transport.AddListener('notificationList', this.onNotificationList.bind(this));
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

	get DriverManager() {
		return this.#driverManager; 
	}

	async initMap(crd) {

		const position = toLatLng(crd);

        this.#mainTransform = position;

		const { Map, InfoWindow, RenderingType } = await google.maps.importLibrary("maps");
		const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
		const { DirectionsService } = await google.maps.importLibrary("routes");
		const { Place } = await google.maps.importLibrary("places");

		this.#map = new Map(this.#view[0], {
			zoom: 15,
			disableDefaultUI: true,
			center: position,
			mapId: "319511f83a6febb1",
			//mapId: "151146f0af358053",
			language: user.language_code,
			zoomControl: true
		});

		this.#classes = {
			AdvancedMarkerElement: AdvancedMarkerElement,
			DirectionsService: DirectionsService,
			InfoWindow: InfoWindow,
			Place: Place,
			RenderingType: RenderingType
		};
		
		this.infoWindow = new InfoWindow();

		if (this.#options.main_marker)
			this.#mainMarker = this.CreateMarker(position, 'my-position', 'marker position');
	}

	driverManagerOn(value) {
		if (value) {
			if (!this.#driverManager)
				this.#driverManager = new this.#options.driverManagerClass(this);
		} else if (this.#driverManager) {
			this.#driverManager.destroy();
			this.#driverManager = null;
		}
	}

	visMainMarker(visible) {
		if (this.#mainMarker)
			this.#mainMarker.setMap(visible ? this.map : null);
	}

	update() {

        this.#mapAngle = LerpRad(this.#mapAngle / 180 * Math.PI, this.#toAngle / 180 * Math.PI, UPDATESMOOTH) / Math.PI * 180;
        this.#mapLatLng = LatLngLepr(this.#mapLatLng, this.#toLatLng, UPDATESMOOTH);

		if (this.#map.renderingType == 'VECTOR') {
			this.map.moveCamera({
	            center: this.#mapLatLng,
	            heading: this.#mapAngle
	        });

	        MarkerManager.setPos(this.MainMarker, this.#mapLatLng);
	    } else MarkerManager.setPos(this.MainMarker, this.#mapLatLng, this.#mapAngle);
		this.SendEvent('UPDATE', this);
	}

	setMainPosition(latLng, angle = undefined) {
		if (latLng && this.MainMarker) {
			if (this.#cameraFollowPath) {

		        this.#toAngle = typeof(angle) == 'undefined' ? 0 : angle;
		        this.#toLatLng = latLng;

		    } else MarkerManager.setPos(this.MainMarker, latLng, angle);
		}

		this.#mainTransform = (typeof(angle) != 'undefined') ? $.extend(toLatLng(latLng), {angle: angle}) : toLatLng(latLng);
	}

	getMainPosition() {
		return this.#mainTransform;
	}

	CreateMarker(position, title, className, onClick = null) {
		return this.MarkerManager.CreateMarker(position, 'my-position', 'marker position');
	}

	getRoutes(startPlace, finishPlace, a_travelMode, callback) {
		function preparePlace(p) {
			let result = p.location ? (p.id ? { placeId: p.id } : p.location) : 
						(p.placeId ? { placeId: p.placeId } : (p.latLng ? latLngToString(p.latLng) :  
								(p.lat ? latLngToString(p) : p)));

			return result;
		}

		//this.getPath(null, {start: startPlace, finish: finishPlace });

		let request = {
            origin: preparePlace(startPlace),
            destination: preparePlace(finishPlace),
            travelMode: a_travelMode
        }

        if (!isEmpty(request.origin) && !isEmpty(request.destination)) {
	        this.DirectionsService.route(request, function(result, status) {
	            if (status == 'OK')
	            	callback(result);
	            else console.log(request);
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

	async getPath(notifyId, request) {

		let This = this;

		async function checkAndPreparePlace(place) {
			if (place.lat)
				place = Promise.resolve(place);
			else place = This.getPlaceDetails(PlaceId(place));

			return place;
		}
		
		let start = await checkAndPreparePlace(JSON.vparse(request.start));
		let finish = await checkAndPreparePlace(JSON.vparse(request.finish));

		this.getRoutes(start, finish, travelMode, (result)=>{

            result.start = start;
            result.finish = finish;
            
			Promise.resolve(result);
			
            transport.SendStatusNotify(notifyId, 'accepted');
			transport.Reply(notifyId, result);
		});
	}

    onNotificationList(e) {

        for (let i in e.value) {
        	let notify = e.value[i];
			if (notify.content_type == 'requestData') {
                let request = JSON.parse(notify.text);
                let result = this[request.action](notify.id, request);
            }
        }
    }

	destroy() {
		if (this.#updateTimerId)
			clearInterval(this.#updateTimerId);
		this.#view.empty();
	}
}