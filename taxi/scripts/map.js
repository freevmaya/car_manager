var EARTHRADIUS = 6378.137; // Radius of earth in KM

function Lepr(p1, p2, t) {
	return {
		lat: p1.lat() * (1 - t) + p2.lat() * t,
		lng: p1.lng() * (1 - t) + p2.lng() * t
	}
}

function CalcAngle(p1, p2) {
    return Math.atan2(p2.lng() - p1.lng(), (p2.lat() - p1.lat()) * 1.5) / Math.PI * 180;
}

function Distance(p1, p2) {  // generally used geo measurement function

    var dLat = p2.lat() * Math.PI / 180 - p1.lat() * Math.PI / 180;
    var dLon = p2.lng() * Math.PI / 180 - p1.lng() * Math.PI / 180;

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    		Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
    		Math.sin(dLon/2) * Math.sin(dLon/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = EARTHRADIUS * c;

    return d * 1000; // meters
}

function CalcCoordinate(center, angle, distanceMeters) {
	let rad = angle * Math.PI / 180;
	let degDistance = distanceMeters / (EARTHRADIUS * 1000) * 180;
	return {
		lat: center.lat() + Math.sin(rad) * degDistance,
		lng: center.lng() + Math.cos(rad) * degDistance
	}
}

function CalcPathLength(routeData, routeIndex = 0, outList=null) {
	let route = routeData.routes[routeIndex].overview_path;
	let totalLength = 0;
	for (let i=0; i < route.length - 1; i++) {
		let d = Distance(route[i], route[i + 1]);
		if (outList) outList.push(d);
		totalLength += d; 
	}
	return totalLength;
}

function HideDriverMenu() {
	$('#DriverMenu').remove();
}

function ShowDriverMenu() {
	let menu = $('#DriverMenu');
	if (menu.length == 0) {
		let btn;
		$('body').append(menu = $('<div id="DriverMenu" class="radius shadow">'));
		menu.append(btn = $('<a>'));
		btn.click(() => {window.ShowDriverSubmenu();});
        afterMap(() => {v_map.MarkerManager.ShowOrders();});
	}

	menu.css('display', 'block');
}

function afterMap(action) {
	const intervalId = setInterval(() => {
		if (v_map.map) {
		  clearInterval(intervalId);
		  action();
		}
	}, 100);
}

function getRoutePoint(routes, idx=0, routeIndex=0) {
	if (idx < 0)
		idx = routes.routes[routeIndex].overview_path.length + idx;

	return routes.routes[routeIndex].overview_path[idx];
}

function DrawPath(map, routeData) {
	var directionsRenderer = new google.maps.DirectionsRenderer();
	directionsRenderer.setMap(map);
	directionsRenderer.setDirections(routeData);
	return directionsRenderer;
}

class MarkerManager {

	constructor(map) {
		this.map = map;
		this.markers = {
			cars: [],
			users: []
		};

		transport.AddListener('notificationList', this.onNotificationList.bind(this));
	}

    onNotificationList(list) {
        for (let i in list) {
        	let item = list[i];
        	if (item.content_type == "orderCreated") {
        		item.order.startPlace = JSON.parse(item.order.startPlace);
        		item.order.finishPlace = JSON.parse(item.order.finishPlace);
        		let latLng = { lat: item.order.startPlace.lat, lng: item.order.startPlace.lng };
        		this.#createFromOrder(latLng, item.order);
        	}
        }
    }

	CreateMarker(position, title, className, onClick = null) {
		let priceTag = document.createElement("div");
		priceTag.className = className;

		let marker = new v_map.Classes['AdvancedMarkerElement']({
		    map: this.map,
		    position: position,
		    title: title,
		    content: priceTag,
				gmpClickable: onClick != null
		});

		if (onClick != null)
			marker.addListener("click", onClick);

		return marker;
	}

	CreateDriver(position, title, onClick = null) {
		let result = this.CreateMarker(position, title, 'marker auto', onClick);
		this.markers.cars.push(result);
		return result;
	}

	CreateUser(position, title, onClick = null) {
		let result = this.CreateMarker(position, title, 'user-marker', onClick);
		this.markers.users.push(result);
		return result;
	}

	PlaceName(place) {
		return place.formattedAddress ? place.formattedAddress : (round(place.lat, 6) + ', ' + round(place.lng, 6));
	}

	#showInfoOrder(marker, data) {

		function showPathAndInfo() {
			let request = {
			    origin: data.startPlace,
			    destination: data.finishPlace,
			    travelMode: 'DRIVING'
			};

			v_map.DirectionsService.route(request, (function(result, status) {
				if (status == 'OK') {
					if (this.selectPath) this.selectPath.setMap(null);
					this.selectPath = DrawPath(this.map, result);
				}
			}).bind(this));

			this.selectPathView = viewManager.Create({
				bottomAlign: true,
				content: [
					{
						label: "InfoPath",
						text: getOrderInfo(data),
						class: TextField
					}
				]
			}, View, this.#closePathView.bind(this));
		}

		if (this.selectPathView)
			this.selectPathView.Close().then(showPathAndInfo.bind(this));
		else showPathAndInfo.bind(this)();
	}

	#closePathView() {
		if (this.selectPath) this.selectPath.setMap(null);
		this.selectPath = null;
		this.selectPathView = null;
	}

	#createFromOrder(latLng, order) {
		let m = this.CreateUser(latLng, 'user-' + order.user_id, (()=>{
			this.#showInfoOrder(m, order);
		}).bind(this));
	}

	ShowOrders() {
		Ajax({
			action: 'getOrders',
			data: {
				location: this.map.position
			}
		}).then(((data)=>{
			let item;
			for (let i=0; i<data.length; i++) {
				let item = data[i];

				item.startPlace = JSON.parse(item.startPlace);
				item.finishPlace = JSON.parse(item.finishPlace);

				let latLng = { lat: item.startPlace.lat, lng: item.startPlace.lng };
				this.#createFromOrder(latLng, item);
			}
		}).bind(this));
	}

	ClearAllUsers() {
		for (let i=0; i<this.markers.users.length; i++) {
			this.markers.users[i].setMap(null);
			delete this.markers.users[i];
		}
		this.markers.users = [];
		if (this.selectPath)
			this.selectPath.setMap(null);
	}
}

function getOrderInfo(order) {
	return toLang("User") + ': ' + (order.username ? order.username : (order.Vadim + " " + order.Frolov)) + ". " + 
			toLang("Departure time") + ': ' + $.format.date(order.pickUpTime, dateTinyFormat) + ". " + 
			toLang("Length") + ": " + round(order.meters / 1000, 1) + toLang("km.");
}

class AjaxTransport {

	#incIndex;
	constructor(periodTime) {
		this.listeners = {};
	    this.intervalID = setInterval(this.update.bind(this), periodTime);
	    this.#incIndex = 0;
	}

	update() {
		Ajax({"action": "checkState"}).then((value) => {

			for (let n in value)
			    if (this.listeners.hasOwnProperty(n)) {
			    	let list = this.listeners[n];
			    	for (let i in list) 
			    		list[i](value[n]);
			    }
		});
	}

	ConfirmReceive(data) {
        Ajax({
            action: 'StateNotification',
            data: { id: data.id, state: 'receive' }
        });
	}

	AddListener(event, callback) {
		if (!this.listeners[event]) this.listeners[event] = {};

		this.#incIndex++;
		this.listeners[event][this.#incIndex] = callback;
		return this.#incIndex;
	}

	RemoveListener(event, idx) {
		if (idx > -1) 
			delete this.listeners[event][idx];
	}
}

class VMap {
	#markerManager;
	#map;
	#classes;
	#view;
	#driverManager;
	#directionsService;

	get map() { return this.#map; }
	get Classes() { return this.#classes; }
	get View() { return this.#view; }

	get DriverManager() {
		if (!this.#driverManager)
			this.#driverManager = new DriverManager(this.#map);
		return this.#driverManager; 
	}


	get DirectionsService() {
		if (!this.#directionsService)
			this.#directionsService = new this.Classes['DirectionsService'](this.#map);
		return this.#directionsService; 
	}

	get MarkerManager() {
		if (!this.#markerManager)
			this.#markerManager = new MarkerManager(this.#map);
		return this.#markerManager; 
	}

	async initMap(crd) {

		const position = { lat: crd.latitude, lng: crd.longitude };

		const { Map, InfoWindow } = await google.maps.importLibrary("maps");
		const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
		const { DirectionsService } = await google.maps.importLibrary("routes");
		const { Place } = await google.maps.importLibrary("places");

		this.#view = $('#map');

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
		this.mainMarker = this.CreateMarker(position, 'my-position', 'marker position');
	}

	CreateMarker(position, title, className, onClick = null) {
		return this.MarkerManager.CreateMarker(position, 'my-position', 'marker position');
	}
}