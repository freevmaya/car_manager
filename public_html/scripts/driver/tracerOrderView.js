class TracerOrderView extends PathView {

    #speedInfo;
    #stepInfo;

    #updateListenerId;
    #updateTimelineId;
    #mapClickListener;

    #tracer;

    #selectOrderPath;
    #selectOrderPathRender;
    #points;
    #isDrive;
    #lastSpeed;
    #waitDialog;

    get Tracer() { return this.#tracer; }
    get isDrive() { return this.#isDrive; };
    set isDrive(value) { this.setIsDrive(value); };
    
    get Order() { return null; }

    afterConstructor() {

        this.#speedInfo = this.view.find('.speedInfo');
        this.#stepInfo = this.view.find('.stepInfo');

        this.#speedInfo.moveTo(this.windows);
        this.#stepInfo.moveTo(this.windows);

        this.contentElement.css('display', 'none');

        orderManager.AddListener('CREATED_ORDER', this.onCreatedOrder.bind(this));
        orderManager.AddListener('REMOVED_ORDER', this.onRemovedOrder.bind(this));
        orderManager.AddListener('CHANGE_ORDER', this.onChangeOrder.bind(this))
        orderManager.AddListener('CHANGE_PATH', this.onChangePath.bind(this))

        super.afterConstructor();

        VMap.AfterInit(this.refreshPath.bind(this));

        if (DEV) {
            afterCondition(()=>{
                return v_map && v_map.map;
            }, (()=>{
                v_map.AddListener('MAINMARKERCLICK', ((e)=>{
                    if (this.Tracer)
                        this.Tracer.Pause();
                }).bind(this));
            }).bind(this));


            this.headerElement.find('.tracerBar')
                .click(this.onTraceBarClick.bind(this))
                .css('cursor', 'pointer');
        }
    }

    onChangePath(e) {
        VMap.AfterInit(this.RequireRefresh.bind(this));
    }

    refreshPath() {

        this.#points = orderManager.Path;
        if (this.#points && (this.#points.length > 1)) {

            let waypoints = [];

            for (let i = 1; i<this.#points.length - 1; i++)
                waypoints.push({location: this.#points[i], stopover: true});

            let request = {
                origin: this.#points[0],
                waypoints: waypoints,
                destination: this.#points[this.#points.length - 1],
                travelMode: travelMode
            };

            v_map.DirectionsService.route(request, ((result, status) => {
                if (status == 'OK')
                    this.setPath(result);
                else console.log(request);
            }).bind(this));
        } else {
            this.closePathOrder();
            this.isDrive = false;
        }
    }

    _refresh() {
        super._refresh();
        this.refreshPath();
    }

    onCreatedOrder(order) {
        this.RequireRefresh();
    }

    onRemovedOrder(order) {
        this.RequireRefresh();
    }

    onChangeOrder(e) {
        let order = e.value;
        if (order.state == 'wait_meeting')
            this.#waitDialog = app.showQuestion("Waiting for a passenger", {
                'Complete': ()=>{
                   order.SetState('execution'); 
                },
                'Reject': ()=>{
                   order.SetState('reject'); 
                }
            });
        else if (this.#waitDialog) {
            this.#waitDialog.Close();
            this.#waitDialog = null;
        }
    }

    onTraceBarClick(e) {
        if (this.Tracer) {
            this.Tracer.SetNextDistance(e.offsetX / $(e.currentTarget).width() * this.Tracer.TotalLength);
            v_map.setMainPosition(this.Tracer.RoutePosition);
            this.doUpdateTimeLine();
        }
    }

    createMainPath(mainPoint) {

        if (orderManager.length > 0) {
            mainPoint = mainPoint ? mainPoint : v_map.getMainPosition();
            orderManager.ResetPath(mainPoint);
        }
    }

    togglePathOrder(order_id) {

        if (this.#selectOrderPath && (this.#selectOrderPath.orderId == order_id))
            this.closeSelectOrderPath();
        else {
            let order = orderManager.GetOrder(order_id);
            this.pathRequest({
                origin: VMap.preparePlace(order.start),
                destination: VMap.preparePlace(order.finish),
            }, this.showSelectOrderPath.bind(this, order_id));
        }
    }

    showSelectOrderPath(order_id, value) {
        this.closeSelectOrderPath();
        this.#selectOrderPath = value;
        this.#selectOrderPath.orderId = order_id;
        this.#selectOrderPathRender = v_map.DrawPath(this.#selectOrderPath, driverOrderPathOptions);
    }

    closeSelectOrderPath() {
        if (this.#selectOrderPathRender) {
            this.#selectOrderPathRender.setMap(null);
            this.#selectOrderPathRender = null;
            this.#selectOrderPath = null;
        }
    }

    visibleMarker(visibility) {
        if (this.options.marker)
            this.options.marker.setMap(visibility ? null : v_map.map);
    }

    initView() {
        super.initView();
        this.view.addClass("taken-order");
    }

    /*
    resetForState() {
        let state = this.Order.state;
        this.view.removeClass(STATES);
        this.view.addClass(state);
        this.setStateText(state);

        this.view
            .removeClass(STATES)
            .addClass(state);

        if (state == 'driver_move')
            this.reDrawPath();
        else if (state == 'accepted') this.checkNearPassenger();

        ViewManager.resizeMap();

        this.isDrive = (state == 'driver_move') || (state == 'execution');
    }*/

    SetState(state) {
    }

    setIsDrive(value) {

        if (this.#isDrive != value) {
            this.#isDrive = value;
            $(v_map.MainMarker.content)
                .toggleClass('position', !value)
                .toggleClass('driver-position', value);

            v_map.CameraFollowPath = value;

            if (value) {
                this.#updateListenerId = v_map.AddListener('UPDATE', this.onUpdateMap.bind(this));
                this.#updateTimelineId = transport.AddListener('RECEIVE_SERVERTIME', this.doUpdateTimeLine.bind(this));
            }
            else {
                v_map.RemoveListener('UPDATE', this.#updateListenerId);
                transport.RemoveListener('RECEIVE_SERVERTIME', this.#updateTimelineId);

                this.#stepInfo.hide();
            }
        }


        this.#speedInfo.toggle(value);
        this.view.toggleClass('expand', !value).toggleClass('collaps', value);
    }

    doCheckRoutePoints(latLng) {

        let min = 15;
        let nearest = -1;
        for (let i=0; i<this.#points.length; i++) {
            let distance = Distance(this.#points[i], latLng);
            if (distance < min) {
                nearest = i;
                min = distance;
            }
        }

        if (nearest > -1) {

            let order = orderManager.Graph.getStartOrder(nearest);
            if (order && (order.state == 'accepted')) {
                this.#lastSpeed = this.Tracer.AvgSpeed;
                this.Tracer.Pause();
                order.SetState('wait_meeting');
            }
            else {
                let order = orderManager.Graph.getFinishOrder(nearest);
                if (order && (order.state == 'execution'))
                    order.SetState('finished');
            }
        }
    }

    onChangeLeg(e) {
        if (e.value) this.doCheckRoutePoints(e.value.start_location);
    }

    onChangeStep(e) {
        let tracer = this.Tracer;
        this.#stepInfo.find('.instruction').html(tracer.NextStep ? tracer.NextStep.instructions : '');
    }

    onChangeselectOrderPath(e) {
        const directions = this.pathRender.getDirections();
        if (this.Tracer)
            this.Tracer.SetRoutes(directions.routes);
    }

    reDrawPath() {

        let options = $.extend({}, driverPathOptions, {
            preserveViewport: this.pathRender != null
        });
            
        this.closePathOrder();
        if (this.Path) {
            this.pathRender = v_map.DrawPath(this.Path, options);
            this.pathRender.addListener("directions_changed", this.onChangeselectOrderPath.bind(this));
            this.traceOrderPath();
        }
        //this.resetForState();
    }

    onUpdateMap() {

        let tracer = this.Tracer;
        if (tracer) {

            this.view.find('.orderDetail .remaindDistance').text(DistanceToStr(tracer.RemaindDistance));
            this.view.find('.orderDetail .remaindTime').text(tracer.RemaindTime.toHHMMSS());

            let remaindDistance = tracer.Step ? (tracer.Step.finishDistance - tracer.RouteDistance) : 0;
            let elem = this.#stepInfo.find('.remaindDistance');
            elem.text(DistanceToStr(remaindDistance));
            elem.toggleClass('dist-warning', remaindDistance < 100);

            let speed = round(tracer.AvgSpeed * 3.6, 1);
            this.#speedInfo.find('.avgSpeed')
                .text(speed >= 0 ? speed + "km/h" : toLang("Backwards"));
            this.#stepInfo.toggle((speed > 0) && (tracer.Step != null));

            jsdata.driver.avgSpeed = tracer.AvgSpeed;
            transport.addExtRequest({
                action: 'setValue',
                data: {
                    model: 'DriverModel',
                    id: user.asDriver,
                    name: 'avgSpeed',
                    value: tracer.AvgSpeed
                }
            });
        }
    }

    doUpdateTimeLine() {
        let tracer = this.Tracer;
        if (tracer) {
            this.headerElement.find('.tracerBar > div').css('width', (tracer.RouteDistance / tracer.TotalLength * 100) + '%');
            this.headerElement.find('.startTime').text($.format.date(tracer.StartTime, HMFormat));
            this.headerElement.find('.finishTime').text($.format.date(tracer.GetFinishTime(transport.serverTime), HMFormat));
        }
    }

    traceOrderPath() {
        if (this.Path) {

            let order = orderManager.TopOrder;

            let options = {
                startTime: order.StartTime, 
                beginPoint: toLatLngF(v_map.getMainPosition()),
                speed: jsdata.driver.avgSpeed
            };

            if (!this.Tracer) {
                this.#tracer = v_map.createTracer(order, this.Path.routes, options);

                //this.Tracer.ReceivePoint(toLatLngF(v_map.getMainPosition()));

                this.Tracer.AddListener('FINISHPATH', this.onFinishPathOrder.bind(this));
                this.Tracer.AddListener('CHANGESTEP', this.onChangeStep.bind(this));
                this.Tracer.AddListener('CHANGELEG', this.onChangeLeg.bind(this));
            } else {
                switch (order.state) {
                    case 'execution': 
                            options.speed = this.#lastSpeed;
                            break;
                    case 'wait_meeting': 
                            options.speed = 0;
                            break;
                }

                this.Tracer.SetRoutes(this.Path.routes, options);
            }

            this.doUpdateTimeLine();

            this.isDrive = true;
        }
    }

    checkAndCloseTrace() {
        if (this.Tracer) {
            if (!orderManager.TopOrder || INACTIVESTATES.includes(orderManager.TopOrder.state)) {
                v_map.removeTracer(this.Tracer);
                this.#tracer = null;
            }
        }
    }

    closePathOrder() {
        super.closePathOrder();
        this.closeSelectOrderPath();
        this.checkAndCloseTrace();
    }

    onFinishPathOrder(tracer) {
        let order = orderManager.Graph.getFinishOrder(this.#points.length - 1);
        if (order && ACTIVESTATES.includes(order.state))
            order.SetState('finished');
    }

    destroy() {
        this.isDrive = false;
        this.closeSelectOrderPath();
        super.destroy();
    }

    Close() {

        this.#speedInfo.remove();
        this.#stepInfo.remove();
        return super.Close();
    }
}