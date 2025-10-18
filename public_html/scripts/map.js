class MarkerManager {

	constructor(mapControl) {
		this.ctrl = mapControl;
		this.markers = {
			cars: [],
			users: []
		};
	}

	CreateMarker(position, title, className, onClick = null, extContent=null) {
		let priceTag = $('<div>');
		priceTag.addClass(className);
		if (extContent) priceTag.append(extContent);

		let marker = new this.ctrl.Classes['AdvancedMarkerElement']({
		    map: this.ctrl.map,
		    position: position,
		    title: title,
		    content: priceTag[0],
			gmpClickable: onClick != null
		});

		if (onClick != null)
			marker.addListener("click", (e) => {
				onClick(marker);
			});

		return marker;
	}

	CreateMarkerDbg(position, timeout=10000, color=false) {
		let marker = this.CreateMarker(position, null, 'debug');
		let cnt = $(marker.content);
		if (color) cnt.css('background', color);
		let ws = timeout / 1000 * 0.5;
		cnt.css({'animation-delay': ws + 's' ,'animation-duration': ws + 's'});

		setTimeout(()=>{
			marker.setMap(null);
		}, timeout);
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

	CreateUserMarker(position, title, onClick = null, markerClass='user-marker', extContent=null) {
		let result = this.CreateMarker(position, title, markerClass, onClick, extContent);
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

const TIMEUPDATESTEP_VECTORMAP = 5;
const TIMEUPDATESTEP_RASTERMAP = 50;
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
    #mapLatLng;
    #markerLatLng;
    #cameraFollowPath;
    #mapAngle;
    #updateTimerId;
    #toLatLng;
    #toAngle;
    #timeUpdateStep;
    #mouseDown;
    #mouseDownTimerId;
    #followCenter;

	get map() { return this.#map; }
	get Classes() { return this.#classes; }
	get View() { return this.#view; }
	get MainMarker() { return this.#mainMarker; }
	get CameraFollowPath() { return this.#cameraFollowPath; }
	get isVector() { return this.#map.renderingType == 'VECTOR'; }
	get mouseDown() { return this.#mouseDown; }
	set CameraFollowPath(value) { 
		if (this.#cameraFollowPath != value) {
			this.#followCenter = value;
			this.#cameraFollowPath = value;
			this.#mapLatLng = this.#toLatLng = this.#markerLatLng = this.MainMarker.position;
			this.#timeUpdateStep = this.isVector ? TIMEUPDATESTEP_VECTORMAP : TIMEUPDATESTEP_RASTERMAP;

			if (value) 
				this.#updateTimerId = setInterval(this.update.bind(this), this.#timeUpdateStep);
			else {
				clearInterval(this.#updateTimerId);
				this.#updateTimerId = null;
				this.map.moveCamera({
		            heading: 0
		        });
			}
		}
	}

	defaultMapOptions() {
		return {
			zoom: 15,
			disableDefaultUI: true,
			mapId: "319511f83a6febb1",
			//mapId: "151146f0af358053",
			language: user.language_code,
			zoomControl: true
		};
	}

	defaultOptions() {
		return {
			main_marker: true, 
			start_position: user.lat ? toLatLng(user) : false,
			markerManagerClass: MarkerManager,
			driverManagerClass: DriverManager
		};
	}

	constructor(elem, callback = null, options) {
		super();

		v_map = this;
		this.#mapAngle = this.#toAngle = 0;
		this.#view = elem;
		this.#options = $.extend(this.defaultOptions(), options);

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

		this.#map = new Map(this.#view[0], $.extend(this.defaultMapOptions(), {center: position}));

		this.#classes = {
			AdvancedMarkerElement: AdvancedMarkerElement,
			DirectionsService: DirectionsService,
			InfoWindow: InfoWindow,
			Place: Place,
			RenderingType: RenderingType
		};
		
		this.infoWindow = new InfoWindow();

		if (this.#options.main_marker)
			this.#mainMarker = this.CreateMarker(position, 'my-position', 'marker position', this.onMainMarkerClick.bind(this));

		this.afterInitMap();
	}

	afterInitMap() {

		this.#map.addListener('mousedown', this.onDown.bind(this));
		this.#map.addListener('mouseup', this.onUp.bind(this));

	}

	onMainMarkerClick(e) {
		this.SendEvent('MAINMARKERCLICK', e);
	}

	#clearMdTid() {
		if (this.#mouseDownTimerId)
			clearTimeout(this.#mouseDownTimerId);
	}

	#beginMdTid() {
		if (this.CameraFollowPath) {
			this.#clearMdTid();
			this.#mouseDownTimerId = setTimeout((()=>{
				this.#mouseDownTimerId = false;
				this.#followCenter = this.CameraFollowPath;
				this.#mapLatLng = this.map.center;
			}).bind(this), 2000);
		}
	}

	onDown(e) {
		this.#clearMdTid();
		this.#mouseDown = e.pixel;
		this.#followCenter = false;
	}

	onUp(e) {
		this.#beginMdTid();
		this.#mouseDown = false;
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

		let smooth = UPDATESMOOTH * this.#timeUpdateStep;

        this.#mapAngle = LerpRad(this.#mapAngle / 180 * Math.PI, this.#toAngle / 180 * Math.PI, smooth) / Math.PI * 180;
        this.#markerLatLng = LatLngLepr(this.#markerLatLng, this.#toLatLng, smooth);

		if (this.isVector) {

	        this.map.setHeading(this.#mapAngle);

	        MarkerManager.setPos(this.MainMarker, this.#markerLatLng);
	    } else MarkerManager.setPos(this.MainMarker, this.#markerLatLng, this.#mapAngle);

	    if (this.#followCenter) {
        	this.#mapLatLng = LatLngLepr(this.#mapLatLng, this.#toLatLng, smooth);
	    	this.map.setCenter(this.#mapLatLng);
	    }

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

		//this.getPath(null, {start: startPlace, finish: finishPlace });

		let request = {
            origin: VMap.preparePlace(startPlace),
            destination: VMap.preparePlace(finishPlace),
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

VMap.AfterInit = function(afterProc) {
	afterCondition(()=>{
		return (typeof(v_map) != 'undefined') && v_map.map;
	}, afterProc);
}

VMap.preparePlace = function(p) {
	let result = p.location ? (p.id ? { placeId: p.id } : p.location) : 
				(p.placeId ? { placeId: p.placeId } : (p.latLng ? latLngToString(p.latLng) :  
						(p.lat ? latLngToString(p) : p)));

	return result;
}

class GeoCoordinates {
	#coordinates;
	#accuracyCircle;
	#centerCircle;
	#map;

	constructor(map) {
		this.#map = map;
	}

	set(coordinates) {
        let latLng = toLatLngF(this.#coordinates = coordinates);

        let accuracy = Number(coordinates.accuracy);

        if (accuracy) {
			if (!this.#accuracyCircle)
				this.#draw(latLng, accuracy);
			else {
				this.#accuracyCircle.setRadius(accuracy);
				this.#accuracyCircle.setCenter(latLng);
				this.#centerCircle.setCenter(latLng);
			}
		}
        v_map.MarkerManager.CreateMarkerDbg(latLng, 20000);
	}

	#draw(latLng, accuracy) {
        this.#accuracyCircle = new google.maps.Circle({
            strokeColor: "#0000FF",
            strokeOpacity: 0.15,
            strokeWeight: 1,
            fillColor: "#0000FF",
            fillOpacity: 0.08,
            clickable: false,
            map: this.#map,
            center: latLng,
            radius: accuracy
        });

        this.#centerCircle = new google.maps.Circle({
            fillColor: "#000000",
            fillOpacity: 0.5,
            clickable: false,
            map: this.#map,
            center: latLng,
            radius: 5
        });
	}

	destroy() {
		if (this.#accuracyCircle) {
			this.#accuracyCircle.setMap(null);
			this.#centerCircle.setMap(null);

			this.#accuracyCircle = null;
			this.#centerCircle = null;
		}
	}
}