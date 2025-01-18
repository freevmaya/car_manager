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
    #lastSpeed = 0;

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

        this.Orders.AddListener('CHANGE', this.onOrdersChange.bind(this));
        super.afterConstructor();

        if (DEV) {
            this.#mapClickListener = v_map.map.addListener("click", ((e)=>{
                if (e.domEvent.ctrlKey) {
                    this.createMainPath(e.latLng);
                    if (this.#tracer)
                        this.#tracer.ReceivePoint(e.latLng);
                }
            }).bind(this));

            v_map.AddListener('MAINMARKERCLICK', ((e)=>{
                if (this.#tracer)
                    this.#tracer.Pause();
            }).bind(this));
        }
    }

    onOrdersChange() {

        this.#points = this.Orders.Path;
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

    createMainPath(mainPoint) {

        if (this.Orders.length > 0) {
            mainPoint = mainPoint ? mainPoint : v_map.getMainPosition();
            this.Orders.ResetPath(mainPoint);
        }
    }

    togglePathOrder(order_id) {

        if (this.#selectOrderPath && (this.#selectOrderPath.orderId == order_id))
            this.closeSelectselectOrderPath();
        else {
            let order = this.Orders.getOrder(order_id);
            this.pathRequest({
                origin: VMap.preparePlace(order.start),
                destination: VMap.preparePlace(order.finish),
            }, this.showSelectOrderPath.bind(this, order_id));
        }
    }

    showSelectOrderPath(order_id, value) {
        this.closeSelectselectOrderPath();
        this.#selectOrderPath = value;
        this.#selectOrderPath.orderId = order_id;
        this.#selectOrderPathRender = v_map.DrawPath(this.#selectOrderPath, driverOrderPathOptions);
    }

    closeSelectselectOrderPath() {
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


        this.#speedInfo.toggle(value);
        this.view.toggleClass('expand', !value).toggleClass('collaps', value);
    }

    onChangeStep() {
        let tracer = this.Tracer;
        this.#stepInfo.find('.instruction').html(tracer.NextStep ? tracer.NextStep.instructions : '');

        if (tracer.Step)
            for (let i=0; i<this.#points.length; i++) {

                if (LatLngEquals(this.#points[i], tracer.Step.start_point)) {
                    let order = this.Orders.Graph.getStartOrder(i);
                    if (order && (order.state == 'accepted'))
                        order.SetState('wait_meeting', tracer.Pause.bind(tracer));
                    else {
                        let order = this.Orders.Graph.getFinishOrder(i);
                        if (order && (order.state == 'execution'))
                            order.SetState('finished');
                    }
                }

                /*
                if (order && (order.state == 'accepted') && LatLngEquals(this.#points[i], tracer.Step.start_point))
                    order.SetState('wait_meeting', tracer.Pause.bind(tracer));

                if (order && (order.state == 'execution') && LatLngEquals(this.#points[i], tracer.Step.end_point))
                    order.SetState('finished');
                    */
            }
    }

    onChangeselectOrderPath(e) {
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

            this.#lastSpeed = tracer.AvgSpeed;
            let speed = round(tracer.AvgSpeed * 3.6, 1);
            this.#speedInfo.find('.avgSpeed')
                .text(speed >= 0 ? speed + "km/h" : toLang("Backwards"));
            this.#stepInfo.toggle((speed > 0) && (tracer.Step != null));
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

                if (!this.Tracer) {
                    this.#tracer = v_map.createTracer(this.Order, this.Path.routes, 
                            {startTime: startTime, beginPoint: toLatLngF(v_map.getMainPosition())});

                    this.Tracer.AddListener('FINISHPATH', this.onFinishPathOrder.bind(this));
                    this.Tracer.AddListener('CHANGESTEP', this.onChangeStep.bind(this));

                    this.Tracer.SetSpeed(this.#lastSpeed);
                } else this.Tracer.SetRoutes(this.Path.routes);

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

            this.closeSelectselectOrderPath();
        }
    }

    onFinishPathOrder(tracer) {
        let order = this.Orders.Graph.getFinishOrder(this.#points.length - 1);
        if (order && ACTIVESTATES.includes(order.state))
            order.SetState('finished');
    }

    destroy() {
        this.isDrive = false;
        this.closeSelectselectOrderPath();
        super.destroy();
    }

    Close() {

        this.#speedInfo.remove();
        this.#stepInfo.remove();
        return super.Close();
    }
}