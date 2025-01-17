class PathView extends BottomView {

    pathRender;
    #path;

    get Path() {return this.#path; };
    set Path(value) { this.setPath(value); };

    afterConstructor() {
        super.afterConstructor();
        this.createMainPath();
    }

    setPath(value) {
        this.#path = value;
        this.reDrawPath();
    }

    reDrawPath() {
        this.closePathOrder();
        if (this.Path)  
            this.pathRender = v_map.DrawPath(this.Path, defaultPathOptions);
    }

    closePathOrder() {
        if (this.pathRender) {
            this.pathRender.setMap(null);
            this.pathRender = null;
        }
    }

    pathRequest(request, callback = null) {

        request = $.extend({
            travelMode: travelMode
        }, request);

        if (!isEmpty(request.origin) && !isEmpty(request.destination)) {
            v_map.DirectionsService.route(request, ((result, status) => {
                if (status == 'OK')
                    callback(result);
                else console.log(request);
            }).bind(this));
        }
    }

}

class OrderView extends PathView {
    get Order() { return this.getOrder(); };

    getOrder() {
        return this.options.order;
    }

    afterConstructor() {
        super.afterConstructor();
        this.SetState(this.Order.state);
    }

    createMainPath() {
        this.pathRequest(null, this.setPath.bind(this));
    }

    /*
    addPointToPath(latLng) {
        let wlist = this.Path.request.waypoints ? this.Path.request.waypoints : [];
        wlist.push({location: latLng});
        this.pathRequest($.extend({
            waypoints: wlist,
            optimizeWaypoints: true
        }, this.Path.request));
    }
    */



    initView() {
        super.initView();

        this.headerElement.find('.start').text(PlaceName(this.Order.start));
        this.headerElement.find('.finish').text(PlaceName(this.Order.finish));
    }

    pathRequest(v_request, callback = null) {

        super.pathRequest($.extend({
            origin: VMap.preparePlace(this.Order.start),
            destination: VMap.preparePlace(this.Order.finish)
        }, v_request), callback);
    }

    setOptions(options) {
        super.setOptions(options);
        this.visibleMarker(false);
    }

    visibleMarker(visibility) {

         let idx = v_map.MarkerManager.IndexOfByOrder(this.Order.id);
        if (idx > -1)
            v_map.MarkerManager.markers.users[idx].setMap(visibility ? v_map.map : null);

    }

    SetStateText(state, ext=null) {
        $('#state-' + this.Order.id).text(toLang(state) + (ext ? (" " + ext) : ''));
    }

    SetState(state) {

        this.view.removeClass('wait accepted driver_move wait_meeting execution finished expired');
        this.view.addClass(this.Order.state = state);
        this.SetStateText(state);
    }

    continueOrder(e) {
        this.blockClickTemp(e, WAITOFFERS * 1000);
        Ajax({
            action: 'SetState',
            data: {id: this.Order.id, state: 'accepted'}
        }).then(((response)=>{
            if (response.result != 'ok')
                this.trouble(response);
        }).bind(this));
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

    destroy() {
        if (this.Order.state != 'finished')
            this.visibleMarker(true);
        this.closePathOrder();
        super.destroy();
    }
}