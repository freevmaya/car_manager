class usersManager {
	constructor() {
		transport.AddListener('notificationList', this.onNotificationReceive.bind(this));
    	if (jsdata.notificationList) 
    		this.AddOrders(jsdata.notificationList);
        transport.requireOrders = true;
	}

	onNotificationReceive(list) {
		console.log(list);
	}
}


checkCondition(()=>{
	return v_map && (typeof(v_map.map) != 'undefined');
}, ()=>{


	#listenerId;
	#timerId;
	#driverPath;

	get cars() { return v_map.MarkerManager.markers.cars; };
	console.log(this);
});