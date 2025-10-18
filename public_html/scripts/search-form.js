class SearchButton {

	#dialog;
	#element;
	constructor(element) {
		this.#element = $(element);
		this.initialise();
	}

	initialise() {
		this.#element.click(this.onClick.bind(this));
	}

	onClick() {
		if (!this.#dialog)
			this.ShowDialog();
	}

	ShowDialog() {
		this.#dialog = viewManager.Create({
            modal: true,
			title: toLang('Search form'),
			content:  [
				{
					name: 'PlaceName',
					label: "Start typing the name of the place",
					class: PopupInput
				}
			],
			actions: {
				Find: ()=>{

				}
			}
        }, View, (() => {
            this.#dialog = null;
        }).bind(this));
	}
}


$(window).ready(()=>{
	$('.search').each((i, e)=>{
		new SearchButton(e);
	});
});