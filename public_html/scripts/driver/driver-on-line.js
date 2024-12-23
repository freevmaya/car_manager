var takenOrders;

class DMap extends VMap {

    tracer;
    constructor(elem) {
        super(elem, ()=>{

            transport.AddListener('notificationList', 
                    v_map.MarkerManager.onNotificationList.bind(v_map.MarkerManager));

            v_map.MarkerManager.AddOrders($.extend([], jsdata.all_orders, jsdata.taken_orders));
            takenOrders = new TakenOrders(jsdata.taken_orders);

        }, {markerManagerClass: MarkerOrderManager});
    }

    createTracer(order, routes) {
        this.removeTracer();
        this.tracer = new Tracer(routes, this.superSetPosition.bind(this), 100);
        this.tracer.order = order;
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

        if (this.tracer && this.tracer.order)
            transport.addExtRequest({action: 'SetRemaindDistance', 
                    data: {
                        order_id: this.tracer.order.id,
                        remaindDistance: this.tracer.RemaindDistance
                    }
                });
    }

    setMainPosition(latLng, angle = undefined) {
        if (this.tracer)
            this.tracer.ReceivePoint(latLng);
        else super.setMainPosition(latLng, angle);
    }
}


class TakenOrders {
    #orders;
    #timerId;
    selOrderView;
    constructor(taken_orders) {
        this.#orders = taken_orders;
        this.beginCheckOrders();
        this.showImportantOrder();
    }

    showImportantOrder() {
        for (let i=0; i<this.#orders.length; i++)
            if (['execution', 'driver_move', 'wait_meeting'].includes(this.#orders[i].state)) {

                let idx = v_map.MarkerManager.IndexOfByOrder(this.#orders[i].id);
                this.ShowInfoOrder(v_map.MarkerManager.markers.users[idx]);
                return;
            }
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
            if (!order.changeList) order.changeList = [];
            order.changeList.push({time: Date.now(), text: JSON.stringify({state: state})});

            if (state == 'wait_meeting')
                this.beginCheckOrders();
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

    ShowInfoOrder(markerOrOrderId) {

        let marker = isNumeric(markerOrOrderId) ? v_map.MarkerManager.MarkerByOrderId(markerOrOrderId) : markerOrOrderId;
        if (!marker) return;
        let order = marker.order;
        function showPathAndInfo() {

            v_map.getRoutes(order.start, order.finish, travelMode, (function(result) {
                this.selOrderView = viewManager.Create({
                    title: $('<span class="place">' + PlaceName(order.start) + '</span><span class="to"></span><span class="place">' + 
                                        PlaceName(order.finish) + '</span>'),
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
                        'Move to start': 'this.moveToStart.bind(this)',
                        'Reject': 'this.reject.bind(this)',
                        'Go': 'this.letsGot.bind(this)'
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

    destroy() {
        clearTimeout(this.#timerId);
    }
}

class OrderView extends BottomView {

    #tracerOrder;
    #tracerToStart;
    #pathToStart;
    #pathOrder;
    #isDrive;
    #updateListenerId;
    get Order() { return this.options.order; };
    get isMyOrder() { return this.Order.driver_id == jsdata.driver.id; };
    get isDrive() { return this.#isDrive; };
    set isDrive(value) { 
        if (this.#isDrive != value) {
            this.#isDrive = value;
            $(v_map.MainMarker.content)
                .toggleClass('position', !value)
                .toggleClass('driver-position', value);

            v_map.CameraFollowPath = value;

            if (value)
                this.#updateListenerId = v_map.AddListener('UPDATE', this.onUpdateMap.bind(this));
            else v_map.RemoveListener('UPDATE', this.#updateListenerId);
        }
    };

    get currentTracer() {
        return this.#tracerOrder ? this.#tracerOrder : (this.#tracerToStart ? this.#tracerToStart : null);
    }

    constructor(elem, callback = null, options) {
        super(elem, callback, options);
    }

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

    SetStateText(state, ext=null) {
        $('#state-' + this.Order.id).text(toLang(state) + (ext ? (" " + ext) : ''));
    }

    SetState(state) {
        let lastState = this.Order.state;

        this.view.removeClass('wait accepted driver_move wait_meeting execution finished');
        this.view.addClass(this.Order.state = state);
        this.SetStateText(state);

        this.view
            .removeClass(lastState)
            .addClass(state);

        this.closePathOrder();

        if ((state != 'finished') && !this.#pathOrder)
            this.#pathOrder = v_map.DrawPath(this.options.path, this.isMyOrder ? currentPathOptions : defaultPathOptions);

        if (state == 'driver_move')
            this.showPathToStart();
        else if ((state == 'execution') && this.isMyOrder) {
            this.#tracerOrder = v_map.createTracer(this.Order, this.options.path.routes);

            this.#tracerOrder.AddListener('FINISHPATH', this.onFinishPathOrder.bind(this));
            this.#tracerOrder.AddListener('CHANGESTEP', this.onChangeStep.bind(this));
        } else if (state == 'accepted') this.checkNearPassenger();

        setTimeout(this.resizeMap.bind(this), 500);

        this.isDrive = (state == 'driver_move') || (state == 'execution');
    }

    onChangeStep() {
        let tracer = this.currentTracer;
        this.view.find('.stepInfo .instruction').html(tracer.NextStep ? tracer.NextStep.instructions : '');
    }

    onUpdateMap() {

        let tracer = this.currentTracer;
        if (tracer) {
            this.view.find('.orderDetail .remaindDistance').text(DistanceToStr(tracer.RemaindDistance));
            this.view.find('.orderDetail .remaindTime').text(tracer.RemaindTime.toHHMMSS());
            this.view.find('.orderDetail .avgSpeed').text(round(tracer.AvgSpeed * 3.6, 1) + "km/h");

            let remaindDistance = tracer.Step ? (tracer.Step.finishDistance - tracer.RouteDistance) : 0;
            let elem = this.view.find('.stepInfo .remaindDistance');
            elem.text(DistanceToStr(remaindDistance));
            elem.toggleClass('dist-warning', remaindDistance < 100);
        }
    }

    destroy() {
        if (this.Order.state != 'finished')
            this.options.marker.setMap(v_map.map);

        this.isDrive = false;

        this.closePathToStart();
        this.closePathOrder();
        super.destroy();
    }

    offerToPerform(e) {
        this.blockClickTemp(e, 10000);

        v_map.getRoutes(Extend({}, user, ['lat', 'lng']), this.options.order.start, this.options.order.travelMode, ((result)=>{

            Ajax({
                action: 'offerToPerform',
                data: JSON.stringify({id: this.Order.id, remaindDistance: result.routes[0].legs[0].distance.value + takenOrders.remaindDistance()})
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

    checkNearPassenger() {
        let distance = Distance(v_map.getMainPosition(), this.options.order.start);

        if (distance <= MAXDISTANCEFORMEETING) {
            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, state: 'wait_meeting'}
            });
            return true;
        }
        return false;
    }

    showPathToStart(afterShow) {
        this.closePathToStart();

        let distance = Distance(v_map.getMainPosition(), this.options.order.start);

        if (!this.checkNearPassenger()) {

            v_map.getRoutes(v_map.getMainPosition(), this.options.order.start, this.options.order.travelMode, ((result)=>{
                this.#pathToStart = v_map.DrawPath(result, pathToStartOptions);
                if (afterShow) afterShow();

                if (this.isMyOrder) {
                    this.#tracerToStart = v_map.createTracer(this.options.order, result.routes);

                    this.#tracerToStart.AddListener('FINISHPATH', this.onFinishPathToStart.bind(this));
                    this.#tracerToStart.AddListener('CHANGESTEP', this.onChangeStep.bind(this));
                }
            }).bind(this));
        }
    }

    moveToStart(e) {
        this.blockClickTemp(e, 10000);
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

    reject() {
        Ajax({
            action: 'SetState',
            data: {id: this.Order.id, state: 'rejected'}
        });
    }

    letsGot() {
        Ajax({
            action: 'SetState',
            data: {id: this.Order.id, state: 'execution'}
        });
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

                        if (!(takenOrders.selOrderView && takenOrders.selOrderView.isDrive)) {
                            let idx = this.IndexOfByOrder(item.content_id);

                            if (idx > -1)
                                this.Shake(this.markers.users[idx]);
                            else {
                                Ajax({
                                    action: 'GetOrder',
                                    data: item.content_id
                                }).then(((order)=>{
                                    this.AddOrder(order, true);
                                }).bind(this));
                            }
                        }
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

            if (order)
                this.ShowInfoOrder(market, order);
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
        let m = this.CreateUserMarker(latLng, 'user-' + order.user_id, (()=>{
            takenOrders.ShowInfoOrder(m);
        }).bind(this), 
                (order.driver_id == user.asDriver ? 'user-current' : 'user-marker') + 
                (anim ? ' anim' : ''));
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
