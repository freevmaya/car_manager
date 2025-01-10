var takenOrders;

class DMap extends VMap {

    tracer;
    constructor(elem) {
        super(elem, ()=>{
            takenOrders = new TakenOrders(jsdata.taken_orders);

        }, {markerManagerClass: MarkerOrderManager});
    }

    createTracer(order, routes, options) {
        this.removeTracer();
        this.tracer = new Tracer(routes, this.superSetPosition.bind(this), 200, options);
        this.tracer.ReceivePoint(new google.maps.LatLng(this.getMainPosition()));
        return this.tracer;
    }

    removeTracer() {
        if (this.tracer) {
            this.tracer.destroy();
            this.tracer = null;
        }
    }

    superSetPosition(latLng, angle = undefined) {
        super.setMainPosition(latLng, angle);
        /*
        if (this.tracer && this.tracer.order)
            transport.addExtRequest({action: 'SetRemaindDistance', 
                    data: {
                        order_id: this.tracer.order.id,
                        remaindDistance: this.tracer.RemaindDistance
                    }
                });*/
    }

    setMainPosition(latLng, angle = undefined) {
        if (this.tracer)
            this.tracer.ReceivePoint(latLng);
        else super.setMainPosition(latLng, angle);
    }
}


class TakenOrders extends EventProvider {
    #orders;
    #timerId;
    selOrderView;

    get TopOrder() { return this.#orders.length > 0 ? this.#orders[0] : null; }
    get ExecutionOrder() { return this.#orders.find((o) => o.state == 'execution'); }
    get DriverMoveOrder() { return this.#orders.find((o) => o.state == 'driver_move'); }
    get WaitMeetingOrder() { return this.#orders.find((o) => o.state == 'wait_meeting'); }

    constructor(taken_orders) {

        super();
        this.#orders = taken_orders;
        this.resortOrders();
        this.beginCheckOrders();
        this.showImportantOrder();

        transport.AddListener('notificationList', this.onNotificationList.bind(this));
    }

    onNotificationList(e) {
        let list = e.value;
        for (let i in list) {
            let item = list[i];

            if (item.content_type == "changeOrder") {
                let part_order = JSON.parse(item.text);
                this.SetState(item.content_id, part_order.state);
                transport.SendStatusNotify(item, 'read');
            }
        }
    }

    resortOrders() {

        let importanList = ['accepted', 'driver_move', 'wait_meeting', 'execution'];

        this.#orders.sort((order1, order2)=>{
            return importanList.indexOf(order2.state) - importanList.indexOf(order1.state);
        });

        this.SendEvent('CHANGE', this);
    }

    getPath(mainPoint) {

        let generator = new GraphGenerator(mainPoint ? mainPoint : v_map.getMainPosition());
        generator.AddOrders(this.#orders);

        let result = generator.getPath();

        return result;
    }

    showOrderInList() {
        for (let i=0; i<this.#orders.length; i++)
            if (['execution', 'execution', 'driver_move', 'wait_meeting'].includes(this.#orders[i].state)) {

                let idx = v_map.MarkerManager.IndexOfByOrder(this.#orders[i].id);
                this.ShowInfoOrder(v_map.MarkerManager.markers.users[idx]);
                return;
            }
    }

    showImportantOrder(order_id = null) {
        if (!this.takenOrdersView) {
            this.takenOrdersView = viewManager.Create({
                bottomAlign: true,
                template: 'takenOrderView',
                orders: this,
                actions:  {
                    'Offer to perform': 'this.offerToPerform.bind(this)',
                    'Move to start': 'this.moveToStart.bind(this)'
                }
            }, TracerOrderView, (()=>{
                this.takenOrdersView = null;
            }).bind(this));
        }

        if (this.takenOrdersView && order_id) 
            this.takenOrdersView.showOrder(order_id);
    }

    beginCheckOrders() {
        this.#timerId = setTimeout(this.checkOrders.bind(this), 1000);
    }

    IndexOfByOrder(order_id) {
        for (let i=0; i<this.#orders.length; i++)
            if (order_id == this.#orders[i].id)
                return i;
        return -1;
    }

    SetState(order_id, state) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            let order = this.#orders[idx];
            order.state = state;
            this.resortOrders();

            if (!order.changeList) order.changeList = [];
            order.changeList.push({time: Date.now(), text: JSON.stringify({state: state})});

            if (state == 'wait_meeting')
                this.beginCheckOrders();

            if (this.takenOrdersView && (this.takenOrdersView.Order.id == order_id))
                this.takenOrdersView.SetState(state);
        }
    }

    remaindDistance() {
        let result = 0;
        for (let i=0; i<this.#orders.length; i++)
            result += this.#orders[i].remaindDistance;
        return result;
    }

    count() {
        return this.#orders.length;
    }

    addOrder(order) {
        this.#orders.push(order);
    }

    removeOrder(order) {
        this.#orders.remove(order);
    }

    isShown(order_id) {
        return this.selOrderView && (this.selOrderView.Order.id == order_id);
    }

    timeState(order, state) {
        if (order.changeList)
            for (let i=0; i<order.changeList.length; i++) {
                let order_part = JSON.parse(order.changeList[i].text);
                if (order_part.state == state)
                    return order.changeList[i].time;
            }
        return false;
    }

    checkOrders() {
        for (let i=0; i<this.#orders.length; i++)
            if (this.#orders[i].state == 'wait_meeting') {
                let order = this.#orders[i];
                let time = this.timeState(order, 'wait_meeting');
                if (time) {
                    let deltaSec = Math.round((Date.now() - (isStr(time) ? Date.parse(time) : time)) / 1000);
                    if (deltaSec > MAXPERIODWAITMEETING) {

                        transport.addExtRequest({
                            action: 'SetState',
                            data: {id: order.id, state: 'expired'}
                        })

                        this.SetState(order.id, 'expired');

                    } else {

                        transport.addExtRequest({
                            action: 'GetPosition',
                            data: order.user_id
                        }, (latLng)=>{
                            let distance = Distance(latLng, order.start);
                            if (distance <= MAXDISTANCEFORMEETING)
                                transport.addExtRequest({
                                    action: 'SetState',
                                    data: {id: order.id, state: 'execution'}
                                })
                        });

                        if (this.selOrderView)
                            this.selOrderView.SetStateText('wait_meeting', (MAXPERIODWAITMEETING - deltaSec) + ' sec.');
                    }
                    this.beginCheckOrders();
                }
            }
    }

    contains(orderId) {
        return this.getOrder(orderId) != undefined;
    }

    getOrder(orderId) {
        return this.#orders.find(
            (order) => order.id == orderId
        );
    }

    ShowInfoOrder(markerOrOrderId) {

        let marker = isNumeric(markerOrOrderId) ? v_map.MarkerManager.MarkerByOrderId(markerOrOrderId) : markerOrOrderId;
        if (!marker) return;
        let order = marker.order;

        if (this.contains(order.id))
            this.showImportantOrder(order.id);
        else {

            function showPathAndInfo() {

                    this.selOrderView = viewManager.Create({
                        bottomAlign: true,
                        template: 'orderView',
                        order: order,
                        marker: marker,
                        content: [
                            {
                                label: "InfoPath",
                                content: templateClone('offerView', order),// $(DataView.getOrderInfo(order, true)),
                                class: HtmlField
                            }
                        ],
                        actions:  {
                            'Offer to perform': 'this.offerToPerform.bind(this)'
                        }
                    }, OrderView, (()=>{
                        this.selOrderView = null;
                    }).bind(this));
            }

            if (this.selOrderView) 
                this.selOrderView.Close().then(showPathAndInfo.bind(this));
            else showPathAndInfo.bind(this)();
        }
    }

    destroy() {
        clearTimeout(this.#timerId);
    }
}

class MarkerOrderManager extends MarkerManager {
    constructor(mapControl) {
        super(mapControl);

        transport.AddListener('notificationList', this.onNotificationList.bind(this));
        this.AddOrders($.extend([], jsdata.all_orders, jsdata.taken_orders));
    }

    onNotificationList(e) {
        let list = e.value;
        for (let i in list) {
            let item = list[i];

            if (item.content_type == "changeOrder") {

                let part_order = JSON.parse(item.text);

                this.SetState(item.content_id, part_order.state);
                transport.SendStatusNotify(item, 'read');
                
                switch (part_order.state) {

                    case "wait":
                        Ajax({
                            action: 'GetOrder',
                            data: item.content_id
                        }).then(((order)=>{
                            this.AddOrder(order, true);
                        }).bind(this));
                        break;

                    case "cancel":

                        this.CancelOrder(item.content_id);
                        break;
                        
                    case "finished":

                        this.CancelOrder(item.content_id);
                        break;
                        
                    case "rejected":

                        this.CancelOrder(item.content_id);
                        break;
                        
                    case "accepted":
                        
                        this.AcceptedOffer(item.content_id, part_order.driver_id);
                        break;

                    default: continue;
                }
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

    SetState(order_id, state) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1)
            $(this.markers.users[idx].content).setStateClass(state);
        
        takenOrders.SetState(order_id, state);
        if (takenOrders.isShown(order_id))
            takenOrders.selOrderView.SetState(state);
    }

    AcceptedOffer(order_id, driver_id=false) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            let m = this.markers.users[idx];

            m.order.driver_id = driver_id ? driver_id : jsdata.driver.id;

            this.Shake(m);
            $(m.content)
                .removeClass('user-marker')
                .addClass('user-current');

            if (takenOrders.isShown(order_id))
                takenOrders.selOrderView.view.addClass('taken-order');

            takenOrders.addOrder(m.order);
        }
    } 

    ShowMarkerOfOrder(order_id, order = null) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            let market = this.markers.users[idx];
            this.ctrl.map.setCenter(market.position);
            this.Shake(this.markers.users[idx]);
            /*
            if (order)
                this.ShowInfoOrder(market, order);
                */
        }
    }

    MarkerByOrderId(order_id) {
        return this.markers.users[this.IndexOfByOrder(order_id)];
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

            if (takenOrders.isShown(order_id)) {
                takenOrders.selOrderView.Close().then((()=>{
                    this.markers.users[idx].setMap(null);
                    this.markers.users.splice(idx, 1);
                }).bind(this));
                this.showOrderMarker = null;
            } else {
                this.markers.users[idx].setMap(null);
                this.markers.users.splice(idx, 1);
            }
        }
    }

    RemoveCar(id) {
        let idx = this.IndexOfByDriver(id);
        if (idx > -1) {
            if (takenOrders.selOrderView && (takenOrders.selOrderView.Order.id == this.markers.users[idx].order.id))
                takenOrders.selOrderView.Close();
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

        let extConten = DeltaTime(order.pickUpTime) <= NOWDELTASEC ? null : 
                            $('<span>' + DepartureTime(order.pickUpTime) + '</span>');

        let m = this.CreateUserMarker(latLng, 'user-' + order.user_id, (()=>{
            takenOrders.ShowInfoOrder(m);
        }).bind(this), 
                (order.driver_id == user.asDriver ? 'user-current' : 'user-marker') + 
                (anim ? ' anim' : '') + ' ' + order.state, extConten);
        m.order = order;
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
}
