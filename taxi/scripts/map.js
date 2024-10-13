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

function DrawPath(map, routeData) {
	var directionsRenderer = new google.maps.DirectionsRenderer();
	directionsRenderer.setMap(map);
	directionsRenderer.setDirections(routeData);
	return directionsRenderer;
}


async function Ajax(params) {
	var formData = new FormData();
	for (let key in params) {
		formData.append(key, params[key]);
	}

	const request = new Request(BASEURL + "/ajax", {
		method: "POST",
		body: formData
	});
	try {
		const response = await fetch(request);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error(error.message);
	}
	return null;
}

class AjaxTransport {

	constructor(periodTime) {
		this.listeners = {};
	    this.intervalID = setInterval(this.update.bind(this), periodTime);
	}

	update() {
		Ajax({"event": "checkState"}).then((value) => {
		    if (value.event && this.listeners.hasOwnProperty(value.event)) {
		    	let list = this.listeners[value.event];
		    	for (let i=0; i<list.length; i++) list[i](value);
		    }
		});
	}

	AddListener(event, callback) {
		if (!this.listeners[event]) this.listeners[event] = [];

		this.listeners[event].push(callback);
	}

	SendEvent(event, params) {
		Ajax({"event": event, "params": params});
	}
}