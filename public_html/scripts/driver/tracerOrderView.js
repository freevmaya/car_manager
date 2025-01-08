class TracerOrderView extends OrderView {

    #speedInfo;
    #stepInfo;

    #updateListenerId;
    #updateTimelineId;
    #mapClickListener;

    #tracerOrder;
    #tracerToStart;
    #pathToStart;
    #isDrive;

    get currentTracer() { return this.#tracerOrder ? this.#tracerOrder : (this.#tracerToStart ? this.#tracerToStart : null); }
    get isDrive() { return this.#isDrive; };
    set isDrive(value) { this.setIsDrive(value); };

    get Order() { return this.options.orders.TopOrder; }

    afterConstructor() {

        this.#speedInfo = this.view.find('.speedInfo');
        this.#stepInfo = this.view.find('.stepInfo');

        this.#speedInfo.moveTo(this.windows);
        this.#stepInfo.moveTo(this.windows);

        //this.#mapClickListener = v_map.map.addListener("click", this.onClickMap.bind(this));

        super.afterConstructor();
    }

    createMainPath() {

        console.log(this.options.orders.getPath());
        //this.pathRequest(null, this.setPath.bind(this));
    }

    /*
    onClickMap(e) {
        if (this.#tracerOrder) {
            let inPath = {};
            let p = Tracer.CalcPointInPath(this.Path.routes[0].overview_path, e.latLng, inPath);

            if (inPath.distanceToLine > this.#tracerOrder.Options.magnetDistance) {
                this.addPointToPath(e.latLng);
            }
        }
    }*/

    visibleMarker(visibility) {
        if (this.options.marker)
            this.options.marker.setMap(visibility ? null : v_map.map);
    }

    initView() {
        super.initView();
        this.view.addClass("taken-order");
    }

    SetState(state) {
        let lastState = this.Order.state;

        this.view.removeClass('wait accepted driver_move wait_meeting execution finished expired');
        this.view.addClass(this.Order.state = state);
        this.SetStateText(state);

        this.view
            .removeClass(lastState)
            .addClass(state);

        if (state == 'driver_move')
            this.showPathToStart();
        else if (state == 'accepted') this.checkNearPassenger();

        setTimeout(this.resizeMap.bind(this), 500);

        this.isDrive = (state == 'driver_move') || (state == 'execution');
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
        let tracer = this.currentTracer;
        this.#stepInfo.find('.instruction').html(tracer.NextStep ? tracer.NextStep.instructions : '');
    }

    onChangeOrderPath(e) {
        const directions = this.pathRender.getDirections();
        if (this.#tracerOrder)
            this.#tracerOrder.SetRoutes(directions.routes);
    }

    reDrawPath() {

        let options = $.extend({}, driverPathOptions, {preserveViewport: this.pathRender != null});
            
        this.closePathOrder();
        if (this.Path) {

            this.pathRender = v_map.DrawPath(this.Path, options);

            if (this.Order.state != 'finished') {
                this.pathRender.addListener("directions_changed", this.onChangeOrderPath.bind(this));

                this.traceOrderPath();
            }
        }
    }

    onUpdateMap() {

        let tracer = this.currentTracer;
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
        let tracer = this.currentTracer;
        this.headerElement.find('.tracerBar > div').css('width', (tracer.RouteDistance / tracer.TotalLength * 100) + '%');
        this.headerElement.find('.startTime').text($.format.date(tracer.StartTime, HMFormat));
        this.headerElement.find('.finishTime').text($.format.date(tracer.FinishTime, HMFormat));
    }

    traceOrderPath() {
        if (this.Order.state == 'execution') {
            if (this.Path) {

                if (!this.#tracerOrder) {
                    this.#tracerOrder = v_map.createTracer(this.Order, this.Path.routes, 
                            {startTime: Date.parse(this.Order.pickUpTime).valueOf()});

                    this.#tracerOrder.AddListener('FINISHPATH', this.onFinishPathOrder.bind(this));
                    this.currentTracer.AddListener('CHANGESTEP', this.onChangeStep.bind(this));
                } else this.#tracerOrder.SetRoutes(this.Path.routes);
            }
        }
    }

    showPathToStart(afterShow) {
        this.closePathToStart();

        let distance = Distance(v_map.getMainPosition(), this.Order.start);

        if (!this.checkNearPassenger()) {

            v_map.getRoutes(v_map.getMainPosition(), this.Order.start, this.Order.travelMode, ((result)=>{
                this.#pathToStart = v_map.DrawPath(result, pathToStartOptions);
                if (afterShow) afterShow();

                if (this.isMyOrder) {
                    this.#tracerToStart = v_map.createTracer(this.Order, result.routes);

                    this.#tracerToStart.AddListener('FINISHPATH', this.onFinishPathToStart.bind(this));
                    this.#tracerToStart.AddListener('CHANGESTEP', this.onChangeStep.bind(this));
                }
            }).bind(this));
        }
    }

    #moveToStart() {
        this.showPathToStart((()=>{

            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, state: 'driver_move'}
            }).then(((response)=>{
                if (response.result != 'ok')
                    this.trouble(response);
            }).bind(this));
            
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

    closePathToStart() {
        if (this.#pathToStart) {
            this.#pathToStart.setMap(null);
            this.#pathToStart = null;
        }

        if (this.#tracerToStart) {
            v_map.removeTracer(this.#tracerToStart);
            this.#tracerToStart = null;
        }
    }

    closePathOrder() {
        super.closePathOrder();

        if (this.#tracerOrder) {
            v_map.removeTracer(this.#tracerOrder);
            this.#tracerOrder = null;
        }
    }

    onFinishPathOrder(tracer) {
        if (this.pathRender) {
            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, state: 'finished'}
            });
            this.closePathOrder();
        }
    }

    onFinishPathToStart(tracer) {
        if (this.#pathToStart) {
            Ajax({
                action: 'SetState',
                data: {id: this.Order.id, state: 'wait_meeting'}
            });
            this.closePathToStart();
        }
    }

    destroy() {
        this.isDrive = false;
        this.closePathToStart();
        super.destroy();
    }

    Close() {

        this.#speedInfo.remove();
        this.#stepInfo.remove();
        return super.Close();
    }
}