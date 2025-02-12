class LogPlayer extends Component {
	#startDate;
	#timerId;
	#points;
	#index;
	#pathPoints;
	#drawPath;
	#geoCircle;

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
		this.#timerId = setInterval(this.nextPoint.bind(this), 500);
        
        if (!this.#geoCircle)
            this.#geoCircle = new GeoCoordinates(v_map.map);
	}

	nextPoint() {
		if (this.#index < this.#points.length - 1) {

			let p = toLatLngF(this.#points[this.#index]);
			this.#geoCircle.set(this.#points[this.#index]);
			
			this.#index++;

			if ((this.#pathPoints.length > 1) && Distance(Last(this.#pathPoints), p) < 1)
				return;
				
			this.#pathPoints.push(p);
			v_map.MarkerManager.CreateMarkerDbg(p);

			if (this.#pathPoints.length > 1) {
				this.CloseDrawPath();

				this.#drawPath = DrawPath(v_map.map, this.#pathPoints);
			}
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