class Window {
	#layer;
	#w;
	#options;
	constructor(content, options, wrapperSelector = '.wrapper') {
		
		this.#options = $.extend(options, {modal: true});
		let body = $('body');
		let ws = $('.windows');

		if (ws.length == 0)
			body.append(ws = $('<div class="windows">'));

		this.#w = $(wrapperSelector);
		ws.append(this.#layer = content.detach());

		this.#layer.find('.close').click((()=>{this.SetShow(false)}).bind(this));
	}

	isShow() {
		return this.#layer.hasClass('show');
	}

	SetShow(value) {
		if (value) {
			if (this.#options.modal) this.#w.addClass('curtain');
			this.#layer.removeClass("hide").addClass("show");
		}
		else {
			if (this.#options.modal) this.#w.removeClass('curtain');
			this.#layer.addClass("hide").removeClass("show");
		}
	}
}