var dateTinyFormat  = "dd.MM HH:mm";
var dateShortFormat = "dd.MM.yy HH:mm";
var dateLongFormat  = "dd.MM.yyyy HH:mm";
var dateOnlyFormat  = "dd.MM.yyyy";


class EventProvider {
    #incIndex;  
    constructor(periodTime) {
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
            else parent.append(w = $('<div class="warning" style="width: ' + elem.width() + 'px">' + text + '</div>'));
        } else w.Remove();
    }

    showQuestion(text, afterOk) {
        if (this.#question == null) {
            this.#question = viewManager.Create({curtain: $('#map'),
                title: 'Warning!',
                content: [
                    {
                        text: text,
                        class: TextField
                    }
                ],
                actions: {

                    'Ok': (()=>{
                        this.#question.Close();
                        afterOk();
                    }).bind(this),

                    'Cancel': (()=>{
                        this.#question.Close();
                    }).bind(this)
                }
            }, View, (()=>{
                this.#question = null;
            }).bind(this));
        }
    }
}

async function Ajax(params) {
    var formData = new FormData();
    for (let key in params) {
        let data = params[key];
        formData.append(key, (typeof data == 'string') ? data : JSON.stringify(data));
    }

    formData.append('ajax-request-id', ajaxRequestId);

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
    constructor(periodTime) {
        super();
        this.intervalID = setInterval(this.update.bind(this), periodTime);
    }

    update() {
        let params = {action: "checkState", data: null};

        if (user.sendCoordinates || user.requireDrivers) {
            this.enableGeo(true);
        
            let data = {};
            if (user.requireDrivers)
                data.requireDrivers = true;

            if (user.requireDrivers) {
                let mpos = v_map.getMainPosition();
                if (mpos)
                    data = $.extend(data, toLatLng(mpos));
            } else if (this.#getPosition) {
                data = $.extend(data, toLatLng(this.#getPosition));
            }

            params.data = JSON.stringify(data);
            Ajax(params).then(this.onRecive.bind(this));

        } else {
            this.enableGeo(false);
            Ajax($.extend(params)).then(this.onRecive.bind(this));
        }
    }

    getGeoPosition() {
        return this.#getPosition;
    }

    receiveGeo(position) {
        this.#getPosition = position.coords;
    }

    enableGeo(enable) {
        if (enable && !this.#geoId) {
            this.#geoId = navigator.geolocation.watchPosition(this.receiveGeo.bind(this));
        } else if (!enable && this.#geoId > 0) {
            navigator.geolocation.clearWatch(this.#geoId);
            this.#geoId = false;
        }
    }

    #toArray(event) {
        let result = [];
        if (this.listeners.hasOwnProperty(event)) {
        }
    }

    onRecive(value) {
        for (let n in value)
            this.SendEvent(n, value[n]);
    }

    SendStatusNotify(data, a_status = 'receive') {
        Ajax({
            action: 'StateNotification',
            data: { id: data.id, state: a_status }
        });
    }
}

class DateTime {
    DataFormat = 'dd.mm.yy';
    TimyFormat = "dd.MM HH:mm";
    #mstep;
    #datetime;

    constructor(element, datetime, mstep = 30) {

        this.#mstep = mstep;
        this.view = element;
        this.view.addClass('datetime');
        this.view.empty();

        if ($.type(datetime) == 'string')
            datetime = Date.parse(datetime);

        if ($.type(datetime) == 'number') {
            this.#datetime = this.Format(datetime);

            if (this.Format(Date.now()) == this.#datetime) {
                this.view.text(toLang('Now')).click(this.onNowClick.bind(this));
            }
            else InitInputs();
        } else console.log("Unknown datetime format");
    }

    onNowClick() {
        if (!this.date) this.InitInputs();
    }

    InitInputs() {
        let dta = this.#datetime.split(" ");

        this.view.empty();
        this.view.append(this.date = $('<input type="text" class="date">'));
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

    getValue() {
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

function PlaceLatLng(place) {
    return place.latLng ? place.latLng : place;
}

function PlaceName(place) {
    if (place.displayName)
        return place.displayName;
    if (place.latLng)
        return round(place.latLng.lat(), 6) + ", " + round(place.latLng.lng(), 6);
    if (place.lat)
        return round(place.lat(), 6) + ", " + round(place.lng(), 6);
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

function templateClone(tmpl, data) {
    let html = tmpl[0].outerHTML.replace(/\{(.*?)\}/g, (m, group) => {
        if (data[group])
            return data[group];
        return toLang(group);
    });
    return $(html);
}

function PrepareInput() {
    $('input.phone').each((i, item) => {
        $(item).inputmask($(item).data('mask'));
    });
}


function toLatLngF(obj) {
    if ($.type(obj.lat) == 'function')
        return obj;
    
    return {lat: ()=>{return obj.lat;}, lng: ()=>{return obj.lng;}};
}


function toLatLng(obj) {
    if (obj.latitude)
        return {lat:obj.latitude, lng: obj.longitude};
    return {lat:obj.lat, lng: obj.lng};
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
