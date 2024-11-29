function DriverMechanics() {

    transport.AddListener('notificationList', 
        v_map.MarkerManager.onNotificationList.bind(v_map.MarkerManager));

    v_map.MarkerManager.AddOrders(jsdata.orders);
}

class MarkerOrderManager extends MarkerManager {

    showOrderMarker;
    onNotificationList(e) {
        let list = e.value;
        for (let i in list) {
            let item = list[i];
            if (item.content_type == "orderCreated") {
                this.AddOrder(item.content, true);
            }
            else if (item.content_type == "orderCancelled") {
                this.CancelOrder(item.content_id);
            }
            else if (item.content_type == "acceptedOffer") {
                this.acceptedOffer(item.content_id);
            }
        }
    }

    Shake(market) {

        let e = $(market.content);
        if (e.hasClass('animShake')) {
            e.removeClass('animShake');
            setTimeout(()=>{
                e.addClass('animShake');
            }, 200);
        } else e.addClass('animShake');
    }

    acceptedOffer(order_id) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            let m = this.markers.users[idx];
            this.Shake(m);
            $(m.content).removeClass('user-marker')
                .addClass('user-current');

            m.order.driver_id = user.asDriver;
        }
    }

    ShowMarkerOfOrder(order_id, order = null) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            let market = this.markers.users[idx];
            this.ctrl.map.setCenter(market.position);
            this.Shake(this.markers.users[idx]);

            if (order)
                this.#showInfoOrder(market, order);
        }
    }

    IndexOfByOrder(order_id) {
        for (let i in this.markers.users)
            if (order_id == this.markers.users[i].order.id)
                return i;

        return -1;
    }

    CancelOrder(order_id) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            this.markers.users[idx].setMap(null);
            this.markers.users.splice(idx, 1);

            if (this.showOrderMarker) {
                this.showOrderMarker.setMap(null);
                this.showOrderMarker = null;
            }
            
            if (this.selectPathView && (this.selectPathView.order.id == order_id))
                this.selectPathView.Close();
        }
    }

    RemoveCar(id) {
        let idx = this.IndexOfByDriver(id);
        if (idx > -1) {
            if (this.selectPathView && (this.selectPathView.order.id == order_id))
                this.selectPathView.Close();
        }
        super.RemoveCar(id);
    }

    AddOrder(order, anim) {

        order.start = isStr(order.start) ? JSON.parse(order.start) : order.start;
        order.finish = isStr(order.finish) ? JSON.parse(order.finish) : order.finish;

        if (order.start.lat)
            this.#createFromOrder(toLatLng(order.start), order, anim);
        else this.ctrl.getPlaceDetails(order.start.placeId, ['location']).then((place)=>{
            order.start = Extend(order.start, place.location, ['lat', 'lng']);
            this.#createFromOrder(place.location, order, anim);
        });
    }

    AddOrders(orders) {
        for (let i in orders)
            this.AddOrder(orders[i]);
    }

    #createFromOrder(latLng, order, anim) {
        let m = this.CreateUserMarker(latLng, 'user-' + order.user_id, (()=>{
            this.#showInfoOrder(m, order);
        }).bind(this), 
                (order.driver_id == user.asDriver ? 'user-current' : 'user-marker') + 
                (anim ? ' anim' : ''));
        m.order = order;
    }

    #showInfoOrder(marker, order) {

        this.showOrderMarker = marker;
        function showPathAndInfo() {

            this.ctrl.getRoutes(order.start, order.finish, travelMode, (function(result) {
                if (this.selectPath) this.selectPath.setMap(null);
                this.selectPath = this.ctrl.DrawPath(result);
                this.showOrderMarker.setMap(null);
            }).bind(this));

            let actions = null;
            if (order.driver_id != user.asDriver) 
                actions = {
                    'Offer to perform': (() => {
                        Ajax({
                            action: 'offerToPerform',
                            data: JSON.stringify({id: order.id})
                        }).then(((response)=>{
                            if (response.result == 'ok')
                                this.selectPathView.Close();
                            else console.log(response);
                        }).bind(this));
                    }).bind(this)
                }

            this.selectPathView = viewManager.Create({
                title: "Order",
                bottomAlign: true,
                content: [
                    {
                        label: "InfoPath",
                        content: $(DataView.getOrderInfo(order, true)),
                        class: HtmlField
                    }
                ],
                actions: actions
            }, BottomView, (()=>{

                this.selectPath.setMap(null);
                this.selectPath = null;
                this.selectPathView = null;

                if (this.showOrderMarker) this.showOrderMarker.setMap(this.ctrl.map);
            }).bind(this));

            this.selectPathView.order = order;
        }

        if (this.selectPathView)
            this.selectPathView.Close().then(showPathAndInfo.bind(this));
        else showPathAndInfo.bind(this)();
    }

    ShowOrders() {
        Ajax({
            action: 'getOrders',
            data: {
                location: this.ctrl.map.position
            }
        }).then(((data)=>{
            let item;
            for (let i=0; i<data.length; i++) {
                let item = data[i];

                item.startPlace = JSON.parse(item.startPlace);
                item.finishPlace = JSON.parse(item.finishPlace);

                let latLng = { lat: item.startPlace.lat, lng: item.startPlace.lng };
                this.#createFromOrder(latLng, item);
            }
        }).bind(this));
    }

    ClearAllUsers() {
        super.ClearAllUsers();
        if (this.selectPath)
            this.selectPath.setMap(null);
    }
}