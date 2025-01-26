class TracerOrderView extends PathView {

    #speedInfo;
    #stepInfo;
    #selectOrder;

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
    #processOrders;

    get Tracer() { return this.#tracer; }
    get isDrive() { return this.#isDrive; };
    set isDrive(value) { this.setIsDrive(value); };
    get EnableUpdate() { return this.#updateListenerId; }
    set EnableUpdate(value) { this.setEnableUpdate(value); }
    
    get Order() { return null; }

    afterConstructor() {

        this.#speedInfo = this.view.find('.speedInfo');
        this.#stepInfo = this.view.find('.stepInfo');
        this.#selectOrder = this.view.find('.selectOrder');

        this.view.find('.vidget').moveTo(this.windows);

        this.#processOrders = {};

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
                        this.Tracer.Enabled = false;
                }).bind(this));
            }).bind(this));


            this.headerElement.find('.tracerBar')
                .click(this.onTraceBarClick.bind(this))
                .css('cursor', 'pointer');
        }

        this.#lastSpeed = jsdata.driver.avgSpeed;

        //Надо както удалять в destroy
        $(window).on('blur', this.onBlur.bind(this));
        $(window).on('focus', this.onFocus.bind(this));
    }

    onChangePath(e) {
        VMap.AfterInit(this.RequireRefresh.bind(this));
    }

    onBlur(e) {
        this.EnableUpdate = false;
    }

    onFocus(e) {
        this.EnableUpdate = this.isDrive;
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
                if (status == 'OK') {
                    for (let i=0; i<result.routes[0].legs.length; i++) {
                        let p = this.#points[i];
                        let leg = result.routes[0].legs[i];
                        if (p.start) {
                            leg.start = p.start;
                        } else if (p.finish) {
                            leg.finish = p.finish;
                        }
                    }
                    this.setPath(result);
                } else console.log(request);
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
        if (order.state == 'wait_meeting') {
            this.#waitDialog = app.showQuestion("Waiting for a passenger '" + getUserName(order) + "'", {
                'Complete': ()=>{
                   order.SetState('execution'); 
                },
                'Reject': ()=>{
                   order.SetState('reject'); 
                }
            });
            this.addProcessOrder(order);
        } else {
            if (this.#waitDialog) {
                this.#waitDialog.Close();
                this.#waitDialog = null;
            }

            if (INACTIVESTATES.includes(order.state)) 
                this.removeProcessOrder(order);
        }
    }

    removeProcessOrder(order) {
        delete this.#processOrders[order.id];
        console.log(this.#processOrders);
    }

    addProcessOrder(order) {
        this.#processOrders[order.id] = order;
        console.log(this.#processOrders);
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
            }, this.showSelectOrderPath.bind(this, order));
        }
    }

    showSelectOrderPath(order, value) {
        this.closeSelectOrderPath();
        this.#selectOrderPath = value;
        this.#selectOrderPath.orderId = order.id;
        this.#selectOrderPathRender = v_map.DrawPath(this.#selectOrderPath, driverOrderPathOptions);

        this.#selectOrder.find('.header').text($.format.date(Date.parse(order.pickUpTime), dateTinyFormat) + " " + getUserName(order));
        this.#selectOrder.find('.content').text(order.meters);
        this.#selectOrder.show();
    }

    closeSelectOrderPath() {
        if (this.#selectOrderPathRender) {
            this.#selectOrderPathRender.setMap(null);
            this.#selectOrderPathRender = null;
            this.#selectOrderPath = null;
            this.#selectOrder.hide();
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

    SetState(state) {
    }

    setEnableUpdate(value) {
        if (this.EnableUpdate != value) {
            if (value)
                this.#updateListenerId = v_map.AddListener('UPDATE', this.onUpdateMap.bind(this));
            else if (this.#updateListenerId) {
                v_map.RemoveListener('UPDATE', this.#updateListenerId);
                this.#updateListenerId = 0;
            }

            if (this.Tracer)
                this.Tracer.Enabled = value;
        }
    }

    setIsDrive(value) {

        if (this.#isDrive != value) {
            this.#isDrive = value;
            $(v_map.MainMarker.content)
                .toggleClass('position', !value)
                .toggleClass('driver-position', value);

            v_map.CameraFollowPath = value;
            this.EnableUpdate = value;

            if (value)
                this.#updateTimelineId = transport.AddListener('RECEIVE_SERVERTIME', this.doUpdateTimeLine.bind(this));
            else {
                transport.RemoveListener('RECEIVE_SERVERTIME', this.#updateTimelineId);
                this.#stepInfo.hide();
            }
        }


        this.#speedInfo.toggle(value);
        this.view.toggleClass('expand', !value).toggleClass('collaps', value);
    }

    doCheckRoutePoints(leg) {
        if (leg.start && (leg.start.state == 'driver_move')) {
            this.#lastSpeed = this.Tracer.AvgSpeed;
            this.Tracer.Enabled = false;
            leg.start.SetState('wait_meeting');
        }
        else {
            if (leg.finish && (leg.finish.state == 'execution'))
                leg.finish.SetState('finished');
        }
    }

    onChangeLeg(e) {
        if (e.value) this.doCheckRoutePoints(e.value);
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

        let order = orderManager.TopOrder;
        if (this.Path && order) {

            let options = {
                startTime: order.StartTime, 
                beginPoint: toLatLngF(v_map.getMainPosition()),
                speed: order.state == 'wait_meeting' ? 0 : this.#lastSpeed
            };

            if (!this.Tracer) {
                this.#tracer = v_map.createTracer(this.Path.routes, options);

                orderManager.TakenOrders.forEach(((o)=> {
                    if (o.state == 'execution')
                        this.addProcessOrder(o);
                }).bind(this))

                if (!this.EnableUpdate) this.Tracer.Enabled = false;

                //this.Tracer.ReceivePoint(toLatLngF(v_map.getMainPosition()));

                this.Tracer.AddListener('FINISHPATH', this.onFinishPathOrder.bind(this));
                this.Tracer.AddListener('CHANGESTEP', this.onChangeStep.bind(this));
                this.Tracer.AddListener('CHANGELEG', this.onChangeLeg.bind(this));
            } else {
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
        let order = this.#points[this.#points.length - 1].finish;
        if (order && ACTIVESTATES.includes(order.state))
            order.SetState('finished');
    }

    destroy() {
        this.EnableUpdate = false;
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