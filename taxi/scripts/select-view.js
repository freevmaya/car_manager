$(window).ready(()=>{
	$('.selectView').each((i, item)=>{
		new SelectView($(item));
	});
});

var SelectViewCallback = {};


class SelectView {
	popup;
	window;
	field;
	elem;
	constructor(elem) {

		this.elem = elem;
		(this.popup = elem.find('.popup'))
			.find('.option').click(this.onClickItem.bind(this));

		(this.close = this.popup.find('.close'))
			.click(this.Close.bind(this));

		(this.popupButton = elem.find('.popup-button'))
			.click(this.btnClick.bind(this));

		//this.window = new Window(this.popup);
		this.field = elem.parent('.field');
	}

	onClickItem(e) {

		let index = this.elem.data('callback-index');
		if (index)
			SelectViewCallback[index]($(e.currentTarget));
		
		this.Close()
	}

	isOpen() {
		return this.popup.hasClass('show');
	}

	Show() {
		/*
		this.window.SetShow(true);
		this.popupButton.addClass("open");
		*/

		viewManager.Create({curtain: $('.wrapper'),
							title: 'selectView',
							content: [
				{
					label: "Right now",
					class: ButtonField,
					action: () => { }
				},{
					label: "Set a time",
					class: ButtonField,
					action: () => { }
				},{
					label: "In detail",
					class: ButtonField,
					action: () => { }
				}
			]});
	}

	Close() {
		this.window.SetShow(false);
		this.popupButton.removeClass("open");
	}

	btnClick() {
		if (this.isOpen()) this.Close();
		else this.Show();
	}
}