class Component {

	get(name) {
		return this[name];
	}

	set(name, component) {
		this[name] = component;
	}

	add(objOrName, ...params) {
		let name = isStr(objOrName) ? objOrName : objOrName.constructor.name;
		if (!this.has(name)) {

			if (isStr(objOrName))
				this[name] = eval('new ' + objOrName + '(...params);')
			else this[name] = objOrName;

			this[name].parent = this;
		}
		return this[name];
	}

	has(name) {
		return typeof(this[name]) != 'undefined';
	}

	remove(name) {
		if (this.has(name)) {
			this[name].destroy();
			delete this[name];
		}
	}

	destroy() {
		delete this.parent[this.constructor.name];
	}

	extends(base, ...params) {
		Object.assign(this, new base(params));
	}
}

Object.prototype.extend = function(base) {
	Object.getOwnPropertyNames(base.prototype)
    .filter(prop => prop != 'constructor')
    .forEach(prop => { if (!this.hasOwnProperty(prop)) this[prop] = base.prototype[prop]; })
}