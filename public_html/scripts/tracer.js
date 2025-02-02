class Tracer extends EventProvider {

//EVENTS: FINISHPATH, TEAREDTIME, TEAREDDIST, TOOFAR;


    Options = {
        magnetDistance: 180, // 100 метров от пути
        waitTooFar: 30,
        speedMax: 30,
        tearedTime: 2 * 60,
        tearedDistance: 180,
        startTime: Date.now(),
        backThreshold: 50, // На каком расстоянии сигнал назад будет разворачивать машинку
        smoothSpeed: 0.5
    };
    #geoPos;
    #routePos;
    #routeDistance;
    #routeAngle;
    #lastPos;
    #avgSpeed = false;
    #toSpeed = false;
    #routes;
    #routeIndex = 0;
    #pathIndex;
    #lastCalcTimeTooFar = 0;

    #deltaGeoTime;
    #distaneToGeo;
    #lengthList;
    #totalLength;
    #lastCalcTime;
    #callback;
    #intervalId = false;
    #periodTime;
    #curStep;
    #nextStep;
    #curLegIdx;
    #toofarPoints;

    get Enabled() { return this.#intervalId != false; }
    set Enabled(value) { this.#setUpdateEnabled(value); }

    get AvgSpeed() { return this.#avgSpeed; };
    get RouteDistance() { return this.#routeDistance; };
    get StartTime() { return this.Options.startTime; };
    get TotalLength() { return this.#totalLength; };
    get RemaindDistance() { return this.#totalLength - this.#routeDistance; };
    get RemaindTime() { return this.RemaindDistance / this.AvgSpeed; };
    get Route() { return this.#routes[this.#routeIndex]; };
    get Leg() { return this.Route.legs[this.#curLegIdx]; };
    get Duration() { return this.Leg.duration; };
    get Step() { return this.#curStep; }
    get NextStep() { return this.#nextStep; }
    get RoutePosition() { return this.#routePos; }

    GetFinishTime(currentTime) {
        let p = this.RouteDistance / this.TotalLength;
        let result = 0;
        if (p < 0.5)
            result = this.CalcTime(1);
        else result = this.StartTime + (currentTime - this.StartTime) * this.TotalLength / this.RouteDistance; 
        return Math.round(result);
    };

    CalcTime(timePercent) {
        return Math.round(this.StartTime + this.TotalLength / Math.max(this.AvgSpeed, 0.1) * 60 * 60 * timePercent);
    }

    constructor(routes, callback, periodTime, options=null) {

        super();

        this.#periodTime = periodTime;
        this.#lastCalcTime = Date.now();
        this.#callback = callback;

        this.SetRoutes(routes, options);
    }

    #setUpdateEnabled(value) {
        if (this.Enabled != value) {
            if (value) 
                this.#intervalId = setInterval(this.update.bind(this), this.#periodTime);
            else {
                clearInterval(this.#intervalId);
                this.#intervalId = false;
            }
        }
    }

    SetRoutes(routes, options) {

        this.#reset();

        this.Options = $.extend(this.Options, options);
        this.#routes = routes;
        this.#lengthList = [];
        this.#totalLength = CalcPathLength(this.#routes, this.#routeIndex, this.#lengthList);

        let accumDist = 0;
        this.forEachSteps((routes, r, l, s)=>{
            routes[r].legs[l].steps[s].startDistance = accumDist;
            accumDist += routes[r].legs[l].steps[s].distance.value;
            routes[r].legs[l].steps[s].finishDistance = accumDist;
        })

        if (this.Options.beginPoint) 
            this.#setGeoPos(this.Options.beginPoint);
        else this.#calcRoutePos();

        if (!isEmpty(this.Options.speed))
            this.SetSpeed(this.Options.speed, true);

        this.Enabled = true;
    }

    #reset() {
        this.#routeDistance = 0;
        this.#distaneToGeo = -1;
        this.#curLegIdx = -1;
        this.#curStep = null;
    }

    ToPoint(latLng) {
        let inPath = {};
        let p = Tracer.CalcPointInPath(this.Route.overview_path, 
            latLng, inPath, this.Options.magnetDistance);

        if (p) {
            this.#routePos = p;
            this.#routeDistance = inPath.distance;
        }
    }

    forEachSteps(func) {
        for (let r=0; r<this.#routes.length; r++) {
            let legs = this.#routes[r].legs;
            for (let l=0; l<legs.length; l++)
                for (let s=0; s<legs[l].steps.length; s++) {
                    let result = func(this.#routes, r, l, s);
                    if (result)
                        return result;
                }
        }
    }

    destroy() {
        this.Enabled = false;
        super.destroy();
    }

    SetSpeed(v, reset = false) {

        if (isStr(v)) v = parseFloat(v);
        this.#toSpeed = v.clamp(-this.Options.speedMax, this.Options.speedMax);
        if (reset)
            this.#avgSpeed = this.#toSpeed;
    }

    update() {
        this.#updateRoutePos();

        if (this.#lastPos) {
            if (!this.#routePos.equals(this.#lastPos))
                this.#callback(this.#routePos, this.AvgSpeed > 0 ? this.#routeAngle : (this.#routeAngle + 180) % 360);
        } else this.#callback(this.#routePos);
        this.#lastPos = this.#routePos;
    }

    #checkCurStep() {

        let lastStep = this.#curStep;
        let lastLegIdx = this.#curLegIdx;
        
        let accumDist = 0;
        this.#curStep = null;
        this.#nextStep = this.#routes[0].legs[0].steps[0];

        this.forEachSteps(((routes, r, l, s)=>{
            let step = routes[r].legs[l].steps[s];
            accumDist += step.distance.value;
            if (accumDist > this.#routeDistance) {
                if (!this.#curStep) {
                    this.#curStep = step;
                    this.#curLegIdx = l;
                }
                else {
                    this.#nextStep = step;
                    return true;
                }
            }
            return false;
        }).bind(this));

        if (this.#curStep != lastStep)
            this.SendEvent("CHANGESTEP", this.#curStep);

        if (this.#curLegIdx != lastLegIdx)
            this.SendEvent("CHANGELEG", this.Leg);
    }

    #updateRoutePos() {
        let k = this.Options.smoothSpeed;
        this.#avgSpeed = this.AvgSpeed * (1 - k) + this.#toSpeed * k;

        this.#routeDistance = (this.#routeDistance + this.AvgSpeed * this.#periodTime / 1000)
                                    .clamp(0, this.#totalLength);

        this.#calcRoutePos();
        this.#checkCurStep();
    }

    #calcDistance(inPath) {
        let result = 0;
        for (let i=0; i<inPath.idx; i++)
            result += this.#lengthList[i];
        return result + inPath.distance;
    }

    #calcRoutePos() {

        let distance = this.#routeDistance;
        let path = this.Route.overview_path;
        let idx = 0;

        if (distance < this.#totalLength) {
            if (distance > 0) {
                let d = 0;
                for (let i=0; i<this.#lengthList.length; i++) {
                    let l = this.#lengthList[i];

                    if (l + d < distance)
                        d += l;
                    else {
                        let p1 = path[i];
                        let p2 = path[i + 1];
                        let lk = (distance - d) / l;
                        this.#pathIndex = i;
                        this.#routeAngle = CalcAngle(p1, p2);
                        this.#routePos = new google.maps.LatLng(
                            p1.lat() + (p2.lat() - p1.lat()) * lk,
                            p1.lng() + (p2.lng() - p1.lng()) * lk
                        );
                        return;
                    }
                }
            } else {
                idx = 0;
                this.#routeAngle = CalcAngle(path[0], path[1]);
            }
        } else {
            idx = path.length - 1;
            this.#routeAngle = CalcAngle(path[idx - 1], path[idx]);

            this.SendEvent('FINISHPATH', this);
        }

        this.#routePos = path[this.#pathIndex = idx];        
    }

    SetNextPosition(distance) {

        let speed = this.#toSpeed;
        distance = distance.clamp(0, this.TotalLength);

        if (this.#distaneToGeo > -1) {
            let deltaDist = distance - this.#distaneToGeo;

            speed = (deltaDist / this.#deltaGeoTime)
                            .clamp(-this.Options.speedMax, this.Options.speedMax); //  m/s

            //console.log(speed);

            let tearedTime = this.#deltaGeoTime > this.Options.tearedTime;
            let tearedDist = Math.abs(deltaDist) > this.Options.tearedDistance;


            if (tearedTime || tearedDist) {

                if (tearedTime)
                    this.SendEvent('TEAREDTIME', tearedDist);
                else this.SendEvent('TEAREDDIST', tearedDist);
                    
                this.SetSpeed(speed);

                console.log('Teared path, time: ' + this.#deltaGeoTime + ', distance: ' + distance);
            } else {
                let k = deltaDist < 0 ? 0.5 : 0.8;
                this.SetSpeed(this.#toSpeed ? (this.#toSpeed * (1 - k) + speed * k) : speed);
            }
        }
            
        this.#routeDistance = this.#distaneToGeo = distance;
        this.#calcRoutePos();
        this.#checkCurStep();
    }

    #snapshotGeoTime() {
        let currentTime = Date.now();
        this.#deltaGeoTime = (currentTime - this.#lastCalcTime) / 1000;
        this.#lastCalcTime = currentTime;
        console.log("Delta geo time: " + this.#deltaGeoTime);
    }

    #tooFarReset() {
        this.#lastCalcTimeTooFar = 0;
        this.#toofarPoints = null;
    }

    #tooFar(latLng) {
        this.#lastCalcTimeTooFar += this.#deltaGeoTime;

        if (!this.#toofarPoints) this.#toofarPoints = [];
        this.#toofarPoints.push(latLng);

        if (this.#lastCalcTimeTooFar > this.Options.waitTooFar) {
            this.SendEvent('TOOFAR', {
                points: this.#toofarPoints,
                time: this.#lastCalcTimeTooFar
            });
            this.#tooFarReset();
        } 
    }

    #setGeoPos(latLng) {

        if (this.#routes && (this.#routes.length > 0)) {
            this.#snapshotGeoTime();

            let path = this.Route.overview_path;
            let inPath = {};
            let p = Tracer.CalcPointInPath(path, latLng, inPath, this.Options.magnetDistance, this.#routeDistance);
            //let p = this.CalcPointInLeg(this.#curLegIdx, latLng, inPath);

            if (p) {
                this.SetNextPosition(inPath.distance);
                this.#tooFarReset();
            }
            else {
                this.#tooFar(latLng);
                console.log('Distance more that ' + this.Options.magnetDistance + 'm, delta-time: ' + this.#lastCalcTimeTooFar);
            }
        }
    }

    ReceivePoint(latLng) {
        this.#setGeoPos(latLng);
    }

    CalcPointInLeg = function (LegIdx, p, ResultData) {
        let accumDist = 0;
        let variantes = [];
        let magnet = this.Options.magnetDistance;

        this.forEachSteps((routes, r, l, s) => {
            let step = routes[r].legs[l].steps[s];
            let inPath = {};
            let path = [step.start_point].concat(step.path, [step.end_point]);

            let point = Tracer.CalcPointInPath(path, p, inPath, magnet);
            if (point) {
                variantes.push({
                    i: inPath.idx,
                    point: point,
                    distanceToLine: inPath.distanceToLine,
                    distance: accumDist + inPath.distance 
                });
            }

            accumDist += inPath.totalLength;
        });


        accumDist = 0;

        this.forEachSteps((routes, r, l, s) => {
            let step = routes[r].legs[l].steps[s];
            let inPath = {};
            let path = [step.start_point].concat(step.path, [step.end_point]);

            let point = Tracer.CalcConerInPath(path, p, inPath, magnet);
            if (point) {
                variantes.push({
                    i: inPath.idx,
                    point: point,
                    distanceToLine: inPath.distanceToLine,
                    distance: accumDist + inPath.distance 
                });
            }

            accumDist += inPath.totalLength;
        });

        $.extend(ResultData, Tracer.GetNearestVariant(variantes, this.#routeDistance, magnet));
        return ResultData.point;
    }
}

Tracer.GetNearestVariant = function(variantes, routeDistance, magnet) {
    let k = 0.7;
    if (variantes.length > 0) {
        variantes.sort((v1, v2) => {

            let td1 = Math.abs(v1.distance - routeDistance) / magnet;
            let td2 = Math.abs(v2.distance - routeDistance) / magnet;
            let td3 = Math.abs(v1.distanceToLine - v2.distanceToLine) / magnet;

            return (td1 - td2) * (1 - k) + td3 * k;

        });
        return variantes[0];
    }
    return null;
}

Tracer.CalcConerInPath = function (path, p, inPath, minDistance = Number.MAX_VALUE) {
    let min = minDistance;
    let result = false;
    accumDist = 0;

    let distList = [];
    inPath.totalLength = CalcLengths(path, distList);

    for (let i=0; i<path.length; i++) {
        let h = Distance(path[i], p);
        if (h < min) {
            min = h;
            result = path[i];

            inPath.idx = i;
            inPath.distance = accumDist;
            inPath.distanceToLine = h;
        }
        if (i < path.length - 1)
            accumDist += distList[i];
    }

    return result;
}

Tracer.CalcPointInPath = function (path, p, ResultData, minDistance = Number.MAX_VALUE, currenDistance = -1) {

    let accumDist = 0;
    let distList = [];
    let pil2 = Math.PI / 2;
    let toGrad = 1 / Math.PI * 180;

    ResultData = $.extend(ResultData, {
        totalLength: CalcLengths(path, distList),
        point: false
    });

    let variantes = [];

    for (let i=0; i<path.length - 1; i++) {

        let p1 = path[i];
        let p2 = path[i + 1];
        let b = distList[i];

        let angle = minusRad(CalcAngleRad(p1, p2), CalcAngleRad(p1, p));
        if (angle < pil2) {
            let c = Distance(p1, p);

            let b2 = c * Math.cos(angle);

            if (b2 < b) {

                let h = c * Math.sin(angle);

                //console.log("i: " + i + ", distance to line: " + h + ")");
                if (h < minDistance) {
                    let lk = b2 / b;
                    let result = new google.maps.LatLng(
                        p1.lat() + (p2.lat() - p1.lat()) * lk,
                        p1.lng() + (p2.lng() - p1.lng()) * lk
                    );

                    //v_map.MarkerManager.CreateMarkerDbg(p, 3000);
                    //v_map.MarkerManager.CreateMarkerDbg(p1, 3000, 'blue');
                    //v_map.MarkerManager.CreateMarkerDbg(p2, 3000, 'blue');

                    //v_map.MarkerManager.CreateMarkerDbg(result, 3000);

                    variantes.push({
                        idx: i,
                        distance: accumDist + b2,
                        distanceToLine: h,
                        point: result
                    });
                }
            }
        }
        accumDist += b;
    }

    //let inPath = {};
    //if (Tracer.CalcConerInPath(path, p, inPath, minDistance))
        //variantes.push(inPath);

    if (variantes.length > 0) {

        if (currenDistance > -1)
            $.extend(ResultData, Tracer.GetNearestVariant(variantes, currenDistance, minDistance));
        else {
            variantes.sort((v1, v2) => v2.distanceToLine - v1.distanceToLine);
            $.extend(ResultData, variantes[0]);
        }
    }

    return ResultData.point;
}