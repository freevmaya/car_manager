class ViewPath extends BottomView {
    routes;
    routeId;
    travelMode = 'WALKING';
    rpath;

    showPath(startPlace, finishPlace, afterRequest = null) {
        this.closePath();
        v_map.getRoutes(startPlace, finishPlace, this.travelMode, ((result)=>{

            this.routes = result;
            this.rpath = DrawPath(v_map.map, result);
            if (afterRequest)
                afterRequest();

        }).bind(this));
    }

    getRouteId() {
        return this.routeId;
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

        this.footerElement.append(this.footerSliderView = $('<div class="sliderView">'));
        this.footerSliderView.append(this.footerSlider = $('<div class="slider">'));
        this.footerElement.append((this.goButton = $('<div class="button">'))
                                    .text(toLang('Go'))
                                    .click(this.Go.bind(this)));

        this.listenerId = transport.AddListener('SuitableDrivers', this.onSuitableDrivers.bind(this));
    }

    Go() {

        if (this.routes) {

            let start = getRoutePoint(this.routes, 0);
            let finish = getRoutePoint(this.routes, -1);

            let path = {
                start: { placeId: this.options.startPlace.placeId, lat: start.lat(), lng: start.lng() },
                finish: { placeId: this.options.finishPlace.placeId, lat: finish.lat(), lng: finish.lng() },
                startName: PlaceName(this.options.startPlace),
                finishName: PlaceName(this.options.finishPlace),
                startAddress: PlaceAddress(this.options.startPlace),
                finishAddress: PlaceAddress(this.options.finishPlace),
                meters: Math.round(CalcPathLength(this.routes)),
                travelMode: this.travelMode
            };

            Ajax({
                //action: "AddOrder",
                action: "Go",
                data: JSON.stringify({
                    user_id: user.id,
                    path: path
                })
            }).then(((response)=>{
                if (response.id > 0) {
                    this.routeId = response.id;
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
        if (!this.routeId)
            this.closePath();
        super.destroy();
    }
}

class Tracer {

    #geoPosition;
    magnetDistance = 50;  // 50 метров от пути
    #avgSpeed = false;
    #routes;

    constructor(routes, callback) {
        this.#routes = routes;
    }

    Calc(newPos) {

        newPos = toLatLngF(newPos);
        if (this.#geoPosition) {
            let d = Distance(this.#geoPosition, newPos);
            if (this.#avgSpeed === false)
                this.#avgSpeed = d;
            else this.#avgSpeed = (this.#avgSpeed + d) / 2;
        }

        let p = this.magnetToPath(this.#geoPosition = newPos);
        return p;
    }

    calcPointInPath(path, p) {

        p = toLatLngF(p);
        let min = this.magnetDistance;
        let result = false;

        for (let i=0; i<path.length - 1; i++) {

            let p1 = path[i];
            let p2 = path[i + 1];
            let angle = Math.abs(CalcAngleRad(p1, p2) - CalcAngleRad(p1, p));
            if (angle < Math.PI / 2) {
                let c = Distance(p1, p);
                let b = Distance(p1, p2);

                let b2 = c * Math.cos(angle);

                if (b2 < b) {
                    let h = c * Math.sin(angle);
                    if (h < min) {
                        min = h;
                        let lk = b2 / b;
                        result = {
                            lat: p1.lat() + (p2.lat() - p1.lat()) * lk,
                            lng: p1.lng() + (p2.lng() - p1.lng()) * lk
                        }
                    }
                }
            }
        }

        if (!result) {
            let min = this.magnetDistance;
            for (let i=0; i<path.length; i++) {
                let h = Distance(path[i], p);
                if (h < min) {
                    min = h;
                    result = toLatLng(path[i]);
                }
            }
        }

        return result;
    }

    magnetToPath(latLng) {

        if (this.#routes && (this.#routes.length > 0)) {
            let path = this.#routes[0].overview_path;
            return this.calcPointInPath(path, latLng);
        }

        return toLatLng(latLng);
    }

}


class TracerView extends ViewPath {

    #tracer;
    #geoId = false;

    constructor(options = {actions: {}}, afterDestroy = null) {
        super(options, afterDestroy);
        this.enableGeo(true);
        this.#tracer = new Tracer(this.routes);
    }

    receiveGeo(position) {
        this.SetMainPoint(this.#tracer.Calc(position));
    }

    SetMainPoint(latLng) {
        if (!isNull(latLng)) 
            v_map.setMainPosition(latLng);
    }

    enableGeo(enable) {
        if (enable && !this.#geoId) {
            this.#geoId = navigator.geolocation.watchPosition(this.receiveGeo.bind(this));
        } else if (!enable && this.#geoId > 0) {
            navigator.geolocation.clearWatch(this.#geoId);
            this.#geoId = false;
        }
    }

    destroy() {
        this.enableGeo(false);
        super.destroy();
    }
}

function Mechanics() {

    var routeDialog;
    var tracerDialog;

    function BeginTracer(routeId, path) {
        tracerDialog = viewManager.Create({
            title: toLang('Route'),
            content: [{
                text: routeId,
                class: TextInfoField
            }]
        }, TracerView, ()=>{
            tracerDialog = null;
        });

        tracerDialog.routeId = routeId;
        tracerDialog.travelMode = path.travelMode;
        tracerDialog.showPath(path.start, path.finish);
    }

    function SelectPlace(place) {

        app.SendEvent('SelectPlace', place);

        if (!routeDialog) {
            v_map.setMainPosition(place.latLng);

            routeDialog = new ViewTarget({
                startPlace: place
            }, () => {
                if (routeDialog.getRouteId()) {
                    BeginTracer(routeDialog.getRouteId(), routeDialog.routes);
                }
                routeDialog = null;
            });
        } else routeDialog.SelectPlace(place);
    }

    async function getPlaceDetails(placeId) {

        const place = new v_map.Classes["Place"]({
            id: placeId,
            requestedLanguage: user.language_code, // optional
        });

        await place.fetchFields({ fields: ["displayName", "formattedAddress"] });
        return place;
    }

    v_map.map.addListener("click", (e) => {
        if (routeDialog && routeDialog.options.id)
            return;

        if (tracerDialog) {
            tracerDialog.SetMainPoint(e.latLng);
            return;
        }

        if (e.placeId) {
            getPlaceDetails(e.placeId).then((place)=>{
                place = $.extend(place, e);
                SelectPlace(place);
            });
        } else SelectPlace(e);
    });

    if (typeof currentRoute == 'object')
        BeginTracer(currentRoute.id, JSON.parse(currentRoute.path));
}