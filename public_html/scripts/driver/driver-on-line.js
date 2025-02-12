class DMap extends VMap {

    tracer;
    #geoCircle;

    constructor(elem, callback) {
        super(elem, callback, {markerManagerClass: MarkerOrderManager});
        app.enableGeo(true);
        app.ScreenLock();
    }

    afterInitMap() {
        super.afterInitMap();

        if (DEV) {
            this.map.addListener('click', ((e)=>{
                this.onGeoPos(toCoordinates(e.latLng, Math.random() * 400));
            }).bind(this));
        } else app.AddListener('GEOPOS', this.onGeoPos.bind(this));
    }

    createTracer(routes, options) {
        this.removeTracer();
        this.tracer = new Tracer(routes, this.setMainPosition.bind(this), 200, options);
        this.tracer.ReceivePoint(toCoordinates(this.getMainPosition()));
        return this.tracer;
    }

    removeTracer() {
        if (this.tracer) {
            this.tracer.destroy();
            this.tracer = null;
        }
    }

    #clearClearCircle() {
        if (this.#geoCircle) {
            this.#geoCircle.destroy();;
            this.#geoCircle = null;
        }
    }

    onGeoPos(coordinates) {

        if (!DEV)
            Ajax({
                action: 'setGeoPos',
                data: coordinates
            });

        let latLng = toLatLngF(coordinates);
        
        if (!this.#geoCircle)
            this.#geoCircle = new GeoCoordinates(this.map);

        this.#geoCircle.set(coordinates);
        
        if (this.tracer)
            this.tracer.ReceivePoint(coordinates);
        else this.setMainPosition(latLng, this.tracer ? this.tracer.Angle : 0);
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
    }

    onAfterCreateOrder(e) {
        this.AddOrder(e.value, true);
    }

    onChangeOrder(e) {
        let order = e.value;
        this.#updateMarkerState(order);
        if (['cancel', 'finished', 'rejected'].includes(order.state))
            this.CancelOrder(order.id);
        else this.#chageStateMarker(order.id);
    }


    #updateMarkerState(order) {
        $(this.MarkerByOrderId(order.id).content).setStateClass(order.state);
    }

    #chageStateMarker(order_id) {
        this.Shake(this.MarkerByOrderId(order_id));
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

        let extConten = order.isPickUpNow ? null : 
                            $('<span>' + DepartureTime(order.pickUpTime) + '</span>');

        let m = this.CreateUserMarker(latLng, 'order/user: ' + (order.id + '/' + order.user_id), (()=>{
            orderManager.ShowInfoOrder(m);
        }).bind(this), 'user-marker' + (anim ? ' anim' : '') + ' ' + order.state, extConten);
        m.order = order;
    }
}
