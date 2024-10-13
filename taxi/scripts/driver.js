class MoveDriver {
	constructor(map, routes, title, marker) {
		this.route = routes[0].overview_path;
		this.length = [];
		this.totalLength = 0;
		for (let i=0; i < this.route.length - 1; i++)
			this.totalLength += (this.length[i] = Distance(this.route[i], this.route[i + 1]));

	    this.marker = marker;
	}

	Start(driveSpeedKmH, stepTimeMls = 100) {
	    this.routeIndex = -1;
	    this.distance = 0;
	    this.stepTimeMls = stepTimeMls;
	    this.SetSpeed(driveSpeedKmH);
	    this.intervalID = setInterval(this.Update.bind(this), this.stepTimeMls);		
	}

	SetSpeed(driveSpeedKmH) {
	    this.speed = driveSpeedKmH * this.stepTimeMls / 1000 / 3.6;
	}

	SetAngle(angle) {
		this.marker.content.style = "rotate:" + angle + "deg";
	}

	SetRouteIndex(routeIdx, offsetPercent) {
		let p1 = this.route[routeIdx];
		let p2 = this.route[routeIdx + 1];
		if (this.routeIndex != routeIdx)
			this.SetAngle(CalcAngle(p1, p2));
		this.marker.position = Lepr(p1, p2, offsetPercent);

		this.routeIndex = routeIdx;
	}

	Update() {

		let acLength = 0;
		for (let i=0; i<this.length.length; i++) {
			acLength += this.length[i];
			if (acLength > this.distance) {
				this.SetRouteIndex(i, 1 - (acLength - this.distance) / this.length[i]);
				this.distance += this.speed;
				return;
			}
		}

		this.marker.setMap(null);
		clearInterval(this.intervalID);
	}
}
