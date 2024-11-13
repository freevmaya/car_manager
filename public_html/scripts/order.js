class OrderProcess {

	constructor(field) {
		this.field = field;
		this.order_id = field.data('order_id');

		this.btn = this.field.find('button')
						.click(this.onCancelClick.bind(this));

		this.refreshColor();
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