class DMap extends VMap {

    tracer;

    constructor(elem, callback) {
        super(elem, callback, {markerManagerClass: MarkerOrderManager});
    }

    createTracer(routes, options) {
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
    }

    setMainPosition(latLng, angle = undefined) {
        if (this.tracer)
            this.tracer.ReceivePoint(latLng);
        else super.setMainPosition(latLng, angle);
    }
}


class TakenOrders extends OrderManager {
    #taken_orders;
    selOrderView;
    #path;
    #graph;

    get Graph() { return this.#graph; }

    get TopOrder() { return this.#taken_orders.length > 0 ? this.#taken_orders[0] : null; }
    get Path() { return this.#path; }
    get length() { return this.#taken_orders.length; }

    constructor(ordersData) {

        super(ordersData);
        this.ResetPath();
        this.showImportantOrder();
    }

    doChangeOrder(order, part_order) {
        super.doChangeOrder(order, part_order);

        if (order.driver_id == user.asDriver)
            this.ResetPath();
    }

    ResetPath(mainPoint) {

        this.#taken_orders = [];
        this.Items.forEach(((o)=>{
            if (ACTIVESTATES.includes(o.state) && (o.driver_id == user.asDriver))
                this.#taken_orders.push(o);
        }).bind(this));

        this.#taken_orders.sort((order1, order2)=>{
            return ACTIVESTATES.indexOf(order2.state) - ACTIVESTATES.indexOf(order1.state);
        });
        
        this.#graph = new GraphGenerator(mainPoint ? mainPoint : v_map.getMainPosition());

        if (this.#taken_orders.length > 0) {
            this.#graph.AddOrders(this.#taken_orders);

            this.#path = this.#graph.getPath();
            for (let i=0; i<this.#path.length; i++)
                if (this.#path.start)
                    this.#path.start.sort = i;

            this.#taken_orders.sort((order1, order2)=>{
                return order1.sort - order2.sort;
            });
        } else this.#path = [];

        this.SendEvent('CHANGE_PATH', this.#path);

        return this.#path;
    }

    showImportantOrder(order_id = null) {
        if (!this.takenOrdersView) {
            this.takenOrdersView = viewManager.Create({
                bottomAlign: true,
                template: 'takenOrderView',
                orders: this,
                actions:  {}
            }, TracerOrderView, (()=>{
                this.takenOrdersView = null;
            }).bind(this));
        }

        if (this.takenOrdersView && order_id) 
            this.takenOrdersView.togglePathOrder(order_id);
    }

    remaindDistance() {
        let result = 0;
        for (let i=0; i<this.#taken_orders.length; i++)
            result += this.#taken_orders[i].remaindDistance;
        return result;
    }

    isShown(order_id) {
        return this.selOrderView && (this.selOrderView.Order.id == order_id);
    }

    ShowInfoOrder(markerOrOrderId) {

        let marker = isNumeric(markerOrOrderId) ? v_map.MarkerManager.MarkerByOrderId(markerOrOrderId) : markerOrOrderId;
        if (!marker) return;
        let order = marker.order;

        if (this.#taken_orders.find((e) => e.id == order.id))
            this.showImportantOrder(order.id);
        else {

            let actions = {};

            if (['expired', 'accepted'].includes(order.state) && (parseInt(order.driver_id) == user.asDriver))
                $.extend(actions, {
                    'Continue': 'this.continueOrder.bind(this)'
                });

            if (order.state == 'wait')
                $.extend(actions, {
                    'Offer to perform': 'this.offerToPerform.bind(this)'
                });

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
                    actions: actions
                }, OrderView, (()=>{
                    this.selOrderView = null;
                }).bind(this));
            }

            if (this.selOrderView) 
                this.selOrderView.Close().then(showPathAndInfo.bind(this));
            else showPathAndInfo.bind(this)();
        }
    }
}

class MarkerOrderManager extends MarkerManager {
    constructor(mapControl) {
        super(mapControl);

        afterCondition(()=>{
            return orderManager != null;
        }, (()=>{
            this.AddOrders(orderManager.Items);
            orderManager.AddListener('CREATED_ORDER', this.onAfterCreateOrder.bind(this));
            orderManager.AddListener('CHANGE_ORDER', this.onChangeOrder.bind(this));
        }).bind(this));

        //transport.AddListener('notificationList', this.onNotificationList.bind(this));
        //$.extend([], jsdata.all_orders, jsdata.taken_orders));
    }

    onAfterCreateOrder(e) {
        this.AddOrder(e.value, true);
    }

    onChangeOrder(e) {
        let order = e.value;
        this.#updateMarkerState(order);
        if (['cancel', 'finished', 'rejected'].includes(order.state))
            this.CancelOrder(order.id);
        else if (order.state == "accepted")
            this.AcceptedOffer(order.id);
    }


    #updateMarkerState(order) {
        let idx = this.IndexOfByOrder(order.id);
        if (idx > -1) {
            let m = this.markers.users[idx];
            $(m.content).setStateClass(order.state);
        }
    }

    AcceptedOffer(order_id) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            let m = this.markers.users[idx];

            this.Shake(m);
            $(m.content)
                .removeClass('user-marker')
                .addClass('user-current');
        }
    } 

    CancelOrder(order_id) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            this.markers.users[idx].setMap(null);
            this.markers.users.splice(idx, 1);
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

    ShowMarkerOfOrder(order_id, order = null) {
        let idx = this.IndexOfByOrder(order_id);
        if (idx > -1) {
            let market = this.markers.users[idx];
            this.ctrl.map.setCenter(market.position);
            this.Shake(this.markers.users[idx]);
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

    RemoveCar(id) {
        let idx = this.IndexOfByDriver(id);
        if (idx > -1) {
            if (orderManager.selOrderView && (orderManager.selOrderView.Order.id == this.markers.users[idx].order.id))
                orderManager.selOrderView.Close();
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

        let m = this.CreateUserMarker(latLng, 'order/user: ' + (order.id + '/' + order.user_id), (()=>{
            orderManager.ShowInfoOrder(m);
        }).bind(this), 
                (order.driver_id == user.asDriver ? 'user-current' : 'user-marker') + 
                (anim ? ' anim' : '') + ' ' + order.state, extConten);
        m.order = order;
    }
}
