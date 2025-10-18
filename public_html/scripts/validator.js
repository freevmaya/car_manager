class ValidatorList {
	#form;
	#submit;
	#items = [];
	#checkState = false;
	checkForm() {
		if (!this.#form) {
			this.#form = $('form');
			this.#submit = this.#form.find('*[type="submit"]');
		}
	}

	checkInput(ainput, afterCheck) {
		if (ainput && (ainput.type == 'text')) {
			let idx = this.indexOf(ainput.name);
			if (idx > -1) {
				this.#items[idx].doAfterChange(afterCheck);
				return;
			}
		}
		afterCheck(this.isSendAllowed());
	}

	indexOf(name) {
		for (let i in this.#items)
			if (this.#items[i].name == name)
				return i;
		return -1;
	}

	isSendAllowed(showMessage=true) {
		let result = true;
		for (let i in this.#items) {
			this.#items[i].refreshFieldMessage(showMessage);

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
}

class BaseValidator {
	parent;
	#control;
	_allowed = true;
	#model;

	get name() { return this.#control.name; }
	get control() { return this.#control; }
	getModel() { return this.#model; }

	constructor(control, model = '') {
		if (isStr(control))
			control = formView.fieldById(control);
		
		this.#control = control;
		this.#model = model;
	}

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

	refreshFieldMessage(showWarning = true) {
		app.ToggleWarning(this.control.view, showWarning && !this.getAllowed(), this.getMessage());
	}
}

class inputValidator extends BaseValidator {
	constructor(name, model) {
		super(name, model);

		this.control.change(this.doAfterChange.bind(this));
	}

	doAfterChange(outside = null) {
		this.afterChange(((a_allowed)=>{
			this.afterValidate(a_allowed);
			if (isFunc(outside)) outside(a_allowed);
		}).bind(this));
	}

	afterValidate(a_allowed) {
		this.setAllowed(a_allowed);
	}

	afterChange(action) {
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
		return !isEmpty(this.control.val());
	}

	afterChange(action) {
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
		this.#origin = this.control.val();
	}


	afterChange(action) {
		if (this.isNotEmpty()) {
			if (this.control.val() != this.#origin) {
				Ajax({
					action:"checkUnique",
					data: JSON.stringify({
						model: this.getModel(),
						value: this.control.val()
					})
				}).then(action.bind(this));
			} else super.afterChange(action);
		} else super.afterChange(action);
	}

	getMessage() {
		if (this.isNotEmpty())
			return toLang('This value is already taken. Try entering another value.');
		else return super.getMessage();
	}
}

var validatorList = new ValidatorList();