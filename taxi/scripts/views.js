
class ViewManager {
    openedViews = {};

    Create(options, classView = View, afterDestroy = null) {
        let idx = options.name ? options.name : JSON.stringify(options.content);
        if (!this.openedViews[idx])
        //if (!this.CurrentView())
            return this.openedViews[idx] = new classView(options, ()=>{
                if (afterDestroy) afterDestroy();
                delete this.openedViews[idx];
            });
    }

    CurrentView() {
        for (let i in this.openedViews)
            return this.openedViews[i];
        return null;
    }
}

class View {

    #children;

    constructor(options = {actions: {}}, afterDestroy = null) {
        this.afterDestroy = afterDestroy;
        this.#children = {};
        this.initView();
        this.setOptions(options);
    }

    initMainView() {
        this.view = $('<div class="view shadow radius dialog">');
        this.view.append(this.headerElement = $('<div class="title">'));
        this.headerElement.append(this.closeBtn = $('<button class="close button">'));
        this.closeBtn.click(this.Close.bind(this));
    }

    initView() {
        this.initMainView();

        this.view.append(this.contentElement = $('<div class="content">'));
        this.view.append(this.footerElement = $('<div class="footer btn-block">'));
        this.windows = $('#windows');
        this.windows.append(this.view);
        $(window).on('resize', this.onResize.bind(this));
    }

    setOptions(options) {
        this.options = $.extend({content: [], actions: []}, options);

        if (this.options.title) {
            if (!this.titleElement)
                this.headerElement.prepend(this.titleElement = $('<h3></h3>'));
            this.titleElement.text(toLang(this.options.title));
        }

        for (let action in this.options.actions) {
            let btn = $('<button class="button">');
            btn.text(toLang(action));
            btn.click(this.options.actions[action]);
            this.footerElement.append(btn);
        }

        for (let i in this.options.content) {
            let idx = i;
            if (this.options.content[i].id) idx = this.options.content[i].id;

            this.#children[idx] = new this.options.content[i].class(this, this.options.content[i]);
        }
        
        if (this.options.curtain) this.blockBackground(true);
        this.toAlign();
    }

    fieldById(idx) {
        return this.#children[idx];
    }

    toAlign() {
        if (!this.options.topAlign) {
            if (this.options.bottomAlign)
                this.view.css('bottom', 0);
            else this.view.css('top', ($(window).height() - this.view.outerHeight(true)) / 2);
        }
    }

    onResize() {
        this.toAlign();
    }

    destroy() {
        this.view.remove();
        $(window).off('resize', this.onResize.bind(this));
        this.afterDestroy();
        delete this;
    }

    Close() {

        if (this.options.curtain) this.blockBackground(false);
        this.view.addClass("hide");

        return new Promise(((resolveOuter) => {
            setTimeout((()=>{
                this.destroy();
                resolveOuter();
            }).bind(this), 500);
        }).bind(this));
    }

    blockBackground(value) {
        if (value) this.options.curtain.addClass('curtain');
        else this.options.curtain.removeClass('curtain');
    }
}

class BottomView extends View {

    initMainView() {
        this.view = $('<div class="view shadow radiusTop">');

        this.view.append(this.headerElement = $('<div class="title">'));
        this.headerElement.append(this.closeBtn = $('<button class="close button">'));
        this.closeBtn.click(this.Close.bind(this));

        setTimeout(this.afterResize.bind(this), 500);
    }

    setOptions(options) {
        options = $.extend({bottomAlign: true}, options);
        super.setOptions(options);
    }

    afterResize() {
        let space = (this.view.outerHeight() - this.view.height()) / 2;
        v_map.View.css('bottom', this.view.outerHeight() - space);
    }

    Close() {
        v_map.View.css('bottom', 0);
        return super.Close();
    }
}

class ViewTarget extends BottomView {

    routes;

    setOptions(options) {
        options = $.extend({
            content: [
                {
                    id: 'time',
                    value: Date.now(),
                    class: DateTimeField
                },
                {
                    id: 'startPlace',
                    text: PlaceToText(options.startPlace),
                    class: TextField
                },
                {
                    id: 'finishPlace',
                    text: "",
                    class: TextField
                },
                {
                    label: 'Ok',
                    action: this.applyPath.bind(this),
                    class: ButtonField
                }
            ]
        }, options);

        super.setOptions(options);

    }

    SelectPlace(finishPlace) {
        this.closePath();
        let request = {
            origin: PlaceLatLng(this.options.startPlace),
            destination: PlaceLatLng(this.options.finishPlace = finishPlace),
            travelMode: 'DRIVING'
        }
        v_map.directionsService.route(request, (function(result, status) {
            if (status == 'OK') {
                let field = this.fieldById("finishPlace");
                this.rpath = DrawPath(v_map.map, result);
                field.view.text(PlaceToText(this.options.finishPlace));
                this.routes = result;
                this.afterResize();
            }
        }).bind(this))
    }

    applyPath() {

        let data = {
            user_id: user.id,
            pickUpTime: this.fieldById('time').getValue()
        }

        let start = getRoutePoint(this.routes, 0);
        let finish = getRoutePoint(this.routes, -1);

        data.start = { placeId: this.options.startPlace.placeId, lat: start.lat(), lng: start.lng() };
        data.finish = { placeId: this.options.finishPlace.placeId, lat: finish.lat(), lng: finish.lng() };
        data.startAddress = PlaceAddress(this.options.startPlace);
        data.finishAddress = PlaceAddress(this.options.finishPlace);
        data.meters = Math.round(CalcPathLength(this.routes));

        Ajax({
            action: "AddOrder",
            data: JSON.stringify(data)
        }).then((result) => {
            this.Close();
        });
    }

    closePath() {
        if (this.rpath) {
            this.rpath.setMap(null);
            delete this.rpath;
        }
    }

    Close() {
        this.closePath();
        return super.Close();
    }
}

class BaseField {
    constructor(parent, params) {
        this.options = $.extend({}, params);
        this.parentElement = parent.contentElement;
        this.parent = parent;
        this.initView();
    }

    getView() {
        let result = this.parent;
        while (result.parent) {result = result.parent; };
        return result;
    }

    initView() {
    }
}


class TextField extends BaseField {

    initView() {
        this.view = createField(this.parentElement, this.options, '<p>');
    }
}

class DateTimeField extends BaseField {

    initView() {
        this.view = createField(this.parentElement, this.options, '<div>');
        this.component = new DateTime(this.view, this.options.value);
    }

    getValue() {
        return this.component.getValue();
    }
}


class FormField extends BaseField {
    initView() {
        this.view = createField(this.parentElement, this.options, '<input type="text"/>');
    }
}

class ButtonField extends BaseField {
    initView() {
        this.view = createButton(this.parentElement, this.options.label, (()=>{
            this.getView().Close().then(this.options.action());
        }).bind(this));
    }
}


class GroupFields extends BaseField {

    initView() {
        this.parentElement.append(this.view = $('<div class="group">'));
        for (let i in this.options.classes)
            this.view.addClass(this.options.classes[i]);

        for (let i in this.options.content)
            new this.options.content[i].class(this, this.options.content[i]);
    }
}


function toLang(v) {
    return !lang[v] ? v : lang[v];
}

function PlaceLatLng(place) {
    return place.latLng ? place.latLng : place;
}

function PlaceToText(place) {
    if (place.formattedAddress)
        return place.formattedAddress;
    if (place.latLng)
        return place.latLng;
    if (place.lat)
        return round(place.lat(), 6) + ", " + round(place.lng(), 6);
}

function PlaceAddress(place) {
    return place.formattedAddress ? place.formattedAddress : null;
}


function createButton(parent, caption, action) {
    let result;
    parent.append(result = $('<button class="button">'));
    result.text(toLang(caption));
    result.click(action);
    return result;
}

function createField(parent, fieldParam, tag) {
    let container;
    let element;
    let label;

    parent.append(container = $('<div class="field">'));

    if (fieldParam.id)
        container.attr("data-id", fieldParam.id);

    if (fieldParam.label) {
        label = container.append($('<label class="title">')
                .text(toLang(fieldParam.label)));
        if (fieldParam.name)
            label.attr("for", fieldParam.name);
    }
    container.append(element = $(tag));

    if (fieldParam.name)
        element.attr("name", fieldParam.name);

    if (fieldParam.text)
        element.text(toLang(fieldParam.text));

    if (fieldParam.value)
        element.text(toLang(fieldParam.value));

    return element;
}