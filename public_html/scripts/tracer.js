class Tracer extends EventProvider {

//EVENTS: FINISHPATH, TEAREDTIME, TEAREDDIST, TOOFAR;


    Options = {
        magnetDistance: 100, // 100 метров от пути
        waitTooFar: 30,
        speedMax: 30,
        tearedTime: 2 * 60,
        tearedDistance: 100,
        startTime: Date.now()
    };
    #geoPos;
    #routePos;
    #routeDistance;
    #routeAngle;
    #lastPos;
    #avgSpeed = false;
    #routes;
    #routeIndex = 0;
    #pathIndex;
    #timeTooFar = 0;

    #deltaT;
    #lengthList;
    #totalLength;
    #time;
    #callback;
    #intervalId = false;
    #periodTime;
    #curStep;
    #nextStep;
    #curLegIdx;

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

    GetFinishTime(currentTime) { return this.StartTime + (currentTime - this.StartTime) * this.TotalLength / this.RouteDistance; };

    constructor(routes, callback, periodTime, options=null) {

        super();

        this.#periodTime = periodTime;
        this.#time = Date.now();
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
            this.SetSpeed(this.Options.speed);

        this.Enabled = true;
    }

    #reset() {
        this.#routeDistance = 0;
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

    update() {
        this.#updateRoutePos();

        if (this.#lastPos) {
            if (!this.#routePos.equals(this.#lastPos))
                this.#callback(this.#routePos, this.#avgSpeed > 0 ? this.#routeAngle : (this.#routeAngle + 180) % 360);
        } else this.#callback(this.#routePos);
        this.#lastPos = this.#routePos;
    }

    SetSpeed(v) {

        if (isStr(v)) v = parseFloat(v);
        this.#avgSpeed = v.clamp(-this.Options.speedMax, this.Options.speedMax);
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
        if (this.#avgSpeed)
            this.SetNextDistance((this.#routeDistance + this.#avgSpeed * this.#periodTime / 1000)
                                        .clamp(0, this.#totalLength));
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

    SetNextDistance(distance) {

        distance = distance.clamp(0, this.TotalLength);
        let currentTime = Date.now();
        this.#deltaT = (currentTime - this.#time) / 1000;

        let deltaDist = distance - this.#routeDistance;

        let speed = (deltaDist / this.#deltaT)
                        .clamp(-this.Options.speedMax, this.Options.speedMax);

        let tearedTime = this.#deltaT > this.Options.tearedTime;
        let tearedDist = Math.abs(deltaDist) > this.Options.tearedDistance;
            
        this.#routeDistance = distance;

        this.#calcRoutePos();
        this.#checkCurStep();

        if (tearedTime || tearedDist) {

            if (tearedTime)
                this.SendEvent('TEAREDTIME', tearedDist);
            else this.SendEvent('TEAREDDIST', tearedDist);
                
            this.SetSpeed(speed);

            console.log('Teared path, time: ' + this.#deltaT + ', distance: ' + distance);
        } else this.SetSpeed(this.#avgSpeed ? ((this.#avgSpeed + speed) / 2) : speed);

        this.#time = currentTime;
    }

    #setGeoPos(latLng) {

        if (this.#routes && (this.#routes.length > 0)) {

            let currentTime = Date.now();
            this.#deltaT = (currentTime - this.#time) / 1000;

            let path = this.Route.overview_path;
            let inPath = {};
            //let p = Tracer.CalcPointInPath(path, latLng, inPath, this.Options.magnetDistance);
            let p = this.CalcPointInLeg(this.#curLegIdx, latLng, inPath);

            if (p) {
                let distance = inPath.distance.clamp(0, this.TotalLength);
                this.SetNextDistance(distance);
                this.#timeTooFar = 0;
            } else {
                this.#timeTooFar += this.#deltaT;
                if (this.#timeTooFar > this.Options.waitTooFar)
                    this.SendEvent('TOOFAR', this.Options.magnetDistance);
                
                console.log('Distance more that ' + this.Options.magnetDistance + 'm');
            }

            this.#time = currentTime;
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
                    r: r,
                    l: l,
                    s: s,
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
                    r: r,
                    l: l,
                    s: s,
                    i: inPath.idx,
                    point: point,
                    distanceToLine: inPath.distanceToLine,
                    distance: accumDist + inPath.distance 
                });
            }

            accumDist += inPath.totalLength;
        });


        if (variantes.length > 0) {
            variantes.sort(((v1, v2) => {

                let td1 = Math.abs(v1.distance - this.#routeDistance);
                let td2 = Math.abs(v2.distance - this.#routeDistance);

                return (td1 - td2) + 0.5 * (v1.distanceToLine - v2.distanceToLine) / magnet;

            }).bind(this));
            $.extend(ResultData, variantes[0]);
            return variantes[0].point;
        }

        return null;
    }
}

Tracer.CalcConerInPath = function (path, p, inPath, minDistance = Number.MAX_VALUE) {
    let min = minDistance;
    let result = false;
    accumDist = 0;

    inPath.distList = [];
    inPath.totalLength = CalcLengths(path, inPath.distList);

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
            accumDist += inPath.distList[i];
    }

    return result;
}

Tracer.CalcPointInPath = function (path, p, inPath, minDistance = Number.MAX_VALUE) {

    let min = minDistance;
    let result = false;
    let accumDist = 0;

    inPath.distList = [];
    inPath.totalLength = CalcLengths(path, inPath.distList);

    for (let i=0; i<path.length - 1; i++) {

        let p1 = path[i];
        let p2 = path[i + 1];
        let b = inPath.distList[i];

        let angle = Math.abs(CalcAngleRad(p1, p2) - CalcAngleRad(p1, p));
        if (angle < Math.PI / 2) {
            let c = Distance(p1, p);

            let b2 = c * Math.cos(angle);

            if (b2 < b) {
                let h = c * Math.sin(angle);
                if (h < min) {
                    min = h;
                    let lk = b2 / b;
                    result = new google.maps.LatLng(
                        p1.lat() + (p2.lat() - p1.lat()) * lk,
                        p1.lng() + (p2.lng() - p1.lng()) * lk
                    );

                    inPath.idx = i;
                    inPath.distance = accumDist + b2;
                    inPath.distanceToLine = h;
                }
            }
        }
        accumDist += b;
    }

    return result;
}