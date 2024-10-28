class ViewTarget extends BottomView {

    routes;
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

        this.footerElement.addClass('sliderView')
            .append(this.footerSlider = $('<div class="slider">'));

        this.footerSlider.append(this.sendButton = $('<button class="button" disabled>').text(toLang('Send')))
            .append(this.datetimeElement = $('<div class="datetime-field shadow">'));

        this.sendButton.click(this.applyPath.bind(this));
        this.datetime = new DateTime(this.datetimeElement, Date.now());
/*
        setTimeout((()=>{
            this.addTextInSlider("Нейросеть онлайн для текста — это один из самых удобных способов создания контента.");
        }).bind(this), 2000);*/
    }

    addTextInSlider(text) {
        this.footerSlider.append($('<div class="notify">').text(text));
    }

    SelectPlace(finishPlace) {
        this.closePath();
        let request = {
            origin: PlaceLatLng(this.options.startPlace),
            destination: PlaceLatLng(this.options.finishPlace = finishPlace),
            travelMode: 'DRIVING'
        }
        v_map.DirectionsService.route(request, (function(result, status) {
            if (status == 'OK') {
                let field = this.fieldById("finishPlace");
                this.rpath = DrawPath(v_map.map, result);
                field.view.text(PlaceName(this.options.finishPlace));
                field.infoView.text(PlaceAddress(this.options.finishPlace));
                this.routes = result;
                this.afterResize();
                this.footerElement.find('button').prop('disabled', false);
            }
        }).bind(this))
    }

    onNotification(data) {
        for (let i in data)
            if (data[i].content_type == 'orderReceive') {
                this.footerSlider.empty();
                this.addTextInSlider(data[i].text);
                transport.SendStatusNotify(data[i], 'read');
            } else if (data[i].content_type == 'orderCreated') 
                transport.SendStatusNotify(data[i], 'read');
    }

    applyPath() {

        this.listenerId = transport.AddListener('notificationList', this.onNotification.bind(this));

        let data = {
            user_id: user.id,
            pickUpTime: this.datetime.getValue()
        }

        let start = getRoutePoint(this.routes, 0);
        let finish = getRoutePoint(this.routes, -1);

        data.start = { placeId: this.options.startPlace.placeId, lat: start.lat(), lng: start.lng() };
        data.finish = { placeId: this.options.finishPlace.placeId, lat: finish.lat(), lng: finish.lng() };
        data.startAddress = PlaceAddress(this.options.startPlace);
        data.finishAddress = PlaceAddress(this.options.finishPlace);
        data.meters = Math.round(CalcPathLength(this.routes));

        Ajax({
            action: "AddOrder",
            data: JSON.stringify(data)
        }).then();
    }

    closePath() {
        if (this.rpath) {
            this.rpath.setMap(null);
            delete this.rpath;
        }
    }

    Close() {
        if (this.listenerId > 0) 
            transport.RemoveListener('notificationList', this.listenerId);
        this.closePath();
        return super.Close();
    }
}



function Mechanics() {

    var startDialog;

    function SelectPlace(place) {

        app.SendEvent('SelectPlace', place);

        if (!startDialog) {
            v_map.mainMarker.position = place.latLng;

            startDialog = new ViewTarget({
                title: 'Route',
                startPlace: place
            }, () => {
                startDialog = null;
            });
        } else startDialog.SelectPlace(place);
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
        if (e.placeId) {
            getPlaceDetails(e.placeId).then((place)=>{
                place = $.extend(place, e);
                SelectPlace(place);
            });
        } else SelectPlace(e);
    });
}