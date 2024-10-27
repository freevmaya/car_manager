class Validator {
	#form;
	#submit;
	#items = [];
	checkForm() {
		if (!this.#form) {
			this.#form = $('form');
			this.#form.on('submit', (() => {return this.isSendAllowed();}).bind(this));
			this.#submit = this.#form.find('*[type="submit"]');
		}
	}

	isSendAllowed() {
		let result = true;
		for (let i in this.#items) {
			this.#items[i].refreshFieldMessage();

			if (!this.#items[i].getAllowed()) 
				return false;
		}
		return result;
	}

	add(validator) {
		this.checkForm();
		this.#items.push(validator);
		validator.parent = this;
	}

	refresh() {
		if (this.#submit) {
			if (this.isSendAllowed()) this.#submit.removeAttr('disabled');
			else this.#submit.prop('disabled', true);
		}
	}
}

class BaseValidator {
	parent;
	#elem;
	_allowed = true;
	#model;
	constructor(name, model) {
		this.#elem = $('*[name="' + name + '"]');
		this.#model = model;
	}

	getElem() { return this.#elem; }
	getModel() { return this.#model; }

	setAllowed(value) {
		this._allowed = value;
		this.refreshFieldMessage();
	}

	getAllowed() {
		return this._allowed;
	}

	getMessage() {
		return '';
	}

	refreshFieldMessage() {
		console.log(this.getAllowed());
		app.ToggleWarning(this.getElem(), !this.getAllowed(), this.getMessage());
	}
}

class inputValidator extends BaseValidator {
	constructor(name, model) {
		super(name, model);

		this.getElem()
			.change((() => { this.onChange(this.afterValidate.bind(this)); }).bind(this));
	}

	afterValidate(a_allowed) {
		this.setAllowed(a_allowed);
	}

	onChange(action) {
		action(true);
	}

	getMessage() {
		return toLang('The value cannot be empty.');
	}
}

class requiredValidator extends inputValidator {

	constructor(name, model) {
		super(name, model);
		this._allowed = this.isNotEmpty();
	}

	isNotEmpty() {
		let elem = this.getElem();
		if (elem.attr('type') == 'hidden')
			return elem.val() > 0;

		return elem.val().length > 0;
	}

	onChange(action) {
		let na = this.isNotEmpty();
		let hm = na && !this._allowed;
		action(na);
		if (hm) this.refreshFieldMessage();
	}
}

class uniqueValidator extends requiredValidator {
	#origin;
	constructor(name, model) {
		super(name, model);
		this.#origin = this.getElem().val();
	}


	onChange(action) {
		super.onChange(((allowed)=>{
			if (allowed) {
				if (this.getElem().val() != this.#origin) {
					Ajax({
						action:"checkUnique",
						data: JSON.stringify({
							model: this.getModel(),
							value: this.getElem().val()
						})
					}).then(action.bind(this));
				} else action(allowed);
			} else action(allowed);
		}).bind(this));
	}

	getMessage() {
		return toLang('This value is already taken. Try entering another value.');
	}
}

var validator = new Validator();