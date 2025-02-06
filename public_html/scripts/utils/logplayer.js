class LogPlayer {
	#startDate;
	#timerId;
	#points;
	#index;
	constructor(startDate) {
		
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
		this.#points = e;
		this.#index = 0;
		this.#timerId = setInterval(this.nextPoint.bind(this), 500);
	}

	nextPoint() {
		if (this.#index < this.#points.length - 1) {
			v_map.MarkerManager.CreateMarkerDbg(toLatLngF(this.#points[this.#index]));
			this.#index++;
		} else this.Stop();
	}

	Stop() {
		clearInterval(this.#timerId);
		delete this;
	}
}

$(window).ready(()=>{
	let player;
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
        		if (player) player.Stop();
        		player = new LogPlayer(view.getValues().StartTime);
        	}
        }
    }, BottomView, (()=>{
        view = null;
    }).bind(this));
});