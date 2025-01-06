class Tracer extends EventProvider {

//EVENTS: FINISHPATH, TEAREDTIME, TEAREDDIST, TOOFAR;


    Options = {
        magnetDistance: 100, // 100 метров от пути
        waitTooFar: 30,
        speedMax: 10,
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
    #intervalId;
    #periodTime;
    #curStep;
    #nextStep;
    #curLeg;

    get AvgSpeed() { return this.#avgSpeed; };
    get RouteDistance() { return this.#routeDistance; };
    get StartTime() { return this.Options.startTime; };
    get FinishTime() { return this.StartTime + this.TakeTime * this.TotalLength / this.RouteDistance; };
    get TotalLength() { return this.#totalLength; };
    get RemaindDistance() { return this.#totalLength - this.#routeDistance; };
    get RemaindTime() { return this.RemaindDistance / this.AvgSpeed; };
    get Legs() { return this.#routes[this.#routeIndex].legs[this.#curLeg]; };
    get Duration() { return this.Legs.duration; };
    get Step() { return this.#curStep; }
    get NextStep() { return this.#nextStep; }
    get TakeTime() { return Date.now() - this.Options.startTime; }

    constructor(routes, callback, periodTime, options=null) {

        super();

        this.Options = $.extend(this.Options, options);
        this.#time = Date.now();

        this.#callback = callback;
        this.#intervalId = setInterval(this.update.bind(this), periodTime);

        this.#periodTime = periodTime;
        this.#curLeg = 0;
        this.SetRoutes(routes);
        this.ToStart();
    }

    ToStart() {
        this.#routePos = this.#routes[this.#routeIndex].overview_path[0];
        this.#routeDistance = 0;
        this.#curLeg = 0;
        this.#curStep = null;
    }

    SetRoutes(routes) {
        this.#routes = routes;
        this.#lengthList = [];
        this.#totalLength = CalcPathLength(this.#routes, this.#routeIndex, this.#lengthList);
        this.updateSteps(); 

        //При изменении пути почему то не кореектно отображаются шаги, фиксануть!
    }

    forEachSteps(func) {
        for (let r=0; r<this.#routes.length; r++) {
            let legs = this.#routes[r].legs;
            for (let l=0; l<legs.length; l++)
                for (let s=0; s<legs[l].steps.length; s++) {
                    if (func(this.#routes, r, l, s))
                        return;
                }
        }
    }

    updateSteps() {
        let accumDist = 0;

        this.forEachSteps((routes, r, l, s)=>{
            accumDist += routes[r].legs[l].steps[s].distance.value;
            routes[r].legs[l].steps[s].finishDistance = accumDist;
        })
    }

    destroy() {
        clearInterval(this.#intervalId);
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

    #checkCurStep() {

        let lastStep = this.#curStep;
        
        let accumDist = 0;
        this.#curStep = null;
        this.#nextStep = this.#routes[0].legs[0].steps[0];

        this.forEachSteps(((routes, r, l, s)=>{
            let step = routes[r].legs[l].steps[s];
            accumDist += step.distance.value;
            if (accumDist > this.#routeDistance) {
                if (!this.#curStep)
                    this.#curStep = step;
                else {
                    this.#nextStep = step;
                    return true;
                }
            }
            return false;
        }).bind(this));

        if (this.#curStep != lastStep)
            this.SendEvent("CHANGESTEP", this.#curStep);
    }

    #updateRoutePos() {
        if (this.#avgSpeed) {
            this.#routeDistance += this.#avgSpeed * this.#periodTime / 1000;
            this.#calcPoint();
            this.#checkCurStep();
        }
    }

    #calcDistance(inPath) {
        let result = 0;
        for (let i=0; i<inPath.idx; i++)
            result += this.#lengthList[i];
        return result + inPath.distance;
    }

    #calcPoint() {

        let distance = this.#routeDistance;
        let path = this.#routes[this.#routeIndex].overview_path;
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

    #setGeoPos(latLng) {

        if (this.#routes && (this.#routes.length > 0)) {

            let currentTime = Date.now();
            this.#deltaT = (currentTime - this.#time) / 1000;

            let path = this.#routes[this.#routeIndex].overview_path;
            let inPath = {};
            let p = Tracer.CalcPointInPath(path, latLng, inPath, this.Options.magnetDistance);

            if (p) {
                let distance = this.#calcDistance(inPath);
                let deltaDist = distance - this.#routeDistance;

                let speed = (deltaDist / this.#deltaT)
                                .clamp(-this.Options.speedMax, this.Options.speedMax);

                let tearedTime = this.#deltaT > this.Options.tearedTime;
                let tearedDist = Math.abs(deltaDist) > this.Options.tearedDistance;

                if (tearedTime || tearedDist) {
                    this.#routeDistance = distance;
                    this.#routePos = p;

                    if (tearedTime)
                        this.SendEvent('TEAREDTIME', tearedDist);
                    else this.SendEvent('TEAREDDIST', tearedDist);
                        
                    this.#avgSpeed = speed;

                    console.log('Teared path, time: ' + this.#deltaT + ', distance: ' + distance);
                } else {
                    this.#avgSpeed = this.#avgSpeed ? ((this.#avgSpeed + speed) / 2) : speed;
                }
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

}

Tracer.CalcPointInPath = function (path, p, inPath, minDistance = Number.MAX_VALUE) {

    let min = minDistance;
    let result = false;

    for (let i=0; i<path.length - 1; i++) {

        let p1 = path[i];
        let p2 = path[i + 1];
        let angle = Math.abs(CalcAngleRad(p1, p2) - CalcAngleRad(p1, p));
        if (angle < Math.PI / 2) {
            let c = Distance(p1, p);
            let b = Distance(p1, p2);

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
                    inPath.distance = b2;
                    inPath.distanceToLine = h;
                }
            }
        }
    }

    if (!result) {
        let min = minDistance;
        for (let i=0; i<path.length; i++) {
            let h = Distance(path[i], p);
            if (h < min) {
                min = h;
                result = path[i];

                inPath.idx = i;
                inPath.distance = 0;
                inPath.distanceToLine = h;
            }
        }
    }

    return result;
}