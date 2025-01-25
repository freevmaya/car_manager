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

        afterCondition(()=>{
            return typeof(google.maps.DirectionsRenderer) != 'undefined';
        }, this.reDrawPath.bind(this));
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

    #listenerId;

    get Order() { return this.getOrder(); };

    getOrder() {
        return this.options.order;
    }

    afterConstructor() {
        super.afterConstructor();
        this.#fromState(this.Order.state);
        this.#listenerId = this.Order.AddListener('CHANGE', this.onChangeOrder.bind(this));
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

    onChangeOrder(e) {
        this.Close();
        /*
        if (e.value.state == 'accepted')
            this.Close();
        else this.#fromState(e.value.state);
        */
    }

    visibleMarker(visibility) {

         let idx = v_map.MarkerManager.IndexOfByOrder(this.Order.id);
        if (idx > -1)
            v_map.MarkerManager.markers.users[idx].setMap(visibility ? v_map.map : null);

    }

    setStateText(state, ext=null) {
        $('#state-' + this.Order.id).text(toLang(state) + (ext ? (" " + ext) : ''));
    }

    #fromState(state) {

        this.view.removeClass('wait accepted driver_move wait_meeting execution finished expired');
        this.view.addClass(this.Order.state = state);
        this.setStateText(state);
    }

    continueOrder(e) {
        this.blockClickTemp(e, WAITOFFERS * 1000);
        this.Order.SetState(this.Order.state == 'accepted' ? 'driver_move' : 'accepted', ((result)=>{
            if (!result) this.trouble(result);
        }).bind(this));
    }

    offerToPerform(e) {
        this.blockClickTemp(e, WAITOFFERS * 1000);
        orderManager.TakenOrders.length == 0;
        this.Order.SetState(orderManager.TakenOrders.length == 0 ? 'driver_move' : 'accepted');
    }

    reject() {
        this.Order.SetState('rejected');
    }

    letsGot() {
        this.Order.SetState('execution');
    }

    destroy() {
        this.Order.RemoveListener('CHANGE', this.#listenerId);
        if (this.Order.state != 'finished')
            this.visibleMarker(true);
        this.closePathOrder();
        super.destroy();
    }
}