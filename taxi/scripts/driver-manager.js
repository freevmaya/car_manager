class DriverManager {

	#listenerId;
	constructor() {
		this.#listenerId = transport.AddListener('SuitableDrivers', this.onReceive.bind(this));
	}

	onReceive(value) {

		drivers = value;
		function indexOfById(id) {
			for (let i=0; i<drivers.length; i++)
				if (drivers[i].id == id)
					return i;
			return -1;
		}

		function toLatLng(driver) {
			return { lat: driver.lat, lng: driver.lng };
		}

		let markers = v_map.MarkerManager.markers.cars;

		for (let i=0; i<markers.length; i++) {
			let carIdx = indexOfById(markers[i].id);
			if (carIdx > -1) {
				markers[i].position = toLatLng(drivers[carIdx]);
				drivers.splice(carIdx, 1);
			}
		}

		for (let i=0; i<drivers.length; i++) {
			v_map.MarkerManager.CreateDriver(
				toLatLng(drivers[i])
			);
		}
	}
}

var driverManager;