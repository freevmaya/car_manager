class MoveDriver {
	constructor(map, routeData, title, marker) {
		this.map = map;
		this.routeData = routeData;
		this.routeIndex = 0;
		this.route = routeData.routes[this.routeIndex].overview_path;
		this.length = [];
		this.totalLength = 0;
		for (let i=0; i < this.route.length - 1; i++)
			this.totalLength += (this.length[i] = Distance(this.route[i], this.route[i + 1]));

	    this.marker = marker;
	    this.gmpClickable = true;
	    this.marker.addListener("click", this.onClick.bind(this));
	}

	onClick(e) {
		if (!this.routeDraw)
			this.routeDraw = DrawPath(this.map, this.routeData);
		else this.DestroyPath();
		console.log(e);
	}

	Start(driveSpeedKmH, stepTimeMls = 100) {
	    this.routePoint = -1;
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

	SetroutePoint(routeIdx, offsetPercent) {
		let p1 = this.route[routeIdx];
		let p2 = this.route[routeIdx + 1];
		if (this.routePoint != routeIdx)
			this.SetAngle(CalcAngle(p1, p2));
		this.marker.position = Lepr(p1, p2, offsetPercent);

		this.routePoint = routeIdx;
	}

	DestroyPath() {
		if (this.routeDraw) {
			this.routeDraw.setMap(null);
			delete this.routeDraw;
		}
	}

	Destroy() {
		
		this.DestroyPath();
		this.marker.setMap(null);
		clearInterval(this.intervalID);
		delete this.marker;
	}

	Update() {

		let acLength = 0;
		for (let i=0; i<this.length.length; i++) {
			acLength += this.length[i];
			if (acLength > this.distance) {
				this.SetroutePoint(i, 1 - (acLength - this.distance) / this.length[i]);
				this.distance += this.speed;
				return;
			}
		}

		this.Destroy();
	}
}
