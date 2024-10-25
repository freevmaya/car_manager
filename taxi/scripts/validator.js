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
		for (let i in this.#items)
			result = result && this.#items[i].getAllowed();
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
	#allowed = true;
	#model;
	constructor(name, model) {
		this.#elem = $('*[name="' + name + '"]');
		this.#model = model;
	}

	getElem() { return this.#elem; }
	getModel() { return this.#model; }

	setAllowed(value) {
		this.#allowed = value;
		this.parent.refresh();
	}

	getAllowed() {
		return this.#allowed;
	}

	getMessage() {
		return '';
	}
}

class inputValidator extends BaseValidator {
	constructor(name, model) {
		super(name, model);

		this.getElem()
			.on('input', (()=>{ this.setAllowed(false); }).bind(this))
			.on('change', (() => { this.validate(this.afterValidate.bind(this)); }).bind(this));
	}

	afterValidate(a_allowed) {
		this.setAllowed(a_allowed);
		app.ToggleWarning(this.getElem(), !this.getAllowed(), this.getMessage());
	}

	validate(action) {
		action(true);
	}

	getMessage() {
		return toLang('The value cannot be empty.');
	}
}

class requiredValidator extends inputValidator {

	validate(action) {
		action(this.getElem().val().length > 0);
	}
}

class uniqueValidator extends requiredValidator {
	#origin;
	constructor(name, model) {
		super(name, model);
		this.#origin = this.getElem().val();
	}


	validate(action) {
		super.validate(((allowed)=>{
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