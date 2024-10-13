class DriverManager {
	constructor(map, classes) {
		this.map = map;
		this.classes = classes;
		this.directionsService = new Classes["DirectionsService"]();
	}

	CreateCar(routes) {
		let result = new MoveDriver(this.map, routes, "Driver", 
				this.CreateMarker(routes[0].overview_path[0], 'driver', 'marker-auto'));
		result.Start(40, 100);
		return result;
	}

	CreateCarToRoute(origin, destination) {
		let request = {
		    origin: origin,
		    destination: destination,
		    travelMode: 'DRIVING'
		};
		this.directionsService.route(request, (function(result, status) {
			if (status == 'OK')
				this.CreateCar(result.routes);
		}).bind(this));
	}

	CreateMarker(position, title, className) {
		let priceTag = document.createElement("div");
		priceTag.className = className;

		return new Classes['AdvancedMarkerElement']({
		    map: this.map,
		    position: position,
		    title: title,
		    content: priceTag
		})
	}
}