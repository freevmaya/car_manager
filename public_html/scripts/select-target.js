class ViewPath extends BottomView {
    #routes;
    #order_id = 0;
    rpath;

    setRoutes(routes) {
        this.#routes = routes;
    }

    getRoutes() {
        return this.#routes;
    }

    showPath(startPlace, finishPlace, afterRequest = null) {
        this.closePath();
        v_map.getRoutes(startPlace, finishPlace, travelMode, ((result)=>{

            this.setRoutes(result);
            this.rpath = DrawPath(v_map.map, result);
            if (afterRequest)
                afterRequest();

        }).bind(this));
    }

    setOrderId(v) {
        this.#order_id = v;
    }

    getOrderId() {
        return this.#order_id;
    }

    closePath() {
        if (this.rpath) {
            this.rpath.setMap(null);
            delete this.rpath;
        }
    }
}

class ViewTarget extends ViewPath {

    listenerId;
    offers = {};

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

        this.listenerId = transport.AddListener('SuitableDrivers', this.onSuitableDrivers.bind(this));
    }

    GetPath() {
        /*
        let routes = this.getRoutes();

        if (routes) {

            let start = getRoutePoint(routes, 0);
            let finish = getRoutePoint(routes, -1);
            return {
                    start: { lat: start.lat(), lng: start.lng() },
                    finish: { lat: finish.lat(), lng: finish.lng() },
                    startName: PlaceName(this.options.startPlace),
                    finishName: PlaceName(this.options.finishPlace),
                    startAddress: PlaceAddress(this.options.startPlace),
                    finishAddress: PlaceAddress(this.options.finishPlace),
                    meters: Math.round(CalcPathLength(this.getRoutes())),
                    travelMode: this.travelMode
                };
            } return null;*/

        return GetPath(this.getRoutes(), this.options.startPlace, this.options.finishPlace);
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
                if (response.id > 0) {
                    this.setOrderId(response.id);
                    this.Close();
                }
            }).bind(this));
        }
    }

    RefreshOffers(list) {
        let keys = Object.keys(this.offers);
        for (let i in list) {

            if (!this.offers[i]) {
                if (list[i] > 0) {
                    let elem = templateClone($('.templates .car'), {name: i});
                    if (elem.length > 0) {
                        this.footerSlider.append(elem);
                        this.offers[i] = elem;
                        keys.splice(keys.indexOf(i));
                    }
                }
            } else keys.splice(keys.indexOf(i));
        }

        for (let i=0; i<keys.length; i++) {
            this.offers[keys[i]].remove();
            delete this.offers[keys[i]];
        }
    }

    onSuitableDrivers(e) {
        this.RefreshOffers(this.CollectToOffers(e.value));
    }

    CollectToOffers(drivers) {
        let offers = {useTogether: 0};
        for (let i=0; i<drivers.length; i++) {
            let d = drivers[i];
            if (d.useTogether) offers.useTogether++;

            if (!offers[d.comfort])
                offers[d.comfort] = 1;
            else offers[d.comfort]++;
        }
        return offers;
    }

    addTextInSlider(text) {
        this.footerSlider.append($('<div class="notify">').text(text));
    }

    SelectPlace(finishPlace) {
        this.showPath(this.options.startPlace, this.options.finishPlace = finishPlace, (()=>{
            let field = this.fieldById("finishPlace");
            field.view.text(PlaceName(this.options.finishPlace));
            field.infoView.text(PlaceAddress(this.options.finishPlace));
            field.infoView.addClass('showInfo');
            
            this.afterResize();
            this.footerElement.find('button').prop('disabled', false);

        }).bind(this));
    }

/*
    prepareToClose(afterPrepare) {
        if (this.options.id) {
            app.showQuestion('Do you want to cancel your order?', (()=>{
                Ajax({
                    action: 'CancelOrder',
                    data: {id: this.options.id }
                }).then((response)=>{
                    if (response.result == 'ok') {
                        ListOffers = null;
                        this.options.id = null;
                        afterPrepare();
                    }
                })
            }).bind(this));
        } else afterPrepare();
    }
*/

    destroy() {
        if (this.listenerId > 0) 
            transport.RemoveListener('notificationList', this.listenerId);
        
        this.closePath();
        super.destroy();
    }
}


class TracerView extends ViewPath {

    #tracer;
    #geoId = false;
    #marker;

    #setMainPoint(latLng, angle) {
        //v_map.setMainPosition(latLng);
        if (this.#marker) {
            this.#marker.position = latLng;
            this.#marker.content.style = "rotate:" + angle + "deg";
        }
    }

    setRoutes(routes) {
        super.setRoutes(routes);
        this.enableGeo(true);
        this.#marker = v_map.MarkerManager.CreateMarker(routes.routes[0].overview_path[0], 'driver', 'marker auto');
        this.#tracer = new Tracer(routes.routes, this.#setMainPoint.bind(this), 100);

        this.#tracer.AddListener('FINISHPATH', this.onFinish.bind(this));
    }

    setTracerPoint(latLng) {
        if (this.#tracer) this.#tracer.ReceivePoint(latLng);
    }

    #receiveGeo(position) {

        let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        if (!isNaN(latLng.lat())) {

            this.setTracerPoint(latLng);
            v_map.setMainPosition(latLng);
        }
    }

    enableGeo(enable) {
        if (enable && !this.#geoId) {
            this.#geoId = navigator.geolocation.watchPosition(this.#receiveGeo.bind(this));
        } else if (!enable && this.#geoId > 0) {
            navigator.geolocation.clearWatch(this.#geoId);
            this.#geoId = false;
        }
    }

    Close() {
        super.Close();
        if (this.getOrderId())
            Ajax({
                action: 'SetState',
                data: JSON.stringify({id: this.getOrderId(), state: 'finished'})
            });
    }

    onFinish() {
        //this.Close();
    }

    destroy() {
        this.#marker.setMap(null);
        this.#tracer.destroy();
        this.enableGeo(false);
        this.closePath();
        super.destroy();
    }
}

var currentOrder;

function Mechanics() {

    var routeDialog;
    var tracerDialog;

    function BeginTracer(order) {
        tracerDialog = viewManager.Create({
            title: toLang('Route'),
            content: [{
                text: order.route_id,
                class: TextInfoField
            }]
        }, TracerView, ()=>{
            tracerDialog = null;
        });

        tracerDialog.setOrderId(order.id);
        tracerDialog.travelMode = order.travelMode;
        tracerDialog.showPath(JSON.parse(order.start), JSON.parse(order.finish));
    }

    function SelectPlace(place) {

        app.SendEvent('SelectPlace', place);

        if (!routeDialog) {
            v_map.setMainPosition(place.latLng);

            routeDialog = new ViewTarget({
                startPlace: place
            }, () => {
                if (routeDialog.getOrderId()) {
                    BeginTracer(routeDialog.getOrderId(), routeDialog.GetPath());
                }
                routeDialog = null;
            });
        } else routeDialog.SelectPlace(place);
    }

    v_map.map.addListener("click", (e) => {
        if (routeDialog && routeDialog.options.id)
            return;

        if (tracerDialog) {
            tracerDialog.setTracerPoint(e.latLng);
            return StopPropagation(e);
        }

        if (e.placeId) {
            v_map.getPlaceDetails(e.placeId).then((place)=>{
                place = $.extend(place, e);
                SelectPlace(place);
            });
        } else SelectPlace(e);
        
        return StopPropagation(e);
    });

    if (typeof currentOrder == 'object')
        BeginTracer(currentOrder);
}