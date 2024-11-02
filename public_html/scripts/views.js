var windowsLayerId = 'windows';

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

ViewManager.setContent = (parent, content, clone = false)=> {

    if (parent.children)
        for (let idx in parent.children)
            parent.children[idx].destroy();
    parent.children = {};

    parent.children = {};
    if ($.type(content) === 'array') {
        for (let i in content) {
            let idx = i;
            if (content[i].id) idx = content[i].id;
            parent.children[idx] = new content[i].class(parent, content[i]);
        }
    } else {
        parent.children[0] = clone ? $(content).clone() : $(content);
        parent.contentElement.append(parent.children[0]);
    }
}

class BaseParentView {

    children;

    constructor() {}

    fieldById(idx) {
        return this.children[idx];
    }
}

class View extends BaseParentView {

    constructor(options = {actions: {}}, afterDestroy = null) {
        super();
        this.afterDestroy = afterDestroy;
        this.initView();
        this.setOptions(options);
    }

    initMainView() {
        this.view = $('<div class="view shadow radius dialog">');
        this.view.append(this.headerElement = $('<div class="header">'));
        this.headerElement.append(this.closeBtn = $('<button class="close button">'));
        
        this.windows = $('#' + windowsLayerId);
        this.windows.append(this.view);

        this.closeBtn.click(this.beforeClose.bind(this));
    }

    beforeClose() {
        this.prepareToClose(this.Close.bind(this));
    }

    prepareToClose(afterPrepare) {
        afterPrepare();
    }

    initView() {
        this.initMainView();

        this.view.append(this.contentElement = $('<div class="content">'));
        this.view.append(this.footerElement = $('<div class="footer btn-block">'));
        $(window).on('resize', this.onResize.bind(this));
    }

    setOptions(options) {
        this.options = $.extend({content: [], actions: []}, options);

        for (let i in this.options.classes)
            this.contentElement.addClass(this.options.classes[i]);

        if (this.options.title) {
            if (!this.titleElement)
                this.headerElement.prepend(this.titleElement = $('<h3></h3>'));
            this.titleElement.text(toLang(this.options.title));
            $('<div class="hr">').insertAfter(this.headerElement);
        } else this.headerElement.addClass('empty');

        let actions = this.options.actions;
        for (let action in actions) {
            let btn = $('<button class="button">');
            btn.text(toLang(action));
            setValues(btn, actions[action]);
            this.footerElement.append(btn);
        }

        ViewManager.setContent(this, this.options.content, this.options.clone);
        
        if (this.options.curtain) this.blockBackground(true);
        
        setTimeout(this.toAlign.bind(this), 10);
        setTimeout(this.checkOverflow.bind(this), 500);
    }

    afterResize() {
        let space = (this.view.outerHeight() - this.view.height()) / 2;
        v_map.View.css('bottom', this.view.outerHeight() - space);
    }

    toAlign() {
        let size = { x: $(window).width(), y: $(window).height() };
        if (!this.options.topAlign) {
            if (this.options.bottomAlign) {
                this.view.removeClass('radius')
                    .addClass('bottom')
                    .addClass('radiusTop');

                this.afterResize();
            }
            //else this.view.css('top', ($(window).height() - this.view.outerHeight(true)) / 2);
        }
    }

    checkOverflow() {
        let elem = this.contentElement[0];
        if (elem.offsetHeight < elem.scrollHeight)
            this.contentElement.css('overflow-y', 'scroll');
        if (elem.offsetWidth < elem.scrollWidth)
            this.contentElement.css('overflow-x', 'scroll');
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

        if (typeof v_map !== 'undefined')
            v_map.View.css('bottom', 0);

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

    setOptions(options) {
        options = $.extend({bottomAlign: true}, options);
        super.setOptions(options);
    }

    Close() {
        v_map.View.css('bottom', 0);
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

class DividerField extends BaseField {
    initView() {
        this.view = createField(this.parentElement, this.options, '<div class="divider">');
    }
}


class TextField extends BaseField {

    initView() {
        this.view = createField(this.parentElement, this.options, '<p>');
    }
}


class TextInfoField extends TextField {

    initView() {
        super.initView();
        this.view.addClass('InfoField');
        this.view.parent().append((this.infoView = $('<span class="infoView">')).text(this.options.info));

        if (this.options.info)
            this.infoView.addClass('showInfo');
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

    children = null;

    initView() {
        this.parentElement.append(this.view = this.contentElement = $('<div class="group">'));
        for (let i in this.options.classes)
            this.view.addClass(this.options.classes[i]);

        ViewManager.setContent(this, this.options.content, this.options.clone);
    }
}


function createButton(parent, caption, action) {
    let result;
    parent.append(result = $('<button class="button radius shadow">'));
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

function setValues(elem, attibutes) {

    if ($.type(attibutes) == 'object') {
        for (let i in attibutes)
            if ($.type(attibutes[i]) == 'function')
                elem.click(attibutes[i]);
            else elem.prop(i, attibutes[i]);
    }
    else if ($.type(attibutes) == 'function') 
        elem.click(attibutes);
}

var viewManager;
$(window).ready(()=>{
    viewManager = new ViewManager();
    if ($('#' + windowsLayerId).length == 0)
        $('body').prepend($('<div id="' + windowsLayerId + '">'));
});