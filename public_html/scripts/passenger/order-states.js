class ViewPath extends BottomView {
    routes;
    rpath;
    travelMode = travelMode;

    setOptions(options) {
        super.setOptions(options);
        if (options.path)
            this.setPathData(options.path);
    }

    #setRoutes(routes) {
        if (v_map)
            this.setPath(v_map.DrawPath(this.routes = routes, currentPathOptions));
    }

    getRoutes() {
        return this.routes;
    }

    showPath(startPlace, finishPlace, routes, afterRequest = null) {
        this.closePath();

        function afterGetRoutes(result) {
            this.#setRoutes(result);
            if (afterRequest) afterRequest();
        }

        if (isEmpty(routes) && v_map) 
            v_map.getRoutes(startPlace, finishPlace, this.travelMode, afterGetRoutes.bind(this));
        else afterGetRoutes.bind(this)(routes);
    }

    setPathData(data) {
        this.rpath = data.rpath;
        this.routes = data.routes;
    }

    getPathData() {
        return {
            rpath: this.rpath,
            routes: this.routes
        }
    }

    setPath(value) {
        this.closePath();
        this.rpath = value;
    }

    closePath() {
        if (this.rpath) {
            this.rpath.setMap(null);
            this.rpath = null;
        }
    }

    destroy() {
        this.closePath();
        super.destroy();
    }
}


class OrderView extends ViewPath {
    #lastState = 'wait';
    #listenerNfId;
    #listenerSdId;

    get LastState() { return this.#lastState; }
    get orderState() { return this.Order && this.Order.state ? this.Order.state : 'wait'; };
    get Order() { return this.options.order; }

    initView() {
        super.initView();
        this.view.addClass('order');
    }

    constructor(options = {actions: {}}, afterDestroy = null) {
        super(options, afterDestroy);

        if (options.path)
            this.setPathData(options.path);

        if (options.order) 
            this.SetOrder(options.order);

        this.#listenerNfId = transport.AddListener('notificationList', ((e)=>{
            this.onReceiveNotifyList(e.value);
        }).bind(this));

        this.#listenerSdId = transport.AddListener('SuitableDrivers', ((e)=>{
            this.onSuitableDrivers(e.value);
        }).bind(this));

        //this.onReceiveRemaindDistance(this.Order.remaindDistance);
    }

    afterConstructor() {
        super.afterConstructor();
        this.onReceiveNotifyList(jsdata.notificationList);
    }

    onReceiveRemaindDistance(data) {
        if (data) {
            console.log(data);
        }

        transport.addExtRequest({
            action: 'GetRemaindDistance',
            data: this.Order.id
        }, this.onReceiveRemaindDistance.bind(this));
    }

    onReceiveNotifyList(list) {
        for (let i in list) {
            if (list[i].content_type == 'changeOrder') {

                let part_order = JSON.parse(list[i].text);

                if (part_order.state == 'wait')
                    this.Order.id = list[i].content_id;

                transport.SendStatusNotify(list[i], 'read');

                if (list[i].content_id == this.Order.id) {
                    if (['accepted', 'driver_move'].includes(part_order.state) && !this.Order.driver_id) {
                        Ajax({
                            action: 'getOrder',
                            data: {id: this.Order.id}
                        }).then(((order)=>{
                            this.changeOrder(order);
                        }).bind(this));
                    } else this.changeOrder(part_order);
                }
            }
        }
    }

    checkDistanceToStart(d) {
        return Distance(this.Order.start, v_map.getMainPosition()) < MAXDISTANCEFORMEETING;
    }

    onSuitableDrivers(drivers) {
        for (let i in drivers) {
            if (drivers[i].order_id && (drivers[i].order_id == this.Order.id)) 
                this.contentElement.find('.remaindDistance').text(DistanceToStr(drivers[i].remaindDistance));
        }
    }

    changeOrder(order) {
        this.#lastState = this.orderState;
        if (this.Order) order = $.extend(this.Order, order);
        this.SetOrder(order);
    }


    SetOrder(order) {

        if (order) {

            if (order.state == 'finished') {
                if (typeof(v_map) != 'undefined') {
                    let listener = v_map.map.addListener('click', ((e)=>{
                        listener.remove();
                        this.Close();
                    }).bind(this));
                    this.closePath();
                }
            }
            else {

                if (order.travelMode)
                    this.travelMode = order.travelMode;
                
                order.start = toPlace(order.start);
                order.finish = toPlace(order.finish);

                if (!this.rpath && !this.options.path) 
                    this.showPath(order.start, order.finish, order.route);
            }

            this.options.order = order;
        } else {
            this.closePath();
            this.options.order = null;
        }
    }

    prepareToClose(afterPrepare) {

        if (this.Order.id && (this.Order.state != 'finished'))
            app.showQuestion('Do you want to cancel your order?', (()=>{
                    Ajax({
                        action: 'SetState',
                        data: JSON.stringify({id: this.Order.id, state: 'cancel'})
                    }).then(((data)=>{

                        if (data.result && (data.result.state == 'cancel'))
                            super.prepareToClose(afterPrepare);
                        else console.error(data);

                    }).bind(this));
            }).bind(this));
        else super.prepareToClose(afterPrepare);
    }

    destroy() {
        transport.RemoveListener(this.#listenerNfId);
        transport.RemoveListener(this.#listenerSdId);
        super.destroy();
    }
}

class SelectPathView extends ViewPath {

    order;

    setOptions(options) {
        options = $.extend({
            title: toLang('Route'),
            template: 'target-view'
        }, options);

        super.setOptions(options);
    }

    initView() {
        super.initView();
        this.view.find('.btn-block .go')
                .click(this.Go.bind(this));

        this.fillText(this.options.startPlace, 'startPlace');

        this.pickUpTime = new DateTime(this.view.find('.DateTime'));
    }

    GetPath() {
        return GetPath(this.getRoutes(), this.options.startPlace, this.options.finishPlace);
    }

    GetOrder() {
        return this.order;
    }

    Go() {

        if (this.order = this.GetPath()) {

            let data = {
                user_id: user.id,
                path: this.order,
                pickUpTime: this.pickUpTime.val(),
                seats: this.view.find('select[name="seats"]').val()
            }

            Ajax({
                action: "AddOrder",
                data: data
            }).then(((response)=>{
                if (response.result > 0) {
                    this.order.id = response.result;
                    this.options.callback(this.order);
                    this.rpath = null;
                    this.Close();
                } else this.trouble(response);
            }).bind(this));
        } else this.trouble('Select path please');
    }

    fillText(place, id) {
        let field = this.view.find('div[data-id="' + id + '"]');
        field.find('p')
            .text(PlaceName(place));
        field.find('.infoView')
            .addClass('showInfo')
            .text(PlaceAddress(place));
    }

    SelectPlace(finishPlace) {
        this.showPath(this.options.startPlace, this.options.finishPlace = finishPlace, null, (()=>{
            
            this.fillText(finishPlace, 'finishPlace');
            this.footerElement.find('button').prop('disabled', false);
            
            ViewManager.resizeMap(this.windows);

        }).bind(this));
    }
}

class OrderAccepedView extends OrderView {
    pathToStartNotify;
    pathToStart;
    #offers;
    #time;
    #allowOffers;
    #offersTimerId;
    listenerPosId;

    get allowOffers() { return this.#allowOffers; }
    set allowOffers(value) { 
        if (this.#allowOffers = value) {
            this.#time = Date.now();
            this.#offers = [];
            this.#offersTimerId = setInterval(this.checkBestOffer.bind(this), 1000);
        } else clearInterval(this.#offersTimerId);
    }

    constructor(options = {actions: {}}, afterDestroy = null) {
        super(options, afterDestroy);
        this.allowOffers = this.orderState == 'wait';

        transport.requireDrivers = true;
    }

    resetLayer() {
        this.contentElement.empty();
        this.orderLayer = templateClone('order', this.Order);
        this.contentElement
            .append(this.orderLayer);
        if (this.Order.car_color) this.refreshColor();
    }

    changeOrder(order) {
        super.changeOrder(order);
        if (v_map)
            v_map.visMainMarker(this.orderState != 'execution');
    }

    SetOrder(order) {
        super.SetOrder(order);

        if (!this.orderLayer || ['accepted', 'driver_move'].includes(order.state)) 
            this.resetLayer();

        this.view
            .removeClass(this.LastState)
            .addClass(this.orderState);
            
        this.orderLayer
            .find('.state').text(toLang(this.orderState))
            .find('.distance').text(DistanceToStr(this.Order.meters));

        ViewManager.resizeMap(this.windows);

        if ((this.LastState == 'accepted') && (this.pathToStartNotify)) {
            this.closePathToStart();
            transport.SendStatusNotify(this.pathToStartNotify, 'read');
        }

        if (this.orderState == 'wait_meeting')
            this.beginSendMainPosition();
        else this.stopSendMainPosition();
    }

    stopSendMainPosition() {
        if (this.listenerPosId) {
            app.enableGeo(false);
            app.RemoveListener(this.listenerPosId);
            this.listenerPosId = false;
        }
    }

    beginSendMainPosition() {
        app.enableGeo(true);
        this.listenerPosId = app.AddListener('GEOPOS', this.sendMainPosition.bind(this));
    }

    sendMainPosition(coordinates) {
        transport.addExtRequest({
            action: 'setPosition',
            data: toLatLng(coordinates)
        });
    }

    checkBestOffer() {

        if (this.orderState == 'wait') {
            if ((DeltaTime(this.#time) < -WAITOFFERS) && (this.#offers.length > 0)) {
                this.allowOffers = false;
                let nearIx = 0;
                let bestDistance = Number.MAX_VALUE;
                let start = toPlace(this.Order.start);

                if (this.#offers.length > 1) {
                    for (let i=0; i<this.#offers.length; i++) {
                        let offer = this.#offers[i];
                        let driverInfo = JSON.parse(offer.text);

                        let distance = Distance(offer.driver, start);
                        if (driverInfo.remaindDistance)
                            distance += driverInfo.remaindDistance;

                        if (distance < bestDistance) {
                            bestDistance = distance;
                            nearIx = i;
                        }
                        //transport.SendStatusNotify(offer);
                    }
                } else {
                    bestDistance = Distance(this.#offers[nearIx].driver, start);
                }

                let bestOffer = this.#offers[nearIx];
                bestOffer.distance = bestDistance;

                this.#offers.splice(nearIx, 1);
                for (let i=0; i<this.#offers.length; i++)
                    transport.SendStatusNotify(this.#offers[i], 'read');

                this.#offers = [];
                this.takeOffer(bestOffer);
            }
        } else this.allowOffers = false;
    }

    offersProcess(list) {

        for (let i in list) {
            let notify = list[i];
            if (notify.content_type == "offerToPerform") {
                if ((notify.content_id == this.Order.id) && (this.offerIndexOf(notify.id) == -1))
                    this.addOfferNotify(notify);
                else transport.SendStatusNotify(this.pathToStartNotify, 'rejected');
            }
        }

        this.checkBestOffer();
    }

    offerIndexOf(notify_id) {
        for (let i=0; i<this.#offers.length; i++)
            if (this.#offers[i].id == notify_id)
                return i;
        return -1;
    }

    addOfferNotify(notify) {
        notify.driver = JSON.parse(notify.text);
        this.#offers.push(notify);
        this.orderLayer.find('#offer-count').text(this.#offers.length);
    }

    takeOffer(notify) {
        let infoBlock = this.orderLayer.find('.driver-info');

        infoBlock.empty();
        infoBlock.append(templateClone('driver', notify.driver));

        this.refreshColor();
        let d = notify.driver;

        if (d && d.id) {
            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, driver_id: d.id, state: 'accepted' }
            }).then(((data) => {

                if (data.result) {
                    this.SetOrder($.extend(this.Order, {
                        state: 'accepted',
                        driverId: d.id,
                        driverName: d.username,
                        number: d.number,
                        comfort: d.comfort,
                        seating: d.seating,
                        car_body: d.car_body,
                        car_color: d.car_color,
                        car_colorName: d.car_colorName,
                        available_seat: d.available_seat
                    }));
                    transport.SendStatusNotify(notify, 'read');
                } else this.trouble("Error accepted order");

            }).bind(this));
        } else this.trouble("Undefined driver");
    }

    refreshColor() {
        if (this.Order.car_color)
            this.orderLayer.find(".param .item-image").each((i, elem)=>{
                elem = $(elem);

                const color = new Color(hexToRgb(this.Order.car_color));
                const solver = new Solver(color);
                const result = solver.solve();
                elem.attr("style", elem.attr("style") + ";" + result.filter);
            });
    }

    onReceiveNotifyList(list) {

        super.onReceiveNotifyList(list);

        if (this.allowOffers) this.offersProcess(list);

        for (let i in list)
            if ((list[i].content_type == 'pathToStart') && (list[i].state == 'active'))
                if (this.Order.state == 'accepted') {
                    if (!this.pathToStartNotify) {
                        this.pathToStartNotify = list[i];
                        if (v_map)
                            this.drawPathToStart(list[i].text);
                    }
                } else transport.SendStatusNotify(list[i], 'read');
    }

    drawPathToStart(jsonPath) {
        this.closePathToStart();
        this.pathToStart = v_map.DrawPath(JSON.parse(jsonPath));
    }

    closePathToStart() {
        if (this.pathToStart) {
            this.pathToStart.setMap(null);
            this.pathToStart = null;
        }
    }

    destroy() {
        this.allowOffers = false;
        this.closePath();
        this.closePathToStart();
        super.destroy();
    }
}

class Passenger extends Component {
    constructor(order) {
        super();
        if (typeof jsdata.currentOrder == 'object') {
            this.BeginAcceptedOrder(order);
        } else this.BeginSelectPath();
    }

    BeginAcceptedOrder(order, passedPathData = null) {
        let dialog = viewManager.Create({
            path: passedPathData,
            bottomAlign: true,
            order: order,
            title: toLang('Order')
        }, OrderAccepedView, this.BeginSelectPath.bind(this));
    }

    BeginSelectPath() {
        var selectPathDialog;
        var listener;
        let This = this;

        function onClickMap(e) {
            if (e.placeId) {
                v_map.getPlaceDetails(e.placeId).then((place)=>{
                    place = $.extend(place, e);
                    SelectPlace(place);
                });
            } else SelectPlace(e);
            
            return StopPropagation(e);
        }

        function SelectPlace(place) {

            if (!selectPathDialog) {
                v_map.setMainPosition(place.latLng);

                selectPathDialog = viewManager.Create({
                    startPlace: place,
                    bottomAlign: true,
                    callback: (order)=>{
                        listener.remove();
                        This.BeginAcceptedOrder(jsdata.currentOrder = order, 
                                            selectPathDialog.getPathData());
                    }
                }, SelectPathView, () => {
                    selectPathDialog = null;
                });
            } else selectPathDialog.SelectPlace(place);
        }

        listener = v_map.map.addListener("click", onClickMap);
    }
}

function createOrderList(layer, orders) {
    for (let i=0; i<orders.length; i++) {
        viewManager.Create({
            parent: layer,
            order: orders[i],
            title: toLang('Order')
        }, OrderAccepedView);
    }
}