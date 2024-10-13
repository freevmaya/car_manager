class DriverManager {
	constructor(map, classes) {
		this.map = map;
		this.classes = classes;
		this.directionsService = new Classes["DirectionsService"]();
	}

	CreateAutoCar(resultroutes) {
		let result = new MoveDriver(this.map, resultroutes, "Driver", 
				this.CreateMarker(resultroutes.routes[0].overview_path[0], 'driver', 'marker-auto'));
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
			if (status == 'OK') {
				this.CreateAutoCar(result);
			}
		}).bind(this));
	}

	CreateRandomCar(center) {
		let finish = CalcCoordinate(center, Math.random() * 360, 200 + Math.random() * 300);
		this.CreateCarToRoute(center, finish);
	}

	CreateMarker(position, title, className, onClick = null) {
		let priceTag = document.createElement("div");
		priceTag.className = className;

		let marker = new Classes['AdvancedMarkerElement']({
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
}