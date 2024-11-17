class DriverManager {

	#listenerId;
	#timerId;
	#markers;
	constructor() {
		this.begin();
	}

	begin() {
		this.#listenerId = transport.AddListener("SuitableDrivers", this.onReceive.bind(this));
        transport.requireDrivers = true;
        this.#timerId = setInterval(this.onUpdate.bind(this), 1000 / 24);
        this.#markers = [];
	}

	stop() {
		v_map.MarkerManager.ClearAllCars();
        transport.requireDrivers = false;
        transport.RemoveListener(this.#listenerId);
        clearInterval(this.#timerId);
	}

	onReceive(e) {

		let drivers = e.value.slice();
		function indexOfById(id) {
			for (let i=0; i<drivers.length; i++)
				if (drivers[i].id == id)
					return i;
			return -1;
		}

		function toLatLng(driver) {
			return new google.maps.LatLng(driver.lat, driver.lng);
		}

		function updateOnLine(marker, online) {
			let cnt = $(marker.content);

			if (online) {
				if (cnt.hasClass('offline'))
					cnt.removeClass('offline');
			} else {
				if (!cnt.hasClass('offline'))
					cnt.addClass('offline');
			}
		}

		for (let i=0; i<this.#markers.length; i++) {
			let m = this.#markers[i];
			let carIdx = indexOfById(this.#markers[i].id);
			if (carIdx > -1) {
				m.car.setPos(toLatLng(drivers[carIdx]), drivers[carIdx].angle);

				updateOnLine(m, parseInt(drivers[carIdx].online) == 1);
				drivers.splice(carIdx, 1);

			} else
				v_map.MarkerManager.RemoveDriver(this.#markers[i].id);
		}

		for (let i=0; i<drivers.length; i++) {
			let driver = drivers[i];
			let m = v_map.MarkerManager.CreateDriver( driver.id, toLatLng(driver), driver.username );

			m.car = new FollowCar(m, toLatLng(driver), driver.angle);
			this.#markers.push(m);
		}
	}

	onUpdate() {
		for (let i=0; i<this.#markers.length; i++)
			this.#markers[i].car.update();
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

	setPos(latLng, angle) {

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