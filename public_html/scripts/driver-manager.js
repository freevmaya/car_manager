class DriverManager {

	#listenerId;
	#timerId;
	#driverPath;

	get cars() { return v_map.MarkerManager.markers.cars; };

	constructor() {
		this.begin();
	}

	initInfoWindow() {
		if (!this.infoWindow) {
			this.infoWindow = new v_map.Classes.InfoWindow();
			this.infoWindow.addListener('closeclick', this.onCloseWindow.bind(this));
		}
	}

	begin() {
		this.#listenerId = transport.AddListener("SuitableDrivers", this.onReceive.bind(this));
        transport.requireDrivers = true;
        this.#timerId = setInterval(this.onUpdate.bind(this), 1000 / 24);
	}

	stop() {
		v_map.MarkerManager.ClearAllCars();
        transport.requireDrivers = false;
        transport.RemoveListener(this.#listenerId);
        clearInterval(this.#timerId);
	}

	toLatLng(driver) {
		return new google.maps.LatLng(driver.lat, driver.lng);
	}

	onReceive(e) {
		let receiveDrivers = e.value.slice();

		function indexOfById(id) {
			for (let i=0; i<receiveDrivers.length; i++)
				if (receiveDrivers[i].id == id)
					return i;
			return -1;
		}

		for (let i=0; i<this.cars.length; i++) {
			let m = this.cars[i];
			let carIdx = indexOfById(this.cars[i].id);
			if (carIdx > -1) {

				//console.log(receiveDrivers[carIdx]);
				m.car.setPos(this.toLatLng(receiveDrivers[carIdx]), receiveDrivers[carIdx].angle, parseInt(receiveDrivers[carIdx].online) == 1);
				receiveDrivers.splice(carIdx, 1);

			} else v_map.MarkerManager.RemoveCar(this.cars[i].id);
		}

		for (let i=0; i<receiveDrivers.length; i++)
			this.CreateCar(receiveDrivers[i]);
	}

	CreateCar(driver) {
		if (driver.lat) {
			let m = v_map.MarkerManager.CreateCar( driver.id, this.toLatLng(driver), driver.username, this.onCarClick.bind(this) );

			m.driver = driver;
			m.car = new FollowCar(m, this.toLatLng(driver), driver.angle);
		}
	}

	onCloseWindow() {
		this.hidePath();
	}

	hidePath() {
		if (this.#driverPath) {
			this.#driverPath.setMap(null);
			this.#driverPath = null;
		}
	}

	onCarClick(m) {
		this.initInfoWindow();

		Ajax({
			action: 'GetOrderRoute',
			data: { driver_id: m.driver.id }
		}).then((order)=>{
			let content = 'Free';
			if (order) {
				let r = order.route;
				if (r) {

					r.start = JSON.parse(r.start);
					r.finish = JSON.parse(r.finish);

					v_map.getRoutes(r.start, r.finish, r.travelMode, ((result)=>{
						this.#driverPath = v_map.DrawPath(result, {polylineOptions: {
									            strokeColor: '#663'
									        }});
					}).bind(this));

					content = templateClone('driver-order', order)[0].outerHTML;
				} else content = "Busy"

				console.log(order);
			}

			this.hidePath();
			this.infoWindow.close();
		    this.infoWindow.setContent(
		    	templateClone('driver-window', $.extend({content: content}, m.driver))[0].outerHTML
		    );
		    this.infoWindow.open(v_map.map, m);
		});
	}

	onUpdate() {
		for (let i=0; i<this.cars.length; i++)
			this.cars[i].car.update();
	}

	destroy() {
		this.stop();
	}
}

class FollowCar {
	#marker;
	#deltaT;
	#direct;
	#lastTime;
	#time;
	#latLng;
	#angle;

	get angle() { return this.#angle; };

	constructor(marker, latLng, angle) {

		this.#marker = marker;
    	this.#lastTime = this.#time =  Date.now();
		this.#deltaT = 0;

		MarkerManager.setPos(this.#marker, this.#latLng = latLng, this.#angle = angle);
	}

	updateOnLine(online) {
		let cnt = $(this.#marker.content);

		if (online) {
			if (cnt.hasClass('offline'))
				cnt.removeClass('offline');
		} else {
			if (!cnt.hasClass('offline'))
				cnt.addClass('offline');
		}
	}

	setPos(latLng, angle, online) {

		let old = this.#latLng;
		let currentTime = Date.now();

        let distance = Distance(latLng, old);

        if (distance > 100) {
			this.#deltaT = 0;
        	MarkerManager.setPos(this.#marker, this.#latLng = latLng, this.#angle = angle);
        }
        else {
        	this.#deltaT = currentTime - this.#lastTime;
        	this.#direct = LatLngSub(latLng, old);
        	this.#setPosMarker(this.#latLng = latLng, this.#angle = angle);
        }

		this.#lastTime = currentTime;

		this.updateOnLine(online);
	}

	#setPosMarker(pos, angle) {
		let smoothPos = LatLngLepr(this.#marker.position, pos, 0.95);
		MarkerManager.setPos(this.#marker, smoothPos, angle);
	}

	update() {

		if (this.#deltaT > 0) {
	        let updateDelta = Date.now() - this.#lastTime;
	        let k = Math.min(updateDelta / this.#deltaT, 1);

	        let pos = LatLngAdd(this.#latLng, LatLngMul(this.#direct, k));
	        this.#setPosMarker(pos, this.#angle);
	    }
	}
}