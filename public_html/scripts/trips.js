$(window).ready(() => {

    var routeManager = null;
    var travelMode = 'WALKING';

    function toPlace(str) {
        let obj = toLatLng(str);
        if (obj) return toLatLngF(obj);
        return {
            placeId: str
        }
    }

    class RouteManager {
        maps = {};
        parentElem;
        view;
        constructor(parentElem) {
            this.parentElem = parentElem;
            this.view = parentElem.closest('.view');
        }

        ShowMap(fieldElem) {

            let fieldId = fieldElem.attr('id');

            if (this.maps[fieldId]) {
                this.maps[fieldId].destroy();
                delete this.maps[fieldId];
                fieldElem.find('.map-layer').removeClass('show');

                if (Object.keys(this.maps).length == 0)
                    this.view.removeClass('full');
            } else {

                let mapObject = new SelectMap(fieldElem);

                Wait(()=>{
                    return mapObject.Classes;
                }).then((()=>{
                    this.showRoute(fieldElem);
                }).bind(this));

                this.maps[fieldId] = mapObject;
                fieldElem.find('.map-layer').addClass('show');

                if (!this.view.hasClass('full'))
                    this.view.addClass('full');
            } 
        }

        getPlace(fieldId) {
            if (this.maps[fieldId])
                return this.maps[fieldId].place;
            return toPlace(this.parentElem.find('input[name="' + fieldId + '"]').val());
        }

        showRoute(field) {

            let fid = field.attr('id');
            this.parentElem.find('.field').each(((i, elem)=>{
                let other = $(elem);
                if (other.find('.map-container')) {
                    let oid = other.attr('id');

                    if (oid != fid) {
                        this.createRoute(fid, oid);
                        return false;
                    }
                }
            }).bind(this));
        }

        createRoute(startId, finishId) {
            let map1 = this.maps[startId];
            let map2 = this.maps[finishId];

            (map1 ? map1 : map2).getRoutes(this.getPlace(startId), this.getPlace(finishId), travelMode, ((data)=>{

                if (map1) {
                    if (map1.rpath) 
                        map1.rpath.setMap(null);

                    map1.rpath = map1.DrawPath(data);
                    map1.rpath.setOptions( {suppressMarkers: true} );
                }

                if (map2) {
                    if (map2.rpath) 
                        map2.rpath.setMap(null);

                    map2.rpath = map2.DrawPath(data);
                    map2.rpath.setOptions( {suppressMarkers: true} );
                }

            }).bind(this));
        }
    }

    class SelectMap extends VMap {
        place;
        fieldId;
        parentField;
        rpath;

        get inputElem() { return this.parentField.find('input[name="' + this.fieldId + '"]'); };

        constructor(fieldElem, callback) {
            super(fieldElem.find('.map-container'), callback);
            this.parentField = fieldElem;
            this.fieldId = fieldElem.attr('id');
            this.place = toPlace(this.inputElem.val());
        }

        async initMap(crd) {
            super.initMap(crd).then((()=>{

                this.map.addListener("click", (e) => {

                    this.setMainPosition(e.latLng);

                    if (e.placeId) {
                        this.getPlaceDetails(e.placeId).then((place)=>{
                            //place = $.extend(place, e);
                            this.SelectPlace(place);
                        });
                    } else this.SelectPlace(e);
                    
                    return StopPropagation(e);
                })

            }).bind(this));
        }

        SelectPlace(place) {
            this.place = place;
            this.parentField.find('.value').text(PlaceName(place));
            this.inputElem.val(place.id ? place.id : latLngToString(place.latLng));

            routeManager.showRoute(this.parentField);
        }

        Close() {
            this.parentField
                .closest('.field')
                .find('.map-layer')
                .removeClass('show');
            this.destroy();
        }

        destroy() {
            delete routeManager.maps[this.mapElemId];
            super.destroy();
        }
    }


    function newOrderAsRoute(route_id) {
        Ajax({
                action: 'GetRoute',
                data: route_id
            }).then((route)=>{

            if (route) {

                let dialog = viewManager.Create({
                    curtain: $('.wrapper'),
                    title: toLang('New order trip'),
                    content: [
                        {
                            class: GroupFields,
                            content: [
                                {
                                    name: 'StartPlace',
                                    label: "Departure point",
                                    source: '.templates .field',
                                    placeId: route.startPlaceId ? route.startPlaceId : route.startPlace,
                                    placeName: route.startPlace,
                                    class: SelectPlaceField
                                },{
                                    name: 'FinishPlace',
                                    source: '.templates .field',
                                    label: "Point of arrival",
                                    placeId: route.finishPlaceId ? route.finishPlaceId : route.finishPlace,
                                    placeName: route.finishPlace,
                                    class: SelectPlaceField
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
                            dialog.Close();
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

                    routeManager.ShowMap(fieldElem);
                });
            }

        });
    }


    $('.value.trip').click((e) => {
        let route_id = $(e.currentTarget).closest('.field').data('route_id');

        if (route_id)
            newOrderAsRoute(route_id);
        
    });
});