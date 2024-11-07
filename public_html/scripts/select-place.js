class SelectPlaceField extends HtmlField {

	setOptions(options) {
        super.setOptions(options);
        this.view.find('.popup-button').click(this.onPopupClick.bind(this));
    }

    onPopupClick() {
    	let map = this.view.find('.map');
    	if (map) map = this.addMapControl();
    }

    addMapControl() {
    	this.view.find('.container').append('<div class="map"></div>');
    }
}