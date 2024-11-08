$(window).ready(() => {

    var routeManager = null;

    class RouteManager {
        maps = {};
        contentElem;
        view;

        get pathElem() { return this.contentElem.find('input[name="path"]'); };

        constructor(contentElem) {
            this.contentElem = contentElem;
            this.view = contentElem.closest('.view');
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

        showRoute(namePoint) {

            let ids = [];
            this.contentElem.find('.field').each(((i, elem)=>{
                elem = $(elem);
                if (elem.find('.map-container')) {
                    ids.push(elem.attr('id'));

                    if (ids.length > 1) {
                        this.createRoute(ids[0], ids[1]);
                        return false;
                    }
                }
            }).bind(this));
        }

        createRoute(startId, finishId) {

            let map1 = this.maps[startId];
            let map2 = this.maps[finishId];


            let pathStr = this.pathElem.val();    
            let lastPath = pathStr ? JSON.parse(pathStr) : null;

            if (map1) lastPath.start = map1.getPlace();
            if (map2) lastPath.finish = map2.getPlace();

            function showPath(map, data, pidx) {
                if (map.rpath) 
                    map.rpath.setMap(null);

                let p = getRoutePoint(data, pidx);
                map.rpath = map.DrawPath(data);
                map.setMainPosition(p);
                map.map.setCenter(p);

                this.pathElem.val(
                    JSON.stringify(GetPath(data, lastPath.start,  lastPath.finish))
                );
            }

            if (lastPath) {
                (map1 ? map1 : map2).getRoutes(lastPath.start, lastPath.finish, travelMode, ((data)=>{ 
                    if (map1) showPath.bind(this)(map1, data, 0);
                    if (map2) showPath.bind(this)(map2, data, -1);
                }).bind(this));
            }
        }
    }

    class SelectMap extends VMap {
        fieldId;
        parentField;
        rpath;

        constructor(fieldElem, callback, options) {
            super(fieldElem.find('.map-container'), callback, $.extend({main_marker: false}, options));
            this.parentField = fieldElem;
            this.fieldId = fieldElem.attr('id');
        }

        getPlace() {
            return JSON.parse(this.parentField.data('place'));
        }

        async initMap(crd) {
            super.initMap(crd).then((()=>{

                this.map.addListener("click", (e) => {

                    this.setMainPosition(e.latLng);

                    if (e.placeId) {
                        this.getPlaceDetails(e.placeId).then((place)=>{
                            this.SelectPlace(place);
                        });
                    } else this.SelectPlace(e);
                    
                    return StopPropagation(e);
                })

            }).bind(this));
        }

        SelectPlace(val) {
            this.parentField.find('.value').text(PlaceName(val));
            this.parentField.data('place', 
                JSON.stringify(Extend({placeId: val.id, latLng: val.location}, val, ['name', 'address']))
            );

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
            delete routeManager.maps[this.mapElemId];
            super.destroy();
        }
    }


    function newOrderAsRoute(path) {
        if (path) {

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
                                place: JSON.stringify(path.start),
                                placeName: path.startName,
                                class: SelectPlaceField
                            },{
                                name: 'finish',
                                source: '.templates .field',
                                label: "Point of arrival",
                                place: JSON.stringify(path.finish),
                                placeName: path.finishName,
                                class: SelectPlaceField
                            },{
                                name: 'pickUpTime',
                                label: "Departure time",
                                class: DateTimeField
                            },{
                                name: 'path',
                                value: JSON.stringify(path),
                                class: HiddenField
                            }
                        ]
                    }
                ],
                actions: {
                    Send: ()=>{
                        Ajax({
                            action: 'AddOrder',
                            data: JSON.stringify($.extend(dialog.getValues(['path']), {user_id: user.id}))
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

                routeManager.ShowMap(fieldElem);
            });
        }
    }


    $('.value.trip').click((e) => {
        let path = $(e.currentTarget).data('path');
        if (path)
            newOrderAsRoute(path);
        
    });
});