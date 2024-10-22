var dateTinyFormat = "dd.MM HH:mm";
var dateShortFormat = "dd.MM.yy HH:mm";
var dateLongFormat = "dd.MM.yyyy HH:mm";
var dateOnlyFormat = "dd.MM.yyyy";

class App {

    #listeners;

    constructor() {
        this.#listeners = {};
    }

    SetUser(user) {
        Ajax({"action":"setUser", "data": JSON.stringify(user)}).then((data) => {
            if (data && data['asDriver']) {
                user.asDriver = data['asDriver'];
                ShowDriverMenu();
            }
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
}

async function Ajax(params) {
    var formData = new FormData();
    for (let key in params) {
        let data = params[key];
        formData.append(key, (typeof data == 'string') ? data : JSON.stringify(data));
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
        return place.latLng;
    if (place.lat)
        return round(place.lat(), 6) + ", " + round(place.lng(), 6);
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