class GPSFilter {
	#options
	#timeline;

	get length() { return this.#timeline.length; }

	constructor(options) {
		this.#options = $.extend(this.getDefaultOptions(), options);
		this.#timeline = [];
	}

	calcPosition(latLng, timeSec, accuracy) {
		let last = this.#timeline[this.#timeline.length - 1];
		let timeDiff = timeSec - last[1];
		let distance = Distance(latLng, last[0]);
		let speedKmH = distance / timeDiff * SPEEDCNV;

		if (speedKmH > this.#options.speedLimit.max) {
		
			let direct = LatLngNormal(LatLngSub(latLng, last[0]));
			distance = (timeDiff / 60 / 60) * this.#options.speedLimit.max;

			latLng = LatLngAdd(last[0], LatLngMul(direct, distance));
		}

		let ak = Math.min(last[2] / accuracy, 1);

		return LatLngAdd(LatLngMul(latLng, ak), LatLngMul(last[0], 1 - ak));
	}

	push(latLng, timeSec, accuracy) {
		let itm = [latLng, timeSec, accuracy];
		if (this.#timeline.length > 0)
			itm[0] = this.calcPosition(latLng, timeSec, accuracy);

		this.#timeline.push(itm);
	}

	getPoints() {
		let result = [];
		for (var i = 0; i < this.#timeline.length - 1; i++)
			result.push(this.#timeline[i][0]);

		return result;
	}

	getDefaultOptions() {
		return {
			speedLimit: { // В км/ч
				min: -30,
				max: 100
			},

			maxAccuracy: 500
		}
	}
}

class LogPlayer extends Component {
	#startDate;
	#timerId;
	#points;
	#index;
	#pathPoints;
	#drawPath;
	#geoCircle;
	#filter;

	constructor(startDate) {
		super();
		this.#startDate = Date.parse(startDate)
		this.getData(startDate);
	}

	getData(dateTime) {
		Ajax({
			action: 'getLog',
			data: {dateTime: dateTime}
		}).then(((e)=>{
			this.beginPlay(e);
		}).bind(this));
	}

	beginPlay(e) {
		this.#pathPoints = [];
		this.#points = e;
		this.#index = 0;
		this.#timerId = setInterval(this.nextPoint.bind(this), 200);
        
        if (!this.#geoCircle)
            this.#geoCircle = new GeoCoordinates(v_map.map);

  		this.#filter = new GPSFilter();
	}

	nextPoint() {

		if (this.#index < this.#points.length - 1) {

			let p = toLatLngF(this.#points[this.#index]);
			this.#geoCircle.set(this.#points[this.#index]);

//KALMAN TEST
			this.#filter.push(p, Number(this.#points[this.#index].timeSec), Number(this.#points[this.#index].accuracy));

			if (this.#filter.length > 2) {
				this.CloseDrawPath();
				this.#drawPath = DrawPath(v_map.map, this.#filter.getPoints());
			}
			
			this.#index++;

		} else this.Stop();

	}

	CloseDrawPath() {
		if (this.#drawPath) {
			this.#drawPath.setMap(null);
			this.#drawPath = null;
		}
	}

	Stop() {
		if (this.#geoCircle)
			this.#geoCircle.destroy();
		this.CloseDrawPath();
		clearInterval(this.#timerId);
		delete this;
	}

	destroy() {
		this.Stop();
	}
}

afterCondition(()=>{
	return v_map && v_map.map;
}, ()=>{
	
	let view = viewManager.Create({
		title: 'Log player',
        template: 'view',
        content: [
        	{
                name: 'StartTime',
                label: "Start log time",
                value: Date.now(),
                class: DateTimeField
            }
        ],
        actions: {
        	Begin: ()=>{
        		v_map.remove('LogPlayer');
        		v_map.LogPlayer = new LogPlayer(view.getValues().StartTime);
        	}
        }
    }, BottomView, (()=>{
    	v_map.remove('LogPlayer');
        view = null;
    }).bind(this));
});