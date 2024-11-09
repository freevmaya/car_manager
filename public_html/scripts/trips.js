$(window).ready(() => {

    var routeManager = null;

    class RouteManager {
        openMap;
        dialog;
        rpath;
        contentElem;
        view;

        get start() { return this.contentElem.find('#start').data('place'); };
        get finish() { return this.contentElem.find('#finish').data('place'); };

        constructor(contentElem) {
            this.contentElem = contentElem;
            this.view = contentElem.closest('.view');
        }

        ShowMap(fieldElem, dialog) {

            this.dialog = dialog;
            let fieldId = fieldElem.attr('id');

            if (this.openMap)
                this.openMap.destroy();

            let place = fieldElem.data('place');

            let mapObject = new SelectMap(fieldElem, null, {
                start_position: place.latLng ? place.latLng : false
            });

            Wait(()=>{
                return mapObject.Classes;
            }).then((()=>{
                this.showRoute(fieldElem);
            }).bind(this));

            this.openMap = mapObject;
            fieldElem.find('.map-layer').addClass('show');

            if (!this.view.hasClass('full'))
                this.view.addClass('full');
        
        }

        showRoute(namePoint) {

            let ids = [];
            this.contentElem.find('.field').each(((i, elem)=>{
                elem = $(elem);
                if (elem.find('.map-container')) {
                    ids.push(elem.attr('id'));

                    if (ids.length > 1) {
                        this.createRoute();
                        return false;
                    }
                }
            }).bind(this));
        }

        createRoute() {

            this.openMap.getRoutes(this.start, this.finish, travelMode, ((data)=>{ 

                if (this.rpath)
                    this.rpath.setMap(null);
                                
                let p = getRoutePoint(data, this.openMap.fieldId == 'start' ? 1 : -1);

                this.dialog.getInput("meters").val(Math.round(CalcPathLength(data)));
                this.rpath = this.openMap.DrawPath(data);
                this.openMap.map.setCenter(p);

                if (!isEmpty(this.openMap.MainMarker))
                    this.openMap.MainMarker.setMap(null);
            }).bind(this));
        }
    }

    class SelectMap extends VMap {
        fieldId;
        parentField;

        constructor(fieldElem, callback, options) {
            super(fieldElem.find('.map-container'), callback, $.extend({main_marker: options.start_position === false}, options));
            this.parentField = fieldElem;
            this.fieldId = fieldElem.attr('id');
        }

        getPlace() {
            return this.parentField.data('place');
        }

        onMapClick(e) {
            this.setMainPosition(e.latLng);

            if (e.placeId) {
                this.getPlaceDetails(e.placeId).then((place)=>{
                    this.SelectPlace(place);
                });
            } else this.SelectPlace(e);
            
            return StopPropagation(e);
        }

        async initMap(crd) {
            super.initMap(crd).then((()=>{
                this.map.addListener("click", this.onMapClick.bind(this));
            }).bind(this));
        }

        SelectPlace(val) {
            this.parentField.find('.value').text(PlaceName(val));

            let place = val.location ? 
                            Extend({placeId: val.id, latLng: val.location}, val, ['displayName', 'formattedAddress']) :
                        toLatLng(val.latLng)

            this.parentField.data('place', place);

            routeManager.showRoute(this.fieldId);
        }


        Close() {
            this.parentField
                .closest('.field')
                .find('.map-layer')
                .removeClass('show');
            this.destroy();
        }

        destroy() {
            this.parentField.find('.map-layer').removeClass('show');
            if (routeManager.openMap)
                routeManager.openMap = null;
            super.destroy();
        }
    }


    function newOrderAsRoute(start, finish, meters) {

        let dialog = viewManager.Create({
            curtain: $('.wrapper'),
            title: toLang('New order trip'),
            content: [
                {
                    class: GroupFields,
                    content: [
                        {
                            name: 'start',
                            label: "Departure point",
                            source: '.templates .field',
                            place: start,
                            placeName: PlaceName(start),
                            class: SelectPlaceField
                        },{
                            name: 'finish',
                            source: '.templates .field',
                            label: "Point of arrival",
                            place: finish,
                            placeName: PlaceName(finish),
                            class: SelectPlaceField
                        },{
                            name: 'meters',
                            label: toLang("Distance"),
                            value: meters,
                            readOnly: true,
                            class: FormField
                        },{
                            name: 'pickUpTime',
                            label: "Departure time",
                            class: DateTimeField
                        }
                    ]
                }
            ],
            actions: {
                Send: ()=>{
                    let path = {};
                    dialog.view.find('.field').each((i, field)=>{
                        field = $(field);
                        path[field.attr('id')] = field.data('place');
                    });
                    Ajax({
                        action: 'AddOrder',
                        data: JSON.stringify($.extend(dialog.getValues(['pickUpTime', 'meters']), 
                                {user_id: user.id, path: path }))
                    }).then((data)=>{
                        if (data.result > 0)
                            dialog.Close();
                    });
                    //dialog.Close();
                },
                Cancel: ()=>{
                    dialog.Close();
                },
                'On map': ()=>{
                    document.location.href = '/map';
                }
            }
        });

        dialog.view.find('.popup-button').click((e)=>{
            let fieldElem = $(e.currentTarget).closest('.field');
            if (!routeManager)
                routeManager = new RouteManager(fieldElem.closest('.content'));

            if (routeManager.openMap && (fieldElem.attr('id') == routeManager.openMap.fieldId))
                routeManager.openMap.Close();
            else routeManager.ShowMap(fieldElem, dialog);
        });
    }


    $('.value.trip').click((e) => {
        let start = $(e.currentTarget).data('start');
        let finish = $(e.currentTarget).data('finish');
        newOrderAsRoute(start, finish, $(e.currentTarget).data('meters'));
        
    });
});