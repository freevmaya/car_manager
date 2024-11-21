var WAITOFFERS = 30000; // 30 сек

class OrderProcess {

	#time;
	#offers;
	#listenerId;
	constructor(field) {
		this.field = field;

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

	onNotificationList(e) {

		let list = e.value;
        for (let i in list) {
            let notify = list[i];
            if (notify.content_type == "offerToPerform") {
            	if (this.offerIndexOf(notify.id) == -1)
                	this.addOfferNotify(notify);
            }
        }

        let time_count = Date.now() - this.#time;
        if (time_count > WAITOFFERS) {
        	for (let i=0; i<this.#offers.length; i++) {
        		let offer = this.#offers[i];
        		transport.SendStatusNotify(offer);
        	}
        }
	}

	onDestroy(e) {
		this.destroy();
	}

	offerIndexOf(notify_id) {
		for (let i=0; i<this.#offers.length; i++)
			if (this.#offers[i].id == notify_id)
				return i;
		return -1;
	}

	addOfferNotify(notify) {
        this.#offers.push(notify);
        this.field.find('#offer-count').text(this.#offers.length);
	}

	takeOffer(notify) {
		if (notify.content_id == this.order_id) {

			let driver = JSON.parse(notify.text);
			let infoBlock = this.field.find('.driver-info');

			infoBlock.empty();
			
			new DataView(infoBlock, $('.templates .driver'), driver);
			this.refreshColor();

			Ajax({
				action: 'SetState',
				data: {id: this.order_id, driver_id: driver.id, state: 'accepted' }
			}).then(() => {
				transport.SendStatusNotify(notify);
			});
		}
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