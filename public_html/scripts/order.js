var orderManager;

class Order extends EventProvider {
	#manager;
    constructor(manager, data) {
    	super();
        $.extend(this, data);
        this.#manager = manager;
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
                if (e.result == 'ok') {
                    if (after != null) after();
                }
            }).bind(this));
        }
    }
}

class OrderManager {
	#orders;

    get Items() { return Array.from(this.#orders);}

	constructor() {
		this.#orders = [];
    	transport.AddListener('notificationList', this.#onNotificationList.bind(this));
	}

    #onNotificationList(e) {
        let list = e.value;
        for (let i in list) {
            let item = list[i];

            if (item.content_type == "changeOrder") {
                let part_order = JSON.parse(item.text);
                let idx = this.IndexOfByOrder(order_id);
		        if (idx > -1) {
		            let order = this.#orders[idx];

		            $.extend(order, part_order);

		            if (!order.changeList) order.changeList = [];
		            order.changeList.push({time: Date.now(), text: JSON.stringify({state: state})});

		            order.SendEvent('CHANGE', part_order);
		        }
                transport.SendStatusNotify(item, 'read');
            }
        }
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

		this.#orders = this.#orders.concat(result);
		return result;
    }

    CreateOrder(data) {
    	let order = new Order(this, data);
    	this.#orders.push(order);
    	return order;
    }
}
