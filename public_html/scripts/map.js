class MarkerManager {

	constructor(map) {
		this.map = map;
		this.markers = {
			cars: [],
			users: []
		};
	}

    onNotificationList(e) {
    	let list = e.value;
        for (let i in list) {
        	let item = list[i];
        	if (item.content_type == "orderCreated") 
        		this.AddOrder(item.order, true);
        	else if (item.content_type == "orderCancelled") {
        		this.RemoveOrder(item.content_id);
        	}
        }
    }

    ShowMarkerOfOrder(order_id) {
    	let idx = this.IndexOfByOrder(order_id);
    	if (idx > -1) {
    		let market = this.markers.users[idx];
    		v_map.map.setCenter(market.position);
    		let e = $(market.content);
    		if (e.hasClass('animShake')) {
    			e.removeClass('animShake');
    			setTimeout(()=>{
    				e.addClass('animShake');
    			}, 200);
    		} else e.addClass('animShake');
    	}
    }

    IndexOfByOrder(order_id) {
    	for (let i in this.markers.users)
    		if (order_id == this.markers.users[i].order_id)
    			return i;

    	return -1;
    }

    IndexOfByDriver(id) {
    	for (let i in this.markers.cars)
    		if (id == this.markers.cars[i].id)
    			return i;

    	return -1;
    }

    RemoveOrder(order_id) {
    	let idx = this.IndexOfByOrder(order_id);
    	if (idx > -1) {
    		this.markers.users[idx].setMap(null);
    		this.markers.users.splice(idx, 1);
    		
    		if (this.selectPathView && (this.selectPathView.order.id == order_id))
    			this.selectPathView.Close();
    	}
    }

    RemoveDriver(id) {
    	let idx = this.IndexOfByDriver(id);
    	if (idx > -1) {
    		this.markers.cars[idx].setMap(null);
    		this.markers.cars.splice(idx, 1);
    		
    		if (this.selectPathView && (this.selectPathView.order.id == order_id))
    			this.selectPathView.Close();
    	}
    }

    AddOrder(order, anim) {

		order.startPlace = JSON.parse(order.startPlace);
		order.finishPlace = JSON.parse(order.finishPlace);
		let latLng = { lat: order.startPlace.lat, lng: order.startPlace.lng };

    	this.#createFromOrder(latLng, order, anim);
    }

    AddOrders(orders) {
		for (let i in orders)
        	this.AddOrder(orders[i]);
    }

	#createFromOrder(latLng, order, anim) {
		let m = this.CreateUserMarker(latLng, 'user-' + order.user_id, (()=>{
			this.#showInfoOrder(m, order);
		}).bind(this), anim ? 'user-marker anim' : 'user-marker');
		m.order_id = order.id;
	}

	CreateMarker(position, title, className, onClick = null, addClass=null) {
		let priceTag = document.createElement("div");
		priceTag.className = className;
		if (addClass) priceTag.addClass(addClass);

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
				title: "Order",
				bottomAlign: true,
				content: [
					{
						label: "InfoPath",
						text: getOrderInfo(data),
						class: TextField
					}
				],
				actions: {
					'Offer to perform': (() => {
						Ajax({
							action: 'offerToPerform',
							data: JSON.stringify({id: data.id})
						}).then(((response)=>{
							if (response.result == 'ok')
								this.selectPathView.Close();
							else console.log(response);
						}).bind(this));
					}).bind(this)
				}
			}, View, this.#closePathView.bind(this));
			this.selectPathView.order = data;
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
	return toLang("User") + ': ' + (order.username ? order.username : (order.first_name + " " + order.last_name)) + ". " + 
			toLang("Departure time") + ': ' + $.format.date(order.pickUpTime, dateTinyFormat) + ". " + 
			toLang("Length") + ": " + round(order.meters / 1000, 1) + toLang("km.");
}

class VMap {
	#markerManager;
	#map;
	#classes;
	#view;
	#driverManager;
	#directionsService;
	#mainMarker;

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

		const position = toLatLng(crd);

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
		this.#mainMarker = this.CreateMarker(position, 'my-position', 'marker position');
	}

	setMainPosition(latLng) {
		if (latLng)
			this.#mainMarker.position = latLng;
	}

	getMainPosition() {
		return this.#mainMarker ? this.#mainMarker.position : null;
	}

	CreateMarker(position, title, className, onClick = null) {
		return this.MarkerManager.CreateMarker(position, 'my-position', 'marker position');
	}

	getRoutes(startPlace, finishPlace, travelMode, callback) {
		let request = {
            origin: PlaceLatLng(startPlace),
            destination: PlaceLatLng(finishPlace),
            travelMode: travelMode
        }
        this.DirectionsService.route(request, function(result, status) {
            if (status == 'OK')
            	callback(result);
        });
	}
}