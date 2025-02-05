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

		}).bind(this));
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