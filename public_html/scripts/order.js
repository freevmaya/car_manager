class OrderProcess {

	constructor(field) {
		this.field = field;
		this.order_id = field.data('order_id');

		this.btn = this.field.find('button')
						.click(this.onCancelClick.bind(this));

		this.refreshColor();

		transport.AddListener('notificationList', 
        	this.onNotificationList.bind(this));
	}

	onNotificationList(e) {
		let list = e.value;
        for (let i in list) {
            let item = list[i];
            if (item.content_type == "offerToPerform") 
                this.offerToPerform(item);
        }
	}

	offerToPerform(data) {
		if (data.content_id == this.order_id) {
			Ajax({
				action: 'GetDriver',
				data: {driver_id: data.offered_driver_id}
			}).then(((driver)=>{
				this.onReceiveDriver(driver, data);
			}).bind(this));
		}
	}

	onReceiveDriver(v, notify) {
		if (v.result) {
			let infoBlock = this.field.find('.driver-info');

			infoBlock.empty()
					.append(templateClone($('.templates .driver'), v.result));
			this.refreshColor();

			transport.SendStatusNotify(notify);
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
}

$(window).ready(()=>{
	$(".field.order").each((i, field)=>{
		new OrderProcess($(field));
	});
});