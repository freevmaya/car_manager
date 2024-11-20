var toolbar;

class ToolbarUser {
	#wicon;
	#listenerId;
	#notifyList;
	#view;
	#listView;
	constructor(toolbarElem) {
		this.#view = toolbarElem;
		this.#wicon = this.#view.find('.warning');
		this.#notifyList = [];

		this.#view.click(this.onUserClick.bind(this));

		this.#listenerId = transport.AddListener('notificationList', ((e)=>{
			this.appendReceiveNotifyList(e.value);
		}).bind(this));

		toolbar = this;

		this.appendReceiveNotifyList(jsdata.notificationList);
	}

	onUserClick() {
		if (this.isNotify())
			this.showNotifyList();
		else document.location.href = BASEURL + '/settings/user';
	}

	isNotify() {
		return this.#notifyList.length > 0;
	}

	#notifyIndexOf(id) {
		for (let i in this.#notifyList)
			if (this.#notifyList[i].id == id) 
				return i;
		return -1;
	}

	removeNotify(id) {
		let idx = this.#notifyIndexOf(id);
		if (idx > -1) {
			this.#notifyList.splice(idx, 1);
			this.showWarning(this.isNotify());
		}
	}

	appendReceiveNotifyList(data) {

		if (!isEmpty(data)) {
			for (let i in data) {
	            if (!isEmpty(data[i].text) && (data[i].text[0] != '{')) {
					transport.SendStatusNotify(data[i], 'receive');
					this.#notifyList.push(data[i]);
	            }
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

			let option = templateClone($('.templates .notifyItem'), 
				$.extend(item, {time: time})
			);

			option.find('.trash').click(this.trashClick.bind(this));
			
			DataView.Create(option.find('.container'), item);

			content.append(option);
		}

		let map = $('#map');

		this.#listView = viewManager.Create({curtain: map.length > 0 ? map : $('.wrapper'),
						title: toLang('Notifications'),
						content: content}, View, (()=>{
							this.#listView = null;
						}).bind(this));
	}

	notifyOptionHeaderList() {
		return this.#listView.contentElement.find('.option .header');
	}

	trashClick(e) {
		
		let option = $(e.currentTarget).closest('.option');
		let nid = option.data('id');
		transport.SendStatusNotify({id: nid}, 'read');

		let order_id = option.data('order_id');
		option.remove();
		this.removeNotify(nid);

		if ((this.notifyOptionHeaderList().length == 0) || (order_id)) 
			this.#listView.Close();

		if (order_id)
			v_map.MarkerManager.ShowMarkerOfOrder(order_id);
	}

	getOrder(notify_id) {

		let order = this.#notifyList[this.#notifyIndexOf(notify_id)].content;

		if (isStr(order.start)) order.start = JSON.parse(order.start);
		if (isStr(order.finish)) order.finish = JSON.parse(order.finish);

		return order;
	}

	toMap(notify_id) {

		let order = this.getOrder(notify_id);
		if (v_map) {
			v_map.MarkerManager.ShowMarkerOfOrder(order.id, order);
		} else window.location.href = BASEURL + '/map/driver/' + order.id;

		this.#listView.Close();
	}

	acceptOrder(notify_id) {
		let order = this.getOrder(notify_id);
		
		if (order) {
			Ajax({
	            action: 'offerToPerform',
	            data: JSON.stringify({id: order.id})
	        }).then(((response)=>{
	            if (response.result == 'ok')
	                this.#listView.Close()
	            		.then(()=>{
	            			app.showQuestion(toLang('Offer sent'));
	            		});
	            else console.log(response);
	        }).bind(this));

		}
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