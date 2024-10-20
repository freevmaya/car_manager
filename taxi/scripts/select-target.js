class ViewTarget extends BottomView {

    routes;

    setOptions(options) {
        options = $.extend({
            actions: {
                Ok: this.applyPath.bind(this)
            },
            content: [
                {
                    id: 'time',
                    value: Date.now(),
                    class: DateTimeField
                },
                {
                    id: 'startPlace',
                    text: PlaceToText(options.startPlace),
                    info: PlaceAddress(options.startPlace),
                    class: TextInfoField
                },
                {
                    class: DividerField
                },
                {
                    id: 'finishPlace',
                    text: "Select your destination",
                    class: TextField
                }
            ]
        }, options);

        super.setOptions(options);

    }

    SelectPlace(finishPlace) {
        this.closePath();
        let request = {
            origin: PlaceLatLng(this.options.startPlace),
            destination: PlaceLatLng(this.options.finishPlace = finishPlace),
            travelMode: 'DRIVING'
        }
        v_map.directionsService.route(request, (function(result, status) {
            if (status == 'OK') {
                let field = this.fieldById("finishPlace");
                this.rpath = DrawPath(v_map.map, result);
                field.view.text(PlaceToText(this.options.finishPlace));
                this.routes = result;
                this.afterResize();
            }
        }).bind(this))
    }

    applyPath() {

        let data = {
            user_id: user.id,
            pickUpTime: this.fieldById('time').getValue()
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
        }).then((result) => {
            this.Close();
        });
    }

    closePath() {
        if (this.rpath) {
            this.rpath.setMap(null);
            delete this.rpath;
        }
    }

    Close() {
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