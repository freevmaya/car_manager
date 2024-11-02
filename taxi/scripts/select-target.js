class ViewTarget extends BottomView {

    listenerId;
    routes;
    offers = {};
    travelMode = 'WALKING';

    #routeId;

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
                meters: Math.round(CalcPathLength(this.routes))
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
                    this.#routeId = response.id;
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

    showPath(startPlace, finishPlace, afterRequest = null) {
        this.closePath();
        let request = {
            origin: PlaceLatLng(this.options.startPlace),
            destination: PlaceLatLng(finishPlace),
            travelMode: this.travelMode
        }
        v_map.DirectionsService.route(request, (function(result, status) {
            if (status == 'OK') {
                this.routes = result;
                this.rpath = DrawPath(v_map.map, result);
                if (afterRequest)
                    afterRequest();
            }
        }).bind(this))
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

    closePath() {
        if (this.rpath) {
            this.rpath.setMap(null);
            delete this.rpath;
        }
    }

    getRouteId() {
        return this.#routeId;
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
        if (!this.#routeId)
            this.closePath();
        super.destroy();
    }
}


class TracerView extends BottomView {

    routes;
    #getPosition;
    #geoId;

    setOptions(options) {
        super.setOptions(options);
        this.enableGeo(true);
    }

    receiveGeo(position) {
        this.#getPosition = position.coords;
        v_map.setMainPosition(this.#getPosition);
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

    function BeginTracer(routeId, routes) {
        tracerDialog = viewManager.Create({
            title: toLang('Route'),
            content: {
                text: routeId,
                class: TextInfoField
            }
        }, TracerView, ()=>{
            tracerDialog = null;
        });

        tracerDialog.routes = routes;
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

        if (tracerDialog)
            return;

        if (e.placeId) {
            getPlaceDetails(e.placeId).then((place)=>{
                place = $.extend(place, e);
                SelectPlace(place);
            });
        } else SelectPlace(e);
    });

    if (typeof currentRoute == 'object') {
        console.log(currentRoute.path);
        //BeginTracer(currentRoute.id);
    }
}