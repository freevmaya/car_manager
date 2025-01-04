class Tracer extends EventProvider {

//EVENTS: FINISHPATH, TEAREDTIME, TEAREDDIST, TOOFAR;


    #options = {
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
    #curStepIndex;
    #curLeg;

    get AvgSpeed() { return this.#avgSpeed; };
    get RouteDistance() { return this.#routeDistance; };
    get StartTime() { return this.#options.startTime; };
    get FinishTime() { return this.StartTime + this.TakeTime * this.TotalLength / this.RouteDistance; };
    get TotalLength() { return this.#totalLength; };
    get RemaindDistance() { return this.#totalLength - this.#routeDistance; };
    get RemaindTime() { return this.RemaindDistance / this.AvgSpeed; };
    get Legs() { return this.#routes[this.#routeIndex].legs[this.#curLeg]; };
    get Duration() { return this.Legs.duration; };
    get Step() { return this.correctStepIndex(this.#curStepIndex) > -1 ? this.Legs.steps[this.#curStepIndex] : null; }
    get NextStep() { return this.correctStepIndex(this.#curStepIndex + 1) ? this.Legs.steps[this.#curStepIndex + 1] : null; }
    get StepIndex() { return this.#curStepIndex; }
    get TakeTime() { return Date.now() - this.#options.startTime; }

    constructor(routes, callback, periodTime, options=null) {

        super();

        this.#options = $.extend(this.#options, options);
        this.#routes = routes;
        this.#time = Date.now();

        this.#callback = callback;
        this.#intervalId = setInterval(this.update.bind(this), periodTime);

        this.#periodTime = periodTime;
        this.#lengthList = [];
        this.#totalLength = CalcPathLength(this.#routes, this.#routeIndex, this.#lengthList);
        this.#routePos = this.#routes[this.#routeIndex].overview_path[0];
        this.#routeDistance = 0;
        this.#curLeg = 0;
        this.#curStep = null;

        this.updateSteps();
    }

    correctStepIndex(idx) {
        return (idx > -1) && (idx < this.Legs.steps.length);
    }

    updateSteps() {
        let steps = this.#routes[this.#routeIndex].legs[this.#curLeg].steps;
        let accumDist = 0;

        for (let i=0; i<steps.length; i++) {
            accumDist += steps[i].distance.value;
            steps[i].finishDistance = accumDist;
        }
    }

    #getCurrentStep() {
        let steps = this.#routes[this.#routeIndex].legs[this.#curLeg].steps;
        let accumDist = 0;

        for (let i=0; i<steps.length; i++) {

            accumDist += steps[i].distance.value;
            if (accumDist > this.#routeDistance)
                return i;
        }
        return -1;
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

        let lastStep = this.Step;
        this.#curStepIndex = this.#getCurrentStep();
        if (this.Step != lastStep)
            this.SendEvent("CHANGESTEP", this.Step);
    }

    #updateRoutePos() {
        if (this.#avgSpeed) {
            this.#routeDistance += this.#avgSpeed * this.#periodTime / 1000;
            this.#calcPoint();
            this.#checkCurStep();
        }
    }

    #calcPointInPath(path, p, inPath) {

        let min = this.#options.magnetDistance;
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
                    }
                }
            }
        }

        if (!result) {
            let min = this.#options.magnetDistance;
            for (let i=0; i<path.length; i++) {
                let h = Distance(path[i], p);
                if (h < min) {
                    min = h;
                    result = path[i];

                    inPath.idx = i;
                    inPath.distance = 0;
                }
            }
        }

        return result;
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
            let p = this.#calcPointInPath(path, latLng, inPath);

            if (p) {
                let distance = this.#calcDistance(inPath);
                let deltaDist = distance - this.#routeDistance;

                let speed = (deltaDist / this.#deltaT)
                                .clamp(-this.#options.speedMax, this.#options.speedMax);

                let tearedTime = this.#deltaT > this.#options.tearedTime;
                let tearedDist = Math.abs(deltaDist) > this.#options.tearedDistance;

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
                if (this.#timeTooFar > this.#options.waitTooFar)
                    this.SendEvent('TOOFAR', this.#options.magnetDistance);
                
                console.log('Distance more that ' + this.#options.magnetDistance + 'm');
            }

            this.#time = currentTime;
        }
    }

    ReceivePoint(latLng) {
        this.#setGeoPos(latLng);
    }

}