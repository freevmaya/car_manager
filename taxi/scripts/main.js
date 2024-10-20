
class App {

    #listeners;

    constructor() {
        this.#listeners = {};
    }

    SetUser(user) {
        Ajax({"action":"setUser", "data": JSON.stringify(user)}).then((data) => {
            if (data['asDriver']) {
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

    constructor(element, datetime, mstep = 30) {

        if ($.type(datetime) == 'number') {
            let sstep = mstep * 60 * 1000;
            datetime = Math.ceil(datetime / sstep) * sstep;
            datetime = $.format.date(datetime, dateLongFormat);
        }
        let dta = datetime.split(" ");
        this.view = element;
        this.view.addClass('datetime');

        this.view.empty();
        this.view.append(this.date = $('<input type="text" class="date">'));
        this.view.append(this.time = $('<select class="time">'));

        this.date.datepicker({ defaultDate: new Date(), dateFormat: this.DataFormat });
        this.date.datepicker('setDate', dta[0]);


        let inTime = null;

        if (dta.length > 1)
            inTime = dta[1];

        let timeCount = 24 * 60 / mstep;
        for (let i=0; i < timeCount; i++) {
            let time = this.MinuteToStr(i * mstep);
            let o = $('<option>').text(time);
            this.time.append(o);
            if (time == inTime)
                o.attr('selected', 'true');
        }
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
        return this.getDate() + ' ' + this.getTime();
    }
}

function round(x, p) {
    let k = Math.pow(10, p);
    return Math.round(x * k) / k;
}