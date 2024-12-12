var managerOrders;

class DMap extends VMap {

    tracer;
    constructor(elem) {
        super(elem, ()=>{

            transport.AddListener('notificationList', 
                    v_map.MarkerManager.onNotificationList.bind(v_map.MarkerManager));

            v_map.MarkerManager.AddOrders(jsdata.all_orders);
            managerOrders = new ManagerOrders(jsdata.taken_orders);

        }, {markerManagerClass: MarkerOrderManager});
    }

    createTracer(routes, onFinished) {
        this.removeTracer();
        this.tracer = new Tracer(routes, super.setMainPosition.bind(this), 100);
        this.tracer.ReceivePoint(new google.maps.LatLng(this.getMainPosition()));
        this.tracer.AddListener('FINISHPATH', onFinished);
        return this.tracer;
    }

    removeTracer() {
        if (this.tracer) {
            this.tracer.destroy();
            this.tracer = null;
        }
    }

    setMainPosition(latLng) {
        if (this.tracer)
            this.tracer.ReceivePoint(latLng);
        else super.setMainPosition(latLng);
    }
}


class ManagerOrders {
    #orders;
    constructor(my_orders) {
        this.#orders = my_orders;
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
}

class OrderView extends BottomView {

    #tracerOrder;
    #tracerToStart;
    #pathToStart;
    #pathOrder;
    get Order() { return this.options.order; };

    get isMyOrder() { return this.Order.driver_id == jsdata.driver.id; };

    initView() {
        super.initView();

        this.view.addClass("orderView");
        if (this.isMyOrder)
            this.view.addClass("taken-order");
    }

    afterConstructor() {
        super.afterConstructor();
        this.SetState(this.Order.state);
    }

    setOptions(options) {
        super.setOptions(options);
        this.options.marker.setMap(null);
    }

    SetState(state) {
        this.view.removeClass('wait accepted driver_move wait_meeting execution finished');
        this.view.addClass(this.Order.state = state);
        $('#state-' + this.Order.id).text(toLang(state));

        this.closePathOrder();
        this.#pathOrder = v_map.DrawPath(this.options.path, state == 'execution' ? currentPathOptions : defaultPathOptions);

        if (state == 'driver_move')
            this.showPathToStart();
        else if ((state == 'execution') && this.isMyOrder)
            this.#tracerOrder = v_map.createTracer(this.options.path.routes, this.onFinishPathOrder.bind(this));

        this.afterResize();
    }

    destroy() {
        if (this.Order.state != 'finished')
            this.options.marker.setMap(v_map.map);

        this.closePathToStart();
        this.closePathOrder();
        super.destroy();
    }

    offerToPerform() {

        v_map.getRoutes(Extend({}, user, ['lat', 'lng']), this.options.order.start, this.options.order.travelMode, ((result)=>{

            Ajax({
                action: 'offerToPerform',
                data: JSON.stringify({id: this.Order.id, remaindDistance: result.routes[0].legs[0].distance.value + managerOrders.remaindDistance()})
            }).then(((response)=>{
                if (response.result != 'ok')
                    this.trouble(response);
            }).bind(this));
        }).bind(this));
    }

    closePathToStart() {
        if (this.#pathToStart) {
            this.#pathToStart.setMap(null);
            this.#pathToStart = null;
        }

        if (this.#tracerToStart) {
            v_map.removeTracer(this.#tracerToStart);
            this.#tracerToStart = null;
        }
    }

    closePathOrder() {
        if (this.#pathOrder) {
            this.#pathOrder.setMap(null);
            this.#pathOrder = null;
        }

        if (this.#tracerOrder) {
            v_map.removeTracer(this.#tracerOrder);
            this.#tracerOrder = null;
        }
    }

    showPathToStart(afterShow) {
        this.closePathToStart();

        v_map.getRoutes(v_map.getMainPosition(), this.options.order.start, this.options.order.travelMode, ((result)=>{
            this.#pathToStart = v_map.DrawPath(result, currentPathOptions);
            if (afterShow) afterShow();

            if (this.isMyOrder)
            this.#tracerToStart = v_map.createTracer(result.routes, this.onFinishPathToStart.bind(this));
        }).bind(this));
    }

    moveToStart() {
        this.showPathToStart((()=>{

            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, state: 'driver_move'}
            }).then(((response)=>{
                if (response.result != 'ok')
                    this.trouble(response);
            }).bind(this));
            
        }).bind(this));
    }

    onFinishPathOrder(tracer) {
        if (this.#pathOrder) {
            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, state: 'finished'}
            });
            this.closePathOrder();
        }
    }

    onFinishPathToStart(tracer) {
        if (this.#pathToStart) {
            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, state: 'wait_meeting'}
            });
            this.closePathToStart();
        }
    }
}

class MarkerOrderManager extends MarkerManager {
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
            this.markers.users[idx].order.state = state;
            
        if (this.selOrderView && (this.selOrderView.Order.id == order_id))
            this.selOrderView.SetState(state);
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

            if (this.selOrderView)
                this.selOrderView.view.addClass('taken-order');

            managerOrders.addOrder(m.order);
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

            if (this.selOrderView) {
                this.selOrderView.Close().then((()=>{
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
            if (this.selOrderView && (this.selOrderView.Order.id == this.markers.users[idx].order.id))
                this.selOrderView.Close();
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
            this.#showInfoOrder(m);
        }).bind(this), 
                (order.driver_id == user.asDriver ? 'user-current' : 'user-marker') + 
                (anim ? ' anim' : ''));
        m.order = order;
        if (order.driver_id == jsdata.driver.id)
            this.#showInfoOrder(m);
    }

    #showInfoOrder(marker) {

        let order = marker.order;
        function showPathAndInfo() {

            this.ctrl.getRoutes(order.start, order.finish, travelMode, (function(result) {
                this.selOrderView = viewManager.Create({
                    title: "Order",
                    bottomAlign: true,
                    order: order,
                    path: result,
                    marker: marker,
                    content: [
                        {
                            label: "InfoPath",
                            content: templateClone($('.templates .orderInfo'), order),// $(DataView.getOrderInfo(order, true)),
                            class: HtmlField
                        }
                    ],
                    actions:  {
                        'Offer to perform': 'this.offerToPerform.bind(this)',
                        'Move to start': 'this.moveToStart.bind(this)'
                    }
                }, OrderView, (()=>{
                    this.selOrderView = null;
                }).bind(this));

            }).bind(this));
        }

        if (this.selOrderView) 
            this.selOrderView.Close().then(showPathAndInfo.bind(this));
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
}
