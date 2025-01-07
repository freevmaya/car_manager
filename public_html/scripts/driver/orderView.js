class OrderView extends BottomView {

    pathRender;
    #path;

    get Path() {return this.#path; };
    set Path(value) { this.setPath(value); };
    get Order() { return this.getOrder(); };

    constructor(elem, callback = null, options) {
        super(elem, callback, options);

        this.pathRequest();
    }

    getOrder() {
        return this.options.order;
    }

    afterConstructor() {
        super.afterConstructor();
        this.SetState(this.Order.state);
    }

    pathRequest(v_request) {

        let request = $.extend({
            origin: VMap.preparePlace(this.Order.start),
            destination: VMap.preparePlace(this.Order.finish),
            travelMode: travelMode
        }, v_request);

        if (!isEmpty(request.origin) && !isEmpty(request.destination)) {
            v_map.DirectionsService.route(request, ((result, status) => {
                if (status == 'OK')
                    this.setPath(result);
                else console.log(request);
            }).bind(this));
        }
    }

    setPath(value) {
        this.#path = value;
        this.reDrawPath();
    }

    addPointToPath(latLng) {
        let wlist = this.Path.request.waypoints ? this.Path.request.waypoints : [];
        wlist.push({location: latLng});
        this.pathRequest($.extend({
            waypoints: wlist,
            optimizeWaypoints: true
        }, this.Path.request));
    }

    initView() {
        super.initView();

        this.headerElement.find('.start').text(PlaceName(this.Order.start));
        this.headerElement.find('.finish').text(PlaceName(this.Order.finish));
    }

    setOptions(options) {
        super.setOptions(options);
        this.options.marker.setMap(null);
    }

    SetStateText(state, ext=null) {
        $('#state-' + this.Order.id).text(toLang(state) + (ext ? (" " + ext) : ''));
    }

    SetState(state) {
        let lastState = this.Order.state;

        this.view.removeClass('wait accepted driver_move wait_meeting execution finished expired');
        this.view.addClass(this.Order.state = state);
        this.SetStateText(state);

        this.view
            .removeClass(lastState)
            .addClass(state);
    }

    reDrawPath() {
        this.closePathOrder();
        if (this.Path) 
            this.pathRender = v_map.DrawPath(this.Path, defaultPathOptions);
    }

    offerToPerform(e) {
        this.blockClickTemp(e, WAITOFFERS * 1000);

        v_map.getRoutes(Extend({}, user, ['lat', 'lng']), this.Order.start, this.Order.travelMode, ((result)=>{

            Ajax({
                action: 'offerToPerform',
                data: JSON.stringify({id: this.Order.id, remaindDistance: result.routes[0].legs[0].distance.value + takenOrders.remaindDistance()})
            }).then(((response)=>{
                if (response.result != 'ok')
                    this.trouble(response);
            }).bind(this));
        }).bind(this));
    }

    reject() {
        Ajax({
            action: 'SetState',
            data: {id: this.Order.id, state: 'rejected'}
        });
    }

    letsGot() {
        Ajax({
            action: 'SetState',
            data: {id: this.Order.id, state: 'execution'}
        });
    }
}