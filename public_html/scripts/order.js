class Order extends EventProvider {
	#manager;
    #waitTimerId;

    get StartTime() {
        return this.state == 'execution' ? Date.parse(this.beganExecuteTime) : 
                (this.state == 'wait_meeting' ? Date.parse(this.beganWaitTime) : Date.now());
    }

    constructor(manager, data) {
    	super();
        $.extend(this, data);

        this.start = JSON.vparse(data.start);
        this.finish = JSON.vparse(data.finish);

        this.#manager = manager;
        this.beginCheckPassengerDistance();
    }

    isStartPoint(latLng) {
        return LatLngEquals(latLng, this.start);
    }

    SetState(value, after=null) {
        if (this.state != value) {
            this.state = value;
            console.log("Set state order " + this.id + ", " + value);
            Ajax({
                action: 'SetState',
                data: {id: this.id, state: value}
            }, ((e)=>{
                if (e.result) {
                    $.extend(this, e.result);
                    if (after != null) after();
                }
            }).bind(this));
        }
    }

    checkPassengerDistance() {
        let time = this.beganWaitTime;
        if (time) {
            let deltaSec = (transport.serverTime - (isStr(time) ? Date.parse(time) : time)) / 1000;
            if (deltaSec > MAXPERIODWAITMEETING)
                this.SetState('expired');
            else {

                transport.addExtRequest({
                    action: 'GetPosition',
                    data: this.user_id
                }, (latLng)=>{
                    let distance = Distance(latLng, this.start);
                    if (distance <= MAXDISTANCEFORMEETING)
                        this.SetState('execution');
                    else this.beginCheckPassengerDistance();
                });
            }
            return true;
        }
    }

    afterChange(part_order) {
        this.SendEvent('CHANGE', part_order);
        this.beginCheckPassengerDistance();
            
        if ((this.state == 'accepted') && (this.driver_id == user.asDriver) && v_map)
            this.checkNearPassenger();
    }

    checkNearPassenger() {
        if (Distance(v_map.getMainPosition(), this.start) <= MAXDISTANCEFORMEETING) 
            this.SetState('wait_meeting');
    }

    beginCheckPassengerDistance() {
        if (this.state == 'wait_meeting')
            this.#waitTimerId = setTimeout(this.checkPassengerDistance.bind(this), 1000);
    }

    destroy() {
        if (this.#waitTimerId) clearTimeout(this.#waitTimerId);
        this.#manager.RemoveOrder(this.id);
        super.destroy();
    }
}

class OrderManager extends EventProvider {
	#orders;

    get Items() { return Array.from(this.#orders);}

	constructor(ordersData) {
        super();
        this.#orders = [];
        window.orderManager = this;
		this.AddOrders(ordersData);
    	transport.AddListener('notificationList', this.#onNotificationList.bind(this));
	}

    #onNotificationList(e) {
        let list = e.value;
        for (let i in list) {
            let item = list[i];

            if (item.content_type == "changeOrder") {
                let part_order = JSON.parse(item.text);
                let idx = this.IndexOfByOrder(item.content_id);
		        if (idx > -1)
		            this.doChangeOrder(this.#orders[idx], part_order);
		        else {
                    Ajax({
                        action: 'GetOrder',
                        data: item.content_id
                    }).then(((order)=>{
                        if (order) 
                            this.CreateOrder(order);
                    }).bind(this));
                }

                transport.SendStatusNotify(item, 'read');
            }
        }
    }

    doChangeOrder(order, part_order) {
        this.SendEvent('CHANGE_ORDER', $.extend(order, part_order));
        order.afterChange(part_order);
    }

    has(order_id) {
        return this.IndexOfByOrder(order_id) > -1;
    }

    GetOrder(order_id) {
        let idx = this.IndexOfByOrder(order_id);
        return idx > -1 ? this.#orders[idx] : null;
    }

    IndexOfByOrder(order_id) {
        for (let i=0; i<this.#orders.length; i++)
            if (order_id == this.#orders[i].id)
                return i;
        return -1;
    }

	AddOrders(list) {
		let result = [];
		for (let i=0; i<list.length; i++)
			result.push(this.CreateOrder(list[i]));
		return result;
    }

    CreateOrder(data) {

        let order = null;
        if (!this.has(data.id)) {
        	order = new Order(this, data);
        	this.#orders.push(order);
            this.SendEvent('CREATED_ORDER', order);
        }
    	return order;
    }

    RemoveOrder(order_id) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            this.#orders.splice(idx, 1);
            this.SendEvent('REMOVED_ORDER', order);
        }
    }
}
