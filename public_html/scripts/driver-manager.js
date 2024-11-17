class DriverManager {

	#listenerId;
	constructor() {
		this.begin();
	}

	begin() {
		this.#listenerId = transport.AddListener("SuitableDrivers", this.onReceive.bind(this));
        transport.requireDrivers = true;
	}

	stop() {
		v_map.MarkerManager.ClearAllCars();
        transport.requireDrivers = false;
        transport.RemoveListener(this.#listenerId);
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

		let markers = v_map.MarkerManager.markers.cars;

		for (let i=0; i<markers.length; i++) {
			let m = markers[i];
			let carIdx = indexOfById(markers[i].id);
			if (carIdx > -1) {
				MarkerManager.setPos(m, toLatLng(drivers[carIdx]), drivers[carIdx].angle);
				updateOnLine(m, parseInt(drivers[carIdx].online) == 1);
				drivers.splice(carIdx, 1);

			} else
				v_map.MarkerManager.RemoveDriver(markers[i].id);
		}

		for (let i=0; i<drivers.length; i++) {
			let driver = drivers[i];
			let m = v_map.MarkerManager.CreateDriver( driver.id, toLatLng(driver), driver.username );
			MarkerManager.setPos(m, toLatLng(driver), driver.angle);
		}
	}

	destroy() {
		this.stop();
	}
}

class FollowCar {
	#marker;
	constructor(marker) {
		this.#marker = marker;
	}

	setPos(latLng, angle) {
		MarkerManager.setPos(this.#marker, latLng, angle);
	}
}