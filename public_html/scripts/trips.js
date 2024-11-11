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

            let fieldId = fieldElem.attr('id');
            this.control = dialog.fieldById(fieldId);
            this.dialog = dialog;

            if (this.openMap)
                this.openMap.destroy();

            let place = fieldElem.data('place');

            let mapObject = new SelectMap(this.control, null, {
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
                this.openMap.visMainMarker(false);
            }).bind(this));
        }
    }

    class SelectMap extends VMap {
        fieldId;
        #elem;
        #control;

        constructor(control, callback, options) {
            super(control.view.find('.map-container'), callback, $.extend({main_marker: options.start_position === false}, options));
            this.#control = control;
            this.#elem = control.view;
            this.fieldId = control.name;
        }

        getPlace() {
            return this.#elem.data('place');
        }

        onMapClick(e) {

            if (!this.#control.options.readonly) {
                this.setMainPosition(e.latLng);

                if (e.placeId) {
                    this.getPlaceDetails(e.placeId).then((place)=>{
                        this.SelectPlace(place);
                    });
                } else this.SelectPlace(e);
            }
            
            return StopPropagation(e);
        }

        async initMap(crd) {
            super.initMap(crd).then((()=>{
                this.map.addListener("click", this.onMapClick.bind(this));
            }).bind(this));
        }

        SelectPlace(val) {
            this.#elem.find('.value').text(PlaceName(val));

            let place = val.location ? 
                            Extend({placeId: val.id, latLng: val.location}, val, ['displayName', 'formattedAddress']) :
                        toLatLng(val.latLng)
            this.#control.val(place);

            routeManager.showRoute(this.fieldId);
        }


        Close() {
            this.#elem
                .closest('.field')
                .find('.map-layer')
                .removeClass('show');
            this.destroy();
        }

        destroy() {
            this.#elem.find('.map-layer').removeClass('show');
            if (routeManager.openMap)
                routeManager.openMap = null;
            super.destroy();
        }
    }


    function newOrderAsRoute(start, finish, meters, orderId, pickUpTime) {
        let dialog;
        let readonly = orderId > 0;
        let actions = {};
        if (readonly)
            actions = {
                Finish: {
                    type: 'submit',
                    action: ()=>{
                        dialog.Close().then(()=>{
                            app.showQuestion(toLang('Are you sure you want to end the trip?'), ()=>{
                                Ajax({
                                    action: 'SetState',
                                    data: JSON.stringify({id: orderId, state: 'finished' })
                                }).then((data)=>{
                                    if (data.result > 0)
                                        window.location.reload();
                                });

                            });
                        })
                    }
                }
            }
        else actions = {
                Send: {
                    type: 'submit',
                    action: ()=>{
                        let path = dialog.getValues();

                        validatorList.refresh();

                        if (validatorList.isSendAllowed() && path.start && path.finish) {

                            Ajax({
                                action: 'AddOrder',
                                data: JSON.stringify({user_id: user.id, path: path, pickUpTime: path.pickUpTime })
                            }).then((data)=>{
                                if (data.result > 0) {
                                    dialog.Close().then(()=>{
                                        window.location.reload();
                                    });
                                }
                            });
                        }
                    }
                }
            }

        actions = $.extend(actions, {
            Close: ()=>{
                dialog.Close();
            },
            'On map': ()=>{
                document.location.href = BASEURL + '/map';
            }
        });

        dialog = viewManager.Create({
            curtain: $('.wrapper'),
            title: toLang(readonly ? 'Current order' : 'New order trip'),
            content: [
                {
                    class: GroupFields,
                    content: [
                        {
                            name: 'start',
                            label: "Departure point",
                            source: '.templates .field',
                            place: start,
                            readonly: readonly,
                            validator: requiredValidator,
                            placeName: PlaceName(start),
                            class: SelectPlaceField
                        },{
                            name: 'finish',
                            source: '.templates .field',
                            label: "Point of arrival",
                            place: finish,
                            readonly: readonly,
                            validator: requiredValidator,
                            placeName: PlaceName(finish),
                            class: SelectPlaceField
                        },{
                            name: 'meters',
                            label: toLang("Distance"),
                            value: meters,
                            readonly: true,
                            class: FormField
                        },{
                            name: 'pickUpTime',
                            label: "Departure time",
                            value: pickUpTime,
                            readonly: readonly,
                            class: DateTimeField
                        }
                    ]
                }
            ],
            actions: actions
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
        let link = $(e.currentTarget);
        newOrderAsRoute(link.data('start'), link.data('finish'), 
            link.data('meters'), link.data('order_id'), link.data('pickuptime'));
        
    });
});