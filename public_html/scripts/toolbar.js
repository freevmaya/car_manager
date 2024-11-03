class ToolbarUser {
	#wicon;
	#listenerId;
	#notifyList;
	#view;
	#listView;
	constructor(toolbarElem, notifyList) {
		this.#view = toolbarElem;
		this.#wicon = this.#view.find('.warning');
		this.#notifyList = [];

		this.#view.click(this.onUserClick.bind(this));

		this.#listenerId = transport.AddListener('notificationList', ((e)=>{
			this.appendReceiveNotifyList(e.value);
		}).bind(this));
		this.appendReceiveNotifyList(notifyList);
	}

	onUserClick() {
		if (this.isNotify())
			this.showNotifyList();
		else document.location.href = BASEURL + '/settings/user';
	}

	isNotify() {
		return this.#notifyList.length > 0;
	}

	appendReceiveNotifyList(data) {
		if (data) {
			this.#notifyList = this.#notifyList.concat(data);
			for (let i in data) {
	            if (data[i].state == 'active')
					transport.SendStatusNotify(data[i], 'receive');
	        }

	        this.showWarning(this.isNotify());
		}
	}

	showWarning(visible) {
		this.#wicon.css('display', visible ? 'block' : 'none');
	}

	showNotifyList() {
		let content = $('<div class="items notifications">');

		for (let i in this.#notifyList) {
			let item = this.#notifyList[i];
			let time = $.format.date(Date.parse(item.time), dateTinyFormat);
			let option = $('<div class="option" data-id="' + item.id + '">');
			option.append($('<div class="header ' + item.content_type + '">').html('<span>' + time + '</span>' + toLang(item.text)));
			if (item.order) {
				option.append($('<div class="order">').text(getOrderInfo(item.order)));
				option.data('order_id', item.order.id);
			}
			content.append(option);
		}

		let map = $('#map');

		this.#listView = viewManager.Create({curtain: map.length > 0 ? map : $('.wrapper'),
						title: toLang('Notifications'),
						content: content}, View, (()=>{
							this.#listView = null;
						}).bind(this));
		this.notifyOptionList().click(this.onClickItem.bind(this));
	}

	notifyOptionList() {
		return this.#listView.contentElement.find('.option');
	}

	removeNotify(id) {
		for (let i in this.#notifyList)
			if (this.#notifyList[i].id == id) {
				this.#notifyList.splice(i, 1);
				this.showWarning(this.isNotify());
				break;
			}
	}

	onClickItem(e) {
		let option = $(e.currentTarget);
		let nid = option.data('id');
		transport.SendStatusNotify({id: nid}, 'read');

		let order_id = option.data('order_id');
		option.remove();
		this.removeNotify(nid);

		if ((this.notifyOptionList().length == 0) || (order_id)) 
			this.#listView.Close();

		if (order_id)
			v_map.MarkerManager.ShowMarkerOfOrder(order_id);
	}

	destroy() {
		transport.RemoveListener(this.#listenerId);
	}
}


$('body').click((e)=>{
	let tm = $('#toolbarMenu');
	if (($(e.target).parents('#toolbarMenu').length == 0) && (tm.hasClass('open')))
		tm.removeClass('open');
});