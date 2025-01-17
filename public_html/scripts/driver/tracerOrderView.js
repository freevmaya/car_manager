class TracerOrderView extends PathView {

    #speedInfo;
    #stepInfo;

    #updateListenerId;
    #updateTimelineId;
    #mapClickListener;

    #tracer;

    #orderPath;
    #orderPathRender;
    #points;
    #isDrive;

    get Tracer() { return this.#tracer; }
    get isDrive() { return this.#isDrive; };
    set isDrive(value) { this.setIsDrive(value); };
    
    get Order() { return null; }
    get Orders() { return this.options.orders; }

    afterConstructor() {

        this.#speedInfo = this.view.find('.speedInfo');
        this.#stepInfo = this.view.find('.stepInfo');

        this.#speedInfo.moveTo(this.windows);
        this.#stepInfo.moveTo(this.windows);

        this.contentElement.css('display', 'none');
        super.afterConstructor();

        if (DEV)
            this.#mapClickListener = v_map.map.addListener("click", ((e)=>{
                if (e.domEvent.ctrlKey) {
                    this.createMainPath(e.latLng);
                    this.#tracer.ReceivePoint(e.latLng);
                }
            }).bind(this));
    }

    createMainPath(mainPoint) {

        if (this.Orders.length > 0) {
            mainPoint = mainPoint ? mainPoint : v_map.getMainPosition();

            this.#points = this.Orders.ResetPath(mainPoint);

            if (this.#points.length > 1) {

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
            }
        }
    }

    togglePathOrder(order_id) {

        if (this.#orderPath && (this.#orderPath.orderId == order_id))
            this.closeOrderPath();
        else {
            let order = this.Orders.getOrder(order_id);
            this.pathRequest({
                origin: VMap.preparePlace(order.start),
                destination: VMap.preparePlace(order.finish),
            }, this.showOrderPath.bind(this, order_id));
        }
    }

    showOrderPath(order_id, value) {
        this.closeOrderPath();
        this.#orderPath = value;
        this.#orderPath.orderId = order_id;
        this.#orderPathRender = v_map.DrawPath(this.#orderPath, driverOrderPathOptions);
    }

    closeOrderPath() {
        if (this.#orderPathRender) {
            this.#orderPathRender.setMap(null);
            this.#orderPathRender = null;
            this.#orderPath = null;
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
        this.SetStateText(state);

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
        //this.resetForState();
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
                this.#updateTimelineId = setInterval(this.doUpdateTimeLine.bind(this), 5000);
            }
            else {
                v_map.RemoveListener('UPDATE', this.#updateListenerId);
                clearInterval(this.#updateTimelineId);
            }
        }

        let cssStyle = value ? 'block' : 'none';
        this.#speedInfo.css('display', cssStyle);
        this.#stepInfo.css('display', cssStyle);

        this.view.toggleClass('expand', !value).toggleClass('collaps', value);
    }

    onChangeStep() {
        let tracer = this.Tracer;
        this.#stepInfo.find('.instruction').html(tracer.NextStep ? tracer.NextStep.instructions : '');

        if (tracer.Step)
            for (let i=0; i<this.#points.length; i++) {
                let order = this.#points[i].order;

                if (order && (order.state == 'accepted') && LatLngEquals(this.#points[i], tracer.Step.start_point))
                    order.SetState('wait_meeting', tracer.Pause.bind(tracer));

                if (order && (order.state == 'execution') && LatLngEquals(this.#points[i], tracer.Step.end_point))
                    order.SetState('finished');
            }
    }

    onChangeOrderPath(e) {
        const directions = this.pathRender.getDirections();
        if (this.#tracer)
            this.#tracer.SetRoutes(directions.routes);
    }

    reDrawPath() {

        let options = $.extend({}, driverPathOptions, {
            preserveViewport: this.pathRender != null
        });
            
        this.closePathOrder();
        if (this.Path) {
            this.pathRender = v_map.DrawPath(this.Path, options);
            this.pathRender.addListener("directions_changed", this.onChangeOrderPath.bind(this));
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

            this.#speedInfo.find('.avgSpeed').text(round(tracer.AvgSpeed * 3.6, 1) + "km/h");
        }
    }

    doUpdateTimeLine() {
        let tracer = this.Tracer;
        if (tracer) {
            this.headerElement.find('.tracerBar > div').css('width', (tracer.RouteDistance / tracer.TotalLength * 100) + '%');
            this.headerElement.find('.startTime').text($.format.date(tracer.StartTime, HMFormat));
            this.headerElement.find('.finishTime').text($.format.date(tracer.FinishTime, HMFormat));
        }
    }

    traceOrderPath() {
        //if (['execution', 'driver_move'].includes(this.Order.state)) {
            if (this.Path) {

                let startTime = Date.now();

                if (!this.#tracer) {
                    this.#tracer = v_map.createTracer(this.Order, this.Path.routes, 
                            {startTime: startTime});

                    this.#tracer.AddListener('FINISHPATH', this.onFinishPathOrder.bind(this));
                    this.Tracer.AddListener('CHANGESTEP', this.onChangeStep.bind(this));
                } else this.#tracer.SetRoutes(this.Path.routes);

                this.isDrive = true;
            }
        //}
    }

    #moveToStart() {
        Ajax({
            action: 'SetState',
            data: {id: this.Order.id, state: 'driver_move'}
        }).then(((response)=>{
            if (response.result != 'ok')
                this.trouble(response);
        }).bind(this));
    }

    moveToStart(e) {
        this.blockClickTemp(e, 10000);

        let distKm = Distance(this.Order.start, user) / 1000;
        let takeTime = distKm / SLOWSPEED_KM_H * 60 * 60;
        let deltaTime = DeltaTime(this.Order.pickUpTime);

        if (deltaTime > takeTime)
            app.showQuestion(toLang('Trip start time: %1. Are you sure you want to start the trip?', [DepartureTime(this.Order.pickUpTime)]), this.#moveToStart.bind(this));
        else this.#moveToStart();
    }

    checkNearPassenger() {
        let distance = Distance(v_map.getMainPosition(), this.Order.start);

        if (distance <= MAXDISTANCEFORMEETING) {
            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, state: 'wait_meeting'}
            });
            return true;
        }
        return false;
    }

    closePathOrder() {
        super.closePathOrder();

        if (this.#tracer) {
            v_map.removeTracer(this.#tracer);
            this.#tracer = null;
        }
    }

    onFinishPathOrder(tracer) {
        let order = this.#points[this.#points.length - 1].order;
        if (this.pathRender && order && ACTIVESTATES.includes(order.state)) {
            order.SetState('finished');
            this.closePathOrder();
        }
    }

    destroy() {
        this.isDrive = false;
        this.closeOrderPath();
        super.destroy();
    }

    Close() {

        this.#speedInfo.remove();
        this.#stepInfo.remove();
        return super.Close();
    }
}