var dateTinyFormat  = "dd.MM HH:mm";
var dateShortFormat = "dd.MM.yy HH:mm";
var dateLongFormat  = "dd.MM.yyyy HH:mm";
var dateOnlyFormat  = "dd.MM.yyyy";


var currentPathOptions = {
    preserveViewport: false,
    suppressMarkers: false,
    polylineOptions: {
        strokeColor: 'green'
    }
}

var defaultPathOptions = {
    preserveViewport: true,
    suppressMarkers: true,
    draggable: false,
    polylineOptions: {
        strokeColor: 'rgba(0.6,0.6,0,0.5)'
    }
}

class EventProvider {
    #incIndex;  
    constructor() {
        this.listeners = {};
        this.#incIndex = 0;
    }

    #toArray(event) {
        let result = [];
        if (this.listeners.hasOwnProperty(event)) {
            for (let i in this.listeners[event])
                result.push(this.listeners[event][i]);
            result.sort((item1, item2) => { return item2.priority - item1.priority;});
        }
        return result;
    }

    SendEvent(event, value) {
        let list = this.#toArray(event);
        let stop = false;
        for (let i in list)
            if (!stop)
                list[i].callback({
                    event: event,
                    value: value,
                    StopPropagation: ()=>{
                        stop = true;
                    }
                });
    }

    AddListener(event, callback, priority=0) {
        if (!this.listeners[event]) this.listeners[event] = {};

        this.#incIndex++;
        this.listeners[event][this.#incIndex] = {callback: callback, priority: priority};
        return this.#incIndex;
    }

    RemoveListener(event, idx) {
        if (idx > -1) 
            delete this.listeners[event][idx];
    }

    destroy() {
        delete this.listeners;
    }
}

class App {

    #listeners;
    #question;

    constructor() {
        this.#listeners = {};
    }

    SetUser(user) {
        Ajax({"action":"setUser", "data": JSON.stringify(user)}).then((data) => {
            if (data && data['asDriver'])
                user.asDriver = data['asDriver'];
        });
        $.getScript('scripts/language/' + user.language_code + '.js');
    }

    AddListener(event, action) {
        if (!this.#listeners[event])
            this.#listeners[event] = [];

        this.#listeners[event].push(action);
    }

    RemoveListener(event, action) {
        if (this.#listeners[event])
            this.#listeners[event].remove(action);
    }

    SendEvent(event, params) {
        if (this.#listeners[event]) {
            for (let i=0; i<this.#listeners[event].length; i++)
                this.#listeners[event][i](params);
        }
    }

    ToggleWarning(elem, visible, text) {

        let parent = elem.closest('.field');
        if (parent.length == 0) parent = elem.parent();

        let w = parent.find('.warning');

        if (visible) {
            if (w.length > 0)
                w.text(text);
            else parent.append(w = $('<div class="warning" style="width: ' + (elem.width() - 10) + 'px">' + text + '</div>'));
        } else w.Remove();
    }

    showQuestion(text, afterOk = null) {
        if (this.#question == null) {

            let actions = isFunc(afterOk) ? {
                'Ok': (()=>{
                        this.#question.Close();
                        afterOk();
                    }).bind(this),
                'Cancel': (()=>{
                    this.#question.Close();
                }).bind(this)
            } : {};

            this.#question = viewManager.Create({curtain: $('#map'),
                title: 'Warning!',
                content: [
                    {
                        text: text,
                        class: TextField
                    }
                ],
                actions: actions
            }, View, (()=>{
                this.#question = null;
            }).bind(this));
        }
    }
}

async function Ajax(params) {

    var formData;
    if (getClassName(params) == 'FormData') 
        formData = params
    else {
        formData = new FormData();
        for (let key in params) {
            let data = params[key];
            formData.append(key, (typeof data == 'string') ? data : JSON.stringify(data));
        }

        formData.append('ajax-request-id', ajaxRequestId);
    }

    const request = new Request(BASEURL + "/ajax", {
        method: "POST",
        body: formData
    });
    try {
        const response = await fetch(request);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        //console.error(error.message);
    }
    return null;
}

class AjaxTransport extends EventProvider {

    #geoId;
    #getPosition;
    requireDrivers;
    requestData;
    statusesToReturn;

    constructor(periodTime) {
        super();
        this.intervalID = setInterval(this.update.bind(this), periodTime);
        this.requireDrivers = false;
        this.requestData = {};
        this.statusesToReturn = [];

        if (!isEmpty(jsdata) && !isEmpty(jsdata.notificationList))
            this.onRecive(jsdata.notificationList);
    }

    addRequestData(data) {
        $.extend(this.requestData, data);
    }

    update() {
        
        let data = $.extend({}, this.requestData);
        let params = {action: "checkState"};

        if (!isEmpty(this.statusesToReturn)) {
            data.statusesToReturn = this.statusesToReturn;
            this.statusesToReturn = [];
        }

        if (user.sendCoordinates || this.requireDrivers) {
            this.enableGeo(true);


            if (this.requireDrivers)
                data.requireDrivers = true;

            if (this.requireDrivers) {
                let mpos = v_map.getMainPosition();
                if (mpos) 
                    data = $.extend(data, toLatLng(mpos));
            } else if (this.#getPosition) {
                data = $.extend(data, this.#getPosition);
            }

        } else this.enableGeo(false);

        params.data = JSON.stringify(data);
        Ajax(params).then(this.onRecive.bind(this));
    }

    receiveGeo(position) {
        this.#getPosition = position;
    }

    enableGeo(enable) {
        if (enable && !this.#geoId) {
            this.#geoId = watchPosition(this.receiveGeo.bind(this));
        } else if (!enable && this.#geoId > 0) {
            clearWatchPosition(this.#geoId);
            this.#geoId = false;
        }
    }

    #toArray(event) {
        let result = [];
        if (this.listeners.hasOwnProperty(event)) {
        }
    }

    onRecive(value) {
        this.requestData = {};
        for (let n in value)
            this.SendEvent(n, value[n]);
    }

    SendStatusNotify(data, a_status = 'receive') {
        this.statusesToReturn.push({ id: typeof(data) == 'object' ? data.id : data, state: a_status });
        /*
        Ajax({
            action: 'StateNotification',
            data: { id: typeof(data) == 'object' ? data.id : data, state: a_status }
        });
        */
    }

    Reply(notifyId, data) {
        Ajax({
            action: 'Reply',
            data: $.extend({ id: notifyId }, data)
        });
    }
}

class DateTime {
    DataFormat = 'dd.mm.yy';
    TimyFormat = "dd.MM HH:mm";
    #options;
    #mstep;
    #datetime;

    constructor(element, options=null) {

        this.#options = $.extend({name: 'DateTime', step: 30, value: null}, options);

        this.#mstep = this.#options.step;
        this.view = element;
        this.view.addClass('datetime');
        this.view.empty();

        let val = this.#options.value;

        if ($.type(val) == 'string')
            val = Date.parse(val);
        else if (isEmpty(val))
            val = Date.now();

        if ($.type(val) == 'number') {
            this.#datetime = this.Format(val);

            if (this.Format(Date.now()) == this.#datetime) {
                this.view.text(toLang('Now')).click(this.onNowClick.bind(this));
            }
            else this.InitInputs();
        } else console.log("Unknown val format");
    }

    onNowClick() {
        if (!this.date && !this.#options.readonly) this.InitInputs();
    }

    InitInputs() {
        let dta = this.#datetime.split(" ");

        this.view.empty();
        this.view.append(this.date = $('<input type="text" class="date">'));

        this.date.attr('name', this.#options.name);
        this.date.data('control', this);
        if (this.#options.readonly)
            this.date.val(this.#datetime).prop('readonly', true);
        else {
            this.view.append(this.time = $('<select class="time">'));
            this.date.datepicker({ defaultDate: new Date(), dateFormat: this.DataFormat });
            this.date.datepicker('setDate', dta[0]);

            let inTime = null;

            if (dta.length > 1)
                inTime = dta[1];

            let timeCount = 24 * 60 / this.#mstep;
            for (let i=0; i < timeCount; i++) {
                let time = this.MinuteToStr(i * this.#mstep);
                let o = $('<option>').text(time);
                this.time.append(o);
                if (time == inTime)
                    o.attr('selected', 'true');
            }
        } 
    }

    Format(millisec) {
        let sstep = this.#mstep * 60 * 1000;
        let datetime = Math.ceil(millisec / sstep) * sstep;
        return $.format.date(datetime, dateLongFormat);
    }

    MinuteToStr(m) {
        m = m % (24 * 60);
        let h = Math.floor(m / 60).toString();
        return h.padStart(2, '0')  + ':' + (m % 60).toString().padStart(2, '0');
    }

    getTime() {
        return this.time.find('option:selected').text();
    }

    getDate() {
        return $.format.date(this.date.datepicker('getDate'), dateOnlyFormat);
    }

    val() {
        if (this.date)
            return this.getDate() + ' ' + this.getTime();
        else return this.#datetime;
    }
}

function round(x, p) {
    let k = Math.pow(10, p);
    return Math.round(x * k) / k;
}

function pow(v) {
    return v * v;
}


function toLang(v) {
    return !lang[v] ? v : lang[v];
}

function toPlace(place) {
    if (isStr(place))
        place = JSON.parse(place);
    return place;
}

function PlaceLatLng(place) {
    place = toPlace(place);
    return place.latLng ? place.latLng : place;
}

function latLngToString(latLng) {
    latLng = toLatLng(latLng);
    if (latLng.lat)
        return round(latLng.lat, 6) + ", " + round(latLng.lng, 6);
    return latLng;
}

function PlaceName(place) {

    if (place) {
        place = toPlace(place);

        if (place.displayName)
            return place.displayName;
        if (place.latLng)
            return latLngToString(place.latLng);
        
        return latLngToString(place);
    }
    return null;
}

function PlaceId(place) {
    if (place) 
        return isStr(place) ? place : (place.id ? place.id : 
                (place.placeId ? place.placeId : place));
    
    return null;
}

function PlaceToDBFormat(val) {
    return Extend({placeId: PlaceId(val), latLng: val.location}, val, ['displayName', 'formattedAddress']);
}

JSON.vparse = function(v) {
    if (isStr(v))
        return JSON.parse(v);
    return v;
}

JSON.parsePlace = function(placeStr) {
    let result = JSON.parse(placeStr);
    let lat = result.lat;
    let lng = result.lng;
    result.lat = ()=>{return lat;};
    result.lng = ()=>{return lng;};
    result.latLng = { lat: lat, lng: lng};
    return result;
}

function cnvDbOrder(dbOrder) {
    let result = dbOrder;
    result.startPlace = JSON.parsePlace(dbOrder.startPlace);
    result.finishPlace = JSON.parsePlace(dbOrder.finishPlace);
    
    result.startPlace.displayName = dbOrder.startName;
    result.finishPlace.displayName = dbOrder.finishName;

    result.startPlace.formattedAddress = dbOrder.startAddress;
    result.finishPlace.formattedAddress = dbOrder.finishAddress;
    return result;
}

function PlaceAddress(place) {
    return place.formattedAddress ? place.formattedAddress : null;
}

function Classes(bases) {
    class Bases {
        constructor() {
            bases.forEach(base => Object.assign(this, new base()));
        }
    }
    bases.forEach(base => {
        Object.getOwnPropertyNames(base.prototype)
        .filter(prop => prop != 'constructor')
        .forEach(prop => Bases.prototype[prop] = base.prototype[prop])
    })
    return Bases;
}

function closeView(view, duration='slow') {
    view.css('scale', 1);
    view.animate({
        scale: '-=1',
        opacity: '0',
        width: '-=50%'
    }, duration, 
        ()=>{
            view.remove();
        }
    );
}

function getTemplate(parent, selector, defTag = '<div>') {
    let result = parent ? parent.find(selector) : $(selector);
    if (isEmpty(result))
        result = $(defTag);
    return result;
}

function renderList(nameData, toContainer = null) {

    let list = jsdata[nameData];
    let tmplList = getTemplate(null, '.templates .' + nameData).clone();
    let itemSrc = getTemplate(tmplList, '.item');
    let itemTmpl = itemSrc.clone();
    itemSrc.remove();

    if (isEmpty(list))
        console.log("Not found template or data " + nameData);
    else {
        for (let i in list) {
            tmplList.append(templateClone(itemTmpl, list[i]));
        }

        if (toContainer) {
            toContainer.empty();
            toContainer.append(tmplList);
        }
    }
    return tmplList;
}

function templateClone(tmpl, data) {
    
    let html = (isStr(tmpl) ? $(tmpl) : tmpl)[0].outerHTML.replace(/\{(.*?)\}/g, (m, field) => {
        let v;
        let fg = field.match(/([\w\s\d\[\]'.\-_]+)\([\'\"\w\s\d\[\]',.\-_]*\)/);
        if (!isEmpty(fg)) {
            eval('v = ' + field);
        } else {
            v = toLang(!isEmpty(data[field]) ? data[field] : '');
            if (typeof(v) == 'object')
                v = JSON.stringify(v).replaceAll('"', '&quot;');
        }
        return v;
    });
    return $(html);
}

function isFunc(f) {
    return $.type(f) == 'function';
}

function isStr(s) {
    return $.type(s) == 'string';
}

function isEmpty(v) {
    return (typeof(v) === 'undefined') || (v == null) || (v.length == 0);
}

function PrepareInput() {
    $('input.phone').each((i, item) => {
        $(item).inputmask($(item).data('mask'));
    });
}


function toLatLngF(obj) {
    if (isFunc(obj.lat))
        return obj;
    
    let r = toLatLng(obj);

    if (google.maps.LatLng)
        return new google.maps.LatLng(r.lat, r.lng);

    return {lat: ()=>{return r.lat;}, lng: ()=>{return r.lng;}};
}


function toLatLng(obj) {
    if (obj) {
        if (typeof obj == 'string') {
            let v = obj.split(/[\s,]+/);
            return ((v.length > 1) && $.isNumeric(v[0]) && $.isNumeric(v[1])) ? {lat: v[0], lng: v[1]} : null;
        }

        if (obj.latitude)
            return {lat:obj.latitude, lng: obj.longitude};

        if (isFunc(obj.lat))
            return {lat:obj.lat(), lng: obj.lng()};
            
        return {lat: Number(obj.lat), lng: Number(obj.lng)};
    }
    return null;
}

var EARTHRADIUS = 6378.137; // Radius of earth in KM

function Lepr(p1, p2, t) {
    return {
        lat: p1.lat() * (1 - t) + p2.lat() * t,
        lng: p1.lng() * (1 - t) + p2.lng() * t
    }
}

function CalcAngleRad(p1, p2) {
    return Math.atan2(p2.lng() - p1.lng(), (p2.lat() - p1.lat()) * 1.5);
}

function CalcAngle(p1, p2) {
    return CalcAngleRad(p1, p2) / Math.PI * 180;
}

function LatLngMul(p, f) {
    return new google.maps.LatLng(
        Lat(p) * f,
        Lng(p) * f
    );
}

function LatLngAdd(p1, p2) {
    return new google.maps.LatLng(
        Lat(p1) + Lat(p2),
        Lng(p1) + Lng(p2)
    );
}

function LatLngSub(p1, p2) {
    return new google.maps.LatLng(
        Lat(p1) - Lat(p2),
        Lng(p1) - Lng(p2)
    );
}

function LatLngLepr(p1, p2, f) {
    let lat1 = Lat(p1);
    let lng1 = Lng(p1);
    let lat2 = Lat(p2);
    let lng2 = Lng(p2);
    return new google.maps.LatLng(lat1 * f + lat2 * (1 - f), lng1 * f + lng2 * (1 - f));
}

function LatLngNormal(p) {
    let lat = Lat(p);
    let lng = Lng(p);
    let len = Math.sqrt(lat * lat, lng * lng);
    return new google.maps.LatLng(lat / len, lng / len);
}

function Lat(p) {
    return isFunc(p.lat) ? p.lat() : p.lat;
}

function Lng(p) {
    return isFunc(p.lng) ? p.lng() : p.lng;
}

function Distance(p1, p2) {  // generally used geo measurement function

    let lat1 = Lat(p1);
    let lng1 = Lng(p1);
    let lat2 = Lat(p2);
    let lng2 = Lng(p2);

    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lng2 * Math.PI / 180 - lng1 * Math.PI / 180;

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = EARTHRADIUS * c;

    return d * 1000; // meters
}

function DistanceToStr(v) {
    if (v > 1000)
        return round(v / 1000, 1) + toLang('km.');
    return round(v, 0) + toLang('m.');
}

function CalcCoordinate(center, angle, distanceMeters) {
    let rad = angle * Math.PI / 180;
    let degDistance = distanceMeters / (EARTHRADIUS * 1000) * 180;
    return {
        lat: center.lat() + Math.sin(rad) * degDistance,
        lng: center.lng() + Math.cos(rad) * degDistance
    }
}

function CalcPathLength(routeData, routeIndex = 0, outList=null) {
    let route = routeData.routes ? routeData.routes[routeIndex].overview_path : routeData[routeIndex].overview_path;
    let totalLength = 0;
    for (let i=0; i < route.length - 1; i++) {
        let d = Distance(route[i], route[i + 1]);
        if (outList) outList.push(d);
        totalLength += d; 
    }
    return totalLength;
}

function HideDriverMenu() {
    $('#DriverMenu').remove();
}

function intoTag(value, tag = '<span>') {
    return $(tag).html(value)[0].outerHTML;
}

function getOrderInfo(order, callback = null) {
    let start = isStr(order.start) ? JSON.parse(order.start) : order.start;
    let finish = isStr(order.finish) ? JSON.parse(order.finish) : order.finish;
    let result = PlaceName(start) + " > " + PlaceName(finish) + '. ' +
            toLang("User") + ': ' + (order.username ? order.username : (order.first_name + " " + order.last_name)) + ". " + 
            toLang("Departure time") + ': ' + $.format.date(order.pickUpTime, dateTinyFormat) + ". " + 
            toLang("Length") + ": " + round(order.meters / 1000, 1) + toLang("km.");

    if (callback) {
        if (start.lat) {
            result += ' ' + toLang('Distance to start') + ": " + DistanceToStr(Distance(start, user));
            callback(result);
        } else {
            getPlaceDetails(start.placeId, ['location']);
        }
    }

    return result
}

function ShowDriverMenu() {
    let menu = $('#DriverMenu');
    if (menu.length == 0) {
        let btn;
        $('body').append(menu = $('<div id="DriverMenu" class="radius shadow">'));
        menu.append(btn = $('<a>'));
        btn.click(() => {window.ShowDriverSubmenu();});
        afterMap(() => {v_map.MarkerManager.ShowOrders();});
    }

    menu.css('display', 'block');
}

function afterMap(action) {
    const intervalId = setInterval(() => {
        if (v_map.map) {
          clearInterval(intervalId);
          action();
        }
    }, 100);
}

function getRoutePoint(routes, idx=0, routeIndex=0) {
    if (idx < 0)
        idx = routes.routes[routeIndex].overview_path.length + idx;

    return routes.routes[routeIndex].overview_path[idx];
}

function DrawPath(map, routeData, options = null) {

    options = $.extend({}, defaultPathOptions, options);

    var directionsRenderer = new google.maps.DirectionsRenderer(options);
    directionsRenderer.setMap(map);
    directionsRenderer.setDirections(routeData);
    return directionsRenderer;
}

function StopPropagation(e) {
    e.stop();
    e.cancelBubble = true;
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.preventDefault) {
        e.preventDefault(); 
    } else {
        e.returnValue = false;  
    }
    return false;
}

function Extend(dest, src, fields=null) {
    if (!fields) fields = Object.keys(src);
    for (let i=0; i<fields.length; i++)
        if (src[fields[i]])
            dest[fields[i]] = src[fields[i]];

    return dest;
}

function Wait(checFunc) {
  return new Promise((resolve) => {
    let iid = setInterval(() => {
        if (checFunc()) {
            clearInterval(iid);
            resolve();
        }
    }, 50);
  });
}

function ToRouteData(db_routes, travelMode) {
    if (!isEmpty(db_routes)) {
        if (isStr(db_routes))
            db_routes = JSON.parse(db_routes);

        for (let i=0; i<db_routes.length; i++)
            db_routes[i] = new google.maps.LatLng(db_routes[i].lat, db_routes[i].lng);

        return {
            travelMode: travelMode,
            routes: [{
                overview_path: db_routes
            }]
        }
    }
    return null;
}

function GetOverviewPath(routes) {
    let result = [];
    for (let i in routes.routes)
        result = result.concat(routes.routes[i].overview_path);
    return result;
}

function GetPath(routes, startPlace, finishPlace) {

    function addPlaceId(obj, place) {
        let id = PlaceId(place);
        if (isStr(id))
            obj = $.extend(obj, {placeId: id});
        else if (place.latLng) obj = toLatLng(place.latLng);

        return obj;
    }

    function placeExt(place) {
        return Extend(addPlaceId(toLatLng(getRoutePoint(routes, 0)), place), place, ['displayName', 'formattedAddress']);
    }

    if (routes) {

        return {
                start: placeExt(startPlace),
                finish: placeExt(finishPlace),
                meters: Math.round(CalcPathLength(routes)),
                travelMode: travelMode,
                routes: GetOverviewPath(routes)
            };
    } return null;
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

function getClassName(obj) { 
   var funcNameRegex = /function (.{1,})\(/;
   var results = (funcNameRegex).exec((obj).constructor.toString());
   return (results && results.length > 1) ? results[1] : "";
};

function checkCondition(checkFunc, action, data=null) {
    if (checkFunc()) action(data);
    else setTimeout(()=>{
        checkCondition(checkFunc, action, data);
    }, 50);
}

$(window).ready(()=>{
    PrepareInput();
});

(function( $ ){
    $.fn.Remove = function() {
        this.addClass('hide');
        setTimeout(this.remove.bind(this), 400);
    }; 
})( jQuery );
