class DriverManager {
	constructor(map, classes) {
		this.map = map;
		this.classes = classes;
	}

	CreateRouteCar(resultroutes) {
		let result = new RouteCar(this.map, resultroutes, "Driver", 
				v_map.MarkerManager.CreateDriver(getRoutePoint(resultroutes), 'driver'));
		result.Start(40, 100);
		return result;
	}

	CreateCarToRoute(origin, destination) {
		let request = {
		    origin: origin,
		    destination: destination,
		    travelMode: 'DRIVING'
		};
		v_map.DirectionsService.route(request, (function(result, status) {
			if (status == 'OK') {
				let car = this.CreateRouteCar(result);
				Ajax({
					action: 'BeganRouteCar',
					data: {
						driver_id: 0,
						car_id: 0,
			    		path: JSON.stringify({ origin: getRoutePoint(result), destination: getRoutePoint(result, -1) })
			    	}
				}).then((result)=>{
					console.log(result);
				});
			}
		}).bind(this));
	}

	CreateRandomCar(center) {
		let finish = CalcCoordinate(center, Math.random() * 360, 200 + Math.random() * 300);
		this.CreateCarToRoute(center, finish);
	}
}