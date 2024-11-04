class Tracer {

    #geoPos;
    #routePos;
    #routeDistance;
    #lastPos;
    magnetDistance = 50;  // 50 метров от пути
    #avgSpeed = false;
    #routes;
    #routeIndex = 0;
    #lengthList;
    #totalLength;
    #time;
    #callback;
    #intervalId;

    constructor(routes, callback, refreshPeriodTime) {
        this.#routes = routes;
        this.#time = Date.now();
        this.#callback = callback;
        this.#intervalId = setInterval(this.#update.bind(this), refreshPeriodTime);

        this.#lengthList = [];
        this.#totalLength = CalcPathLength(this.#routes, this.#routeIndex, this.#lengthList);
        this.#routePos = this.#routes[this.#routeIndex].overview_path[0];
        this.#routeDistance = 0;
    }

    destroy() {
        clearInterval(this.#intervalId);
    }

    #update() {
        if (this.#lastPos) {
            if (!this.#routePos.equals(this.#lastPos))
                this.#callback(this.#routePos);
        } else this.#callback(this.#routePos);
        this.#lastPos = this.#routePos;
    }

    #calcPointInPath(path, p, inPath) {

        let min = this.magnetDistance;
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
            let min = this.magnetDistance;
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

    #magnetToPath(latLng) {

        if (this.#routes && (this.#routes.length > 0)) {
            let path = this.#routes[this.#routeIndex].overview_path;
            return this.#calcPointInPath(path, latLng);
        }

        return toLatLng(latLng);
    }

    #calcDistance(inPath) {
        let result = 0;
        for (let i=0; i<inPath.idx; i++)
            result += this.#lengthList[i];
        return result + inPath.distance;
    }

    #calcPoint(distance) {
        let path = this.#routes[this.#routeIndex].overview_path;

        if (distance < this.#totalLength) {
            let d = 0;
            for (let i=0; i<this.#lengthList.length; i++) {
                let l = this.#lengthList[i];

                if (l + d > distance)
                    d += l;
                else {
                    let p1 = path[i];
                    let p2 = path[i + 1];
                    let lk = (distance - d) / l;
                    return new google.maps.LatLng(
                        p1.lat() + (p2.lat() - p1.lat()) * lk,
                        p1.lng() + (p2.lng() - p1.lng()) * lk
                    );
                }
            }
        }
        return path[path.length - 1];
    }

    #setGeoPos(latLng) {

        let currentTime = Date.now();

        if (this.#routes && (this.#routes.length > 0)) {
            let path = this.#routes[this.#routeIndex].overview_path;
            let inPath = {};
            let p = this.#calcPointInPath(path, latLng, inPath);
            if (p) {

                let distance = this.#calcDistance(inPath);

                this.#routePos = this.#calcPoint(distance);

                console.log(distance);

                this.#time = currentTime;
            }
        }
    }

    ReceivePoint(latLng) {
        this.#setGeoPos(latLng);
    }

}