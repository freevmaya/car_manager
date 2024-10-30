class ViewTarget extends BottomView {

    routes;
    setOptions(options) {

        let finishPart = {
            id: 'finishPlace',
            text: "Select your destination",
            class: TextInfoField
        };
        if (options.finishPlace) {
             finishPart = {
                id: 'finishPlace',
                text: PlaceName(options.finishPlace),
                info: PlaceAddress(options.finishPlace),
                class: TextInfoField
            }
        }
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
                }, finishPart
            ]
        }, options);

        super.setOptions(options);

        this.footerElement.addClass('sliderView')
            .append(this.footerSlider = $('<div class="slider">'));

        if (options.id) {
            this.listenerId = transport.AddListener('notificationList', this.onNotification.bind(this), 10);

            this.showPath(options.startPlace, options.finishPlace);

            if (ListOffers.length == 0)
                this.addTextInSlider(toLang('Order sent. Wait for offers or close the order.'));
            else this.AddOffers(ListOffers);
        } else {
            this.footerSlider.append(this.sendButton = $('<button class="button" disabled>').text(toLang('Send')))
                .append(this.datetimeElement = $('<div class="datetime-field shadow">'));

            this.sendButton.click(this.applyPath.bind(this));
            this.datetime = new DateTime(this.datetimeElement, Date.now());
        }
/*
        setTimeout((()=>{
            this.addTextInSlider("Нейросеть онлайн для текста — это один из самых удобных способов создания контента.");
        }).bind(this), 2000);*/
    }

    AddOffers(list) {
        for (let i in list) {
            let item = list[i];
            console.log(item);
            let elem = templateClone($('.templates .car'), item);
            if (elem.length > 0) {
                const rgb = hexToRgb(item.rgb);
                const color = new Color(rgb[0], rgb[1], rgb[2]);
                const solver = new Solver(color);
                const result = solver.solve();
                elem.find('img').attr('src', BASEURL + '/css/images/' + item.symbol + '.png')
                    .attr('style', result.filter + ' drop-shadow(0px 0px 2px black)');
                this.footerSlider.append(elem);
            }
        }
    }

    addTextInSlider(text) {
        this.footerSlider.append($('<div class="notify">').text(text));
    }

    showPath(startPlace, finishPlace, afterRequest = null) {
        this.closePath();
        let request = {
            origin: PlaceLatLng(this.options.startPlace),
            destination: PlaceLatLng(finishPlace),
            travelMode: 'DRIVING'
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
            this.afterResize();
            this.footerElement.find('button').prop('disabled', false);

        }).bind(this));
    }

    onNotification(e) {
        let data = e.value;
        for (let i in data)
            if (data[i].content_type == 'orderReceive') {

                this.footerSlider.empty();
                this.addTextInSlider(data[i].text);
                transport.SendStatusNotify(data[i], 'read');
                e.StopPropagation();
            } else if (data[i].content_type == 'orderCreated') {

                transport.SendStatusNotify(data[i], 'read');
                e.StopPropagation();
            } else if (data[i].content_type == 'offerToPerform') {

                let offerView;

                Ajax({
                    action: 'getOffers',
                    data: {notify_id: data[i].id}
                }).then(((response)=>{
                    this.AddOffers(response);
                }).bind(this));
                e.StopPropagation();

                //this.footerSlider.append(offerView = $('<div class="notify car">'));
                //transport.SendStatusNotify(data[i], 'read');
            } 
    }

    applyPath() {

        this.listenerId = transport.AddListener('notificationList', this.onNotification.bind(this), 10);

        let data = {
            user_id: user.id,
            pickUpTime: this.datetime.getValue()
        }

        let start = getRoutePoint(this.routes, 0);
        let finish = getRoutePoint(this.routes, -1);

        data.start = { placeId: this.options.startPlace.placeId, lat: start.lat(), lng: start.lng() };
        data.finish = { placeId: this.options.finishPlace.placeId, lat: finish.lat(), lng: finish.lng() };

        data.startName = PlaceName(this.options.startPlace);
        data.finishName = PlaceName(this.options.finishPlace);

        data.startAddress = PlaceAddress(this.options.startPlace);
        data.finishAddress = PlaceAddress(this.options.finishPlace);

        data.meters = Math.round(CalcPathLength(this.routes));

        Ajax({
            action: "AddOrder",
            data: JSON.stringify(data)
        }).then(((response)=>{
            if (response.id)
                this.options.id = response.id;
        }).bind(this));
    }

    closePath() {
        if (this.rpath) {
            this.rpath.setMap(null);
            delete this.rpath;
        }
    }

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

    destroy() {
        if (this.listenerId > 0) 
            transport.RemoveListener('notificationList', this.listenerId);
        this.closePath();
        super.destroy();
    }
}

var currentOrder = null;
var ListOffers = null;

function Mechanics() {

    var routeDialog;

    if (currentOrder) {

        currentOrder.title = 'Route';
        routeDialog = new ViewTarget(currentOrder, () => {
            routeDialog = null;
        });
    }

    function SelectPlace(place) {

        app.SendEvent('SelectPlace', place);

        if (!routeDialog) {
            v_map.mainMarker.position = place.latLng;

            routeDialog = new ViewTarget({
                title: 'Route',
                startPlace: place
            }, () => {
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

        if (e.placeId) {
            getPlaceDetails(e.placeId).then((place)=>{
                place = $.extend(place, e);
                SelectPlace(place);
            });
        } else SelectPlace(e);
    });
}