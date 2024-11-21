var WAITOFFERS = 5000; // 30 сек

class OrderProcess {

	#time;
	#offers;
	#listenerId;
	constructor(field) {
		this.field = field;
		this.allowOffers = true;
		this.field.closest('.view').on('destroy', this.onDestroy.bind(this));

		this.order_id = field.data('order_id');

		this.btn = this.field.find('button')
						.click(this.onCancelClick.bind(this));

		this.refreshColor();

		this.#listenerId = transport.AddListener('notificationList', 
        	this.onNotificationList.bind(this));

		this.#time = Date.now();
		this.#offers = [];
	}

	offersProcess() {
		let list = e.value;
        for (let i in list) {
            let notify = list[i];
            if (notify.content_type == "offerToPerform") {
            	if (this.offerIndexOf(notify.id) == -1)
                	this.addOfferNotify(notify);
            }
        }

        let time_count = Date.now() - this.#time;
        if ((time_count > WAITOFFERS) && (this.#offers.length > 0)) {

        	this.#time = Date.now();

        	console.log('END WAIT');
	        let nearIx = 0;
	        let bestDistance = Number.MAX_VALUE;
	        let start = this.field.data('start');

        	if (this.#offers.length > 1) {
	        	for (let i=0; i<this.#offers.length; i++) {
	        		let offer = this.#offers[i];

	        		let distance = Distance(offer.driver, start);
	        		if (distance < bestDistance) {
	        			bestDistance = distance;
	        			nearIx = i;
	        		}
	        		//transport.SendStatusNotify(offer);
	        	}
	        } else {
	        	bestDistance = Distance(this.#offers[nearIx].driver, start);
	        }

	        let bestOffer = this.#offers[nearIx];
	        bestOffer.distance = bestDistance;

        	this.#offers.splice(nearIx, 1);
        	for (let i=0; i<this.#offers.length; i++) {
        		transport.SendStatusNotify(this.#offers[i]);
        	}
        	this.#offers = [];
        	this.takeOffer(bestOffer);
        	this.allowOffers = false;
        }
	}

	onNotificationList(e) {
		if (this.allowOffers) this.offersProcess();
	}

	offerIndexOf(notify_id) {
		for (let i=0; i<this.#offers.length; i++)
			if (this.#offers[i].id == notify_id)
				return i;
		return -1;
	}

	addOfferNotify(notify) {
		notify.driver = JSON.parse(notify.text);
        this.#offers.push(notify);
        this.field.find('#offer-count').text(this.#offers.length);
	}

	takeOffer(notify) {
		let infoBlock = this.field.find('.driver-info');

		infoBlock.empty();
		
		new DataView(infoBlock, $('.templates .driver'), notify.driver);
		this.refreshColor();

		Ajax({
			action: 'SetState',
			data: {id: this.order_id, driver_id: notify.driver.id, state: 'accepted' }
		}).then(() => {
			transport.SendStatusNotify(notify);
		});
	}

	onCancelClick(e) {
		Ajax({
			action: "SetState", 
			data: {id: this.order_id, state: "cancel"}
		}).then((e)=>{
			if (e.result = "ok")
				window.location.reload();
		});
	}

	refreshColor() {
		this.field.find(".param .item-image").each((i, elem)=>{
			elem = $(elem);

			const color = new Color(hexToRgb(elem.data("color")));
		    const solver = new Solver(color);
		    const result = solver.solve();
		    elem.attr("style", elem.attr("style") + ";" + result.filter);
		});
	}

	onDestroy(e) {
		this.destroy();
	}

	destroy() {
		transport.RemoveListener('notificationList', this.#listenerId);
		delete this;
	}
}

$(window).ready(()=>{
	$(".field.order").each((i, field)=>{
		new OrderProcess($(field));
	});
});