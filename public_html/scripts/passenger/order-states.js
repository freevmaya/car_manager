class BaseOrderField {
    constructor(field) {
        this.field = field;
        this.field.closest('.view').on('destroy', this.onDestroy.bind(this));
        this.order_id = field.data('order_id');
    }

    onDestroy(e) {
        this.destroy();
    }

    destroy() {
        delete this;
    }
}

class ViewPath extends BottomView {
    #routes;
    rpath;
    travelMode = travelMode;

    setRoutes(routes) {
        this.#routes = routes;
    }

    getRoutes() {
        return this.#routes;
    }

    showPath(startPlace, finishPlace, routes, afterRequest = null) {
        this.closePath();

        function setRoutes(result) {
            this.setRoutes(result);
            this.rpath = DrawPath(v_map.map, result, {preserveViewport: false});
            if (afterRequest)
                afterRequest();
        }

        if (isEmpty(routes)) 
            v_map.getRoutes(startPlace, finishPlace, this.travelMode, setRoutes.bind(this));
        else setRoutes.bind(this)(routes);
    }

    closePath() {
        if (this.rpath) {
            this.rpath.setMap(null);
            delete this.rpath;
        }
    }

    destroy() {
        this.closePath();
        super.destroy();
    }
}


class OrderView extends ViewPath {
    #order_id = 0;

    get Order() { return this.options.order; }

    constructor(options = {actions: {}}, afterDestroy = null) {
        super(options, afterDestroy);

        if (options.order) 
            this.SetOrder(options.order);
    }

    SetOrder(order) {
        if (order) {
            this.setOrderId(order.id);
            if (order.travelMode)
                this.travelMode = order.travelMode;
            this.showPath(order.start, order.finish);
        } else {
            this.setOrderId(null);
            this.closePath();
        }

        this.options.order = order;
    }

    prepareToClose(afterPrepare) {

        if (this.getOrderId())
            app.showQuestion('Do you want to cancel your order?', (()=>{
                    Ajax({
                        action: 'SetState',
                        data: JSON.stringify({id: this.getOrderId(), state: 'cancel'})
                    }).then(((data)=>{

                        if (data.result == 'ok') {
                            super.prepareToClose(afterPrepare);
                            BeginSelectPath();
                        }
                        else console.error(data);

                    }).bind(this));
            }).bind(this));
        else super.prepareToClose(afterPrepare);
    }

    setOrderId(v) {
        this.#order_id = v;
    }

    getOrderId() {
        return this.#order_id;
    }
}

class SelectPathView extends OrderView {

    setOptions(options) {
        options = $.extend({
            classes: ['target-view'],
            content: [
                {
                    id: 'startPlace',
                    text: PlaceName(options.startPlace),
                    info: PlaceAddress(options.startPlace),
                    class: TextInfoField
                },
                {
                    class: DividerField
                }, 
                {
                    id: 'finishPlace',
                    text: "Select your destination",
                    class: TextInfoField
                }
            ]
        }, options);

        super.setOptions(options);

        this.footerElement.append(this.footerSliderView = $('<div class="sliderView hide">'));
        this.footerSliderView.append(this.footerSlider = $('<div class="slider">'));
        this.footerElement.append((this.goButton = $('<div class="button">'))
                                    .text(toLang('Go'))
                                    .click(this.Go.bind(this)));
    }

    GetPath() {
        return GetPath(this.getRoutes(), this.options.startPlace, this.options.finishPlace);
    }

    GetOrder() {
        return $.extend({id: this.getOrderId()}, this.GetPath());
    }

    Go() {
            
        let path = this.GetPath();

        if (path) {
            Ajax({
                action: "AddOrder",
                //action: "Go",
                data: JSON.stringify({
                    user_id: user.id,
                    path: path
                })
            }).then(((response)=>{
                if (response.result > 0) {
                    this.setOrderId(response.result);
                    this.Close();
                }
            }).bind(this));
        }
    }

    SelectPlace(finishPlace) {
        this.showPath(this.options.startPlace, this.options.finishPlace = finishPlace, null, (()=>{
            let field = this.fieldById("finishPlace");
            field.view.text(PlaceName(this.options.finishPlace));
            field.infoView.text(PlaceAddress(this.options.finishPlace));
            field.infoView.addClass('showInfo');
            
            this.afterResize();
            this.footerElement.find('button').prop('disabled', false);

        }).bind(this));
    }

    destroy() {
        this.closePath();
        super.destroy();
    }
}


class OrderWaitView extends OrderView {

    initContent() {
        super.initContent();
        $(".field.order").each((i, field)=>{ new DriverFieldWait($(field)); });
    }
}


class OrderAccepedView extends OrderView {

    #listenerId;
    #pathToStart;

    constructor(options = {actions: {}}, afterDestroy = null) {
        super(options, afterDestroy);

        this.#listenerId = transport.AddListener('notificationList', ((e)=>{
            this.appendReceiveNotifyList(e.value);
        }).bind(this));

        this.appendReceiveNotifyList(jsdata.notificationList);
    }

    initContent() {
        super.initContent();
        $(".field.order").each((i, field)=>{ new DriverFieldAccepted($(field)); });
    }

    appendReceiveNotifyList(list) {
        for (let i in list)
            if (list[i].content_type == 'pathToStart') {
                let path = JSON.parse(list[i].text);
                //this.#pathToStart = v_map.DrawPath(path);
                console.log(path);
            }
    }

    destroy() {
        transport.RemoveListener(this.#listenerId);
        super.destroy();
    }
}


class TracerView extends ViewPath {

    #tracer;
    #geoId = false;
    #marker;

    #setMainPoint(latLng, angle) {
        if (this.#marker)
            MarkerManager.setPos(this.#marker, latLng, angle);
    }

    setRoutes(routes) {
        super.setRoutes(routes);
        this.enableGeo(true);

        this.#tracer = new Tracer(routes.routes, this.#setMainPoint.bind(this), 100);

        this.#tracer.AddListener('FINISHPATH', this.onFinish.bind(this));
    }

    setTracerPoint(latLng) {
        if (this.#tracer) this.#tracer.ReceivePoint(latLng);
    }

    #receiveGeo(position) {

        let latLng = new google.maps.LatLng(position.lat, position.lng);

        if (!isNaN(latLng.lat())) {

            this.setTracerPoint(latLng);
            v_map.setMainPosition(latLng);
        }
    }

    enableGeo(enable) {
        if (enable && !this.#geoId) {
            this.#geoId = watchPosition(this.#receiveGeo.bind(this));
        } else if (!enable && this.#geoId > 0) {
            clearWatchPosition(this.#geoId);
            this.#geoId = false;
        }
    }

    onFinish() {
        //this.Close();
    }

    destroy() {
        if (this.#marker)
            this.#marker.setMap(null);
        
        this.#tracer.destroy();
        this.enableGeo(false);
        this.closePath();
        super.destroy();
    }
}

var currentOrder;

function BeginSelectPath() {
    var selectPathDialog;

    function SelectPlace(place) {

        if (!selectPathDialog) {
            v_map.setMainPosition(place.latLng);

            selectPathDialog = viewManager.Create({
                startPlace: place
            }, SelectPathView, () => {
                if (selectPathDialog.getOrderId())
                    BeginWaitdOrder(currentOrder = selectPathDialog.GetOrder());

                selectPathDialog = null;
            });
        } else selectPathDialog.SelectPlace(place);
    }

    v_map.map.addListener("click", (e) => {
        if (e.placeId) {
            v_map.getPlaceDetails(e.placeId).then((place)=>{
                place = $.extend(place, e);
                SelectPlace(place);
            });
        } else SelectPlace(e);
        
        return StopPropagation(e);
    });
}

function BeginAcceptedOrder() {
    if (currentOrder.id) {

        Ajax({
            action: 'getOrderProcess',
            data: {id: currentOrder.id}
        }).then((d)=>{

            let elem = $(d.result);
            if (isEmpty(elem))
                console.error(d.result);
            else {

                let dialog = viewManager.Create({
                    order: currentOrder,
                    title: toLang('Order'),
                    content: elem
                }, OrderAccepedView);
            }
        });
    }
}

function BeginWaitdOrder(order) {

     Ajax({
        action: 'getOrderProcess',
        data: {id: currentOrder.id}
    }).then((d)=>{

        let elem = $(d.result);
        if (isEmpty(elem))
            console.error(d.result);
        else {

            let dialog = viewManager.Create({
                order: order,
                title: toLang('Order'),
                content: elem
            }, OrderWaitView);
        }
    });
}

function Mechanics() {


    v_map.driverManagerOn(true);

    if (typeof currentOrder == 'object') {
        currentOrder.start = JSON.parse(currentOrder.start);
        currentOrder.finish = JSON.parse(currentOrder.finish);

        if (currentOrder.state == 'wait') 
            BeginWaitdOrder(currentOrder);
        else if (currentOrder.state == 'accepted') 
            BeginAcceptedOrder();

        //BeginTracer(currentOrder);
    } else BeginSelectPath();
}