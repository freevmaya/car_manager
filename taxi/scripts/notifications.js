class Notifications {
	constructor() {
        this.initView();
        transport.AddListener('notificationList', this.onNotificationList.bind(this));
    }

    initView() {
    	$('body').prepend(this.view = $('<div class="notifications">'));
    }

    receiveNotification(data) {
        new NotifyItem(this, data);

        setTimeout(()=>{Ajax({
            action: 'StateNotification',
            data: { id: data.id, state: 'receive' }
        });}, 500);
    }

    onNotificationList(list) {
        for (let i in list)
            this.receiveNotification(list[i]);
    }
}

class NotifyItem {
    constructor(parent, data) {
        this.data = data;
        this.parent = parent;
        this.initView();
    }

    initView() {
        this.view = $('<div class="item radius shadow">');
        this.view.append($('<button class="close button">').click(this.Close.bind(this)));

        if (this.data.content_type == "orderCreated") {
            this.view.append($('<div class="header">').text(toLang("Application received")));
            this.view.append($('<p>').text(getOrderInfo(this.data.order)));
        }
        else this.view.append($('<p>').text(this.data.text));

        this.parent.view.append(this.view);
    }

    destroy() {
        this.view.remove();
        delete this;
    }

    Close() {
        Ajax({
            action: 'StateNotification',
            data: { id: this.data.id, state: 'read' }
        });

        this.view.addClass("hide");
        return new Promise(((resolveOuter) => {
            setTimeout((()=>{
                this.destroy();
                resolveOuter();
            }).bind(this), 500);
        }).bind(this));
    }
}