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

    var R = 6378.137; // Radius of earth in KM

    var dLat = p2.lat() * Math.PI / 180 - p1.lat() * Math.PI / 180;
    var dLon = p2.lng() * Math.PI / 180 - p1.lng() * Math.PI / 180;

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    		Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
    		Math.sin(dLon/2) * Math.sin(dLon/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;

    return d * 1000; // meters
}