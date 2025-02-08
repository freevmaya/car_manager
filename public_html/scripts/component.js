class Component {

	get(name) {
		return this[name];
	}

	set(name, component) {
		this[name] = component;
	}

	add(objOrName, ...params) {
		let name = isStr(objOrName) ? objOrName : objOrName.constructor.name;
		if (!this[name]) {

			if (isStr(objOrName))
				this[name] = eval('new ' + objOrName + '(...params);')
			else this[name] = objOrName;

			this[name].parent = this;
		}
		return this[name];
	}

	remove(name) {
		delete this[name];
	}
}