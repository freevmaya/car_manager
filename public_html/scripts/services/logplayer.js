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

  		this.#filter = new GPSFilter({
  			speedLimit: { // В км/ч
                min: -20,
                max: 20
            }
  		});
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