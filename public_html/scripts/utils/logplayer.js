class LogPlayer {
	#startDate;
	constructor(startDate) {
		
		this.#startDate = Date.parse(startDate)
		this.getData(startDate);
	}

	getData(dateTime) {
		Ajax({
			action: 'getLog',
			data: {dateTime: dateTime}
		}).then(((e)=>{
			this.showPoints(e);
		}).bind(this));
	}

	showPoints(e) {
		for (let i=0; i<e.length; i++)
			v_map.MarkerManager.CreateMarkerDbg(toLatLngF(e[i]));
	}
}

$(window).ready(()=>{
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
        		new LogPlayer(view.getValues().StartTime);
        		view.Close();
        	}
        }
    }, BottomView, (()=>{
        view = null;
    }).bind(this));
});