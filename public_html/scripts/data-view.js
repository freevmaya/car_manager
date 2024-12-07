class DataView {
    view;
    #data;
    #parent;
    constructor(parent, tmpl, data) {
        this.#data = data;
        this.#parent = parent;

        this.view = $(tmpl[0].outerHTML.replace(/\{(.*?)\}/g, (m, field) => {
            let v;
            let fg = field.match(/([\w\s\d.\-_]+)\([\'\"\w\s\d.\-_]*\)/);
            if (!isEmpty(fg)) {
                eval('v = ' + field);
            } else {
                v = toLang(!isEmpty(data[field]) ? data[field] : '');
                if (typeof(v) == 'object')
                    v = JSON.stringify(v).replaceAll('"', '&quot;');
            }
            return v;
        }));

        this.#parent.append(this.view);
    }

    destroy() {
        this.view.remove();
    }

    fields(items, fields=null, tag="<span>") {
        let result = '';
        if (!fields) fields = Object.keys(items);

        for (let i=0; i<fields.length; i++) {
            let key = fields[i];
            result += $(tag)
                        .text(toLang(key))
                        .addClass('name')[0].outerHTML;
            result += intoTag(items[key]);
        }
        return result;
    }

    getOrderInfo(distanceToStart = false) {
        return DataView.getOrderInfo(this.#data, distanceToStart);
    }
}

DataView.getOrderInfo = (order, distanceToStart = false) => {

    let start = isStr(order.start) ? JSON.parse(order.start) : order.start;
    let finish = isStr(order.finish) ? JSON.parse(order.finish) : order.finish;

    let result = 
            intoTag(toLang("State") + ': <span id="state-' + order.id + '">' + toLang(order.state) + '</span>') + 
            intoTag(PlaceName(start) + " > " + PlaceName(finish)) + 
            intoTag(toLang("User") + ': ' + (order.username ? order.username : (order.first_name + " " + order.last_name))) + 
            intoTag(toLang("Departure time") + ': ' + $.format.date(order.pickUpTime, dateTinyFormat)) + 
            intoTag(toLang("Length") + ": " + round(order.meters / 1000, 1) + toLang("km."));

    if (distanceToStart) {

        let startLatLng = toLatLng(start);
        if (!startLatLng)
            getPlaceDetails(start.placeId, ['location']).then((place)=>{
                startLatLng = toLatLng(place.location);
            });

        let idElem = "distanceToStart-" + order.id;
        result += intoTag(toLang('Distance to start') + ': <span id="' + idElem + '"></span>');

        let geoId = watchPosition((mainLatLng) => {
            if (startLatLng) {
                let elem = $('#' + idElem);
                if (isEmpty(elem))
                    clearWatchPosition(geoId);
                else elem.text(DistanceToStr(Distance(startLatLng, mainLatLng)));
            }
        })
    }

    return result;
}

DataView.Create = (parent, data) => {
    if (data.content_type == 'changeOrder') {
        let order = JSON.parse(data.text);
        let tmpl = $('.templates .' + order.state);
        if (!isEmpty(tmpl)) {
            if (data.content)
                new DataView(parent, tmpl, data.content);
            else {
                Ajax({
                    action: 'getOrder',
                    data: data.content_id
                }).then((result)=>{
                    new DataView(parent, tmpl, data.content = result);
                });
            }
        }
    }
}