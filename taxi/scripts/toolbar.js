class ToolbarUser {
	#wicon;
	#listenerId;
	#notifyList;
	#view;
	#listView;
	constructor(toolbarElem, notifyList) {
		this.#view = toolbarElem;
		this.#wicon = this.#view.find('.warning');

		this.#view.click(this.onUserClick.bind(this));

		this.#listenerId = transport.AddListener('notificationList', this.setReceiveNotifyList.bind(this));
		this.setReceiveNotifyList(notifyList);
	}

	onUserClick() {
		if (this.isNotify())
			this.showNotifyList();
		else document.location.href = BASEURL + '/settings/user';
	}

	isNotify() {
		return this.#notifyList && (this.#notifyList.length > 0);
	}

	setReceiveNotifyList(data) {
		this.#notifyList = data;
		if (this.isNotify())
			for (let i in data) {
	            if (data[i].state == 'active')
					transport.SendStatusNotify(data[i], 'receive');
	        }
		this.showWarning(this.isNotify());
	}

	showWarning(visible) {
		this.#wicon.css('display', visible ? 'block' : 'none');
	}

	showNotifyList() {
		let content = $('<div class="items">');

		for (let i in this.#notifyList) {
			let item = this.#notifyList[i];
			let option = $('<div class="option" data-id="' + item.id + '">');
			option.append($('<div class="header">').text(item.content_type));
			option.append($('<p>').text(item.text));
			content.append(option);
		}

		let map = $('#map');

		this.#listView = viewManager.Create({curtain: map.length > 0 ? map : $('.wrapper'),
						title: toLang('Notifications'),
						content: content});
		this.notifyOptionList().click(this.onClickItem.bind(this));
	}

	notifyOptionList() {
		return this.#listView.contentElement.find('.option');
	}

	onClickItem(e) {
		let option = $(e.currentTarget);
		transport.SendStatusNotify({id: option.data('id')}, 'read');
		$(e.currentTarget).remove();
		if (this.notifyOptionList().length == 0) {
			this.#listView.Close();
			this.setReceiveNotifyList(null);
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