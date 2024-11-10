class SelectPlaceField extends HtmlField {

    #sendChange() {
        for (let i in this.listeners)
            this.listeners[i]();
    }

    val() {
        if (arguments.length == 0)
            return this.view.data('place');
        else {
            this.view.data('place', arguments[0]);
            this.#sendChange();
        }
    }

    change(listener) {
        this.listeners.push(listener);
    }
}