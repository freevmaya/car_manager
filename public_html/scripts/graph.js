class GraphGenerator {
	graph;
	points;
	directions;

	constructor(startPoint) {
		this.points = [startPoint];
		this.graph = {
			0: {}
		}
		this.directions = [];
	}

	addVar(name, value, obj = null) {
		if (!obj) obj = {};
		obj[name] = value;
		return obj;
	}

	AddOrders(orders) {

		for (let i=0; i<orders.length; i++)
			this.#addOrder(orders[i]);

		for (let i=1; i<this.points.length; i+=2)
			for (let n=1; n<this.points.length; n+=2)
				if (n != i) {
					this.graph[i] = this.addVar(n, Distance(this.points[i], this.points[n]), this.graph[i]);
					this.graph[i + 1] = this.addVar(n, Distance(this.points[i + 1], this.points[n]), this.graph[i + 1]);
					this.graph[n + 1] = this.addVar(i + 1, Distance(this.points[n + 1], this.points[i + 1]), this.graph[n + 1]);
				}
	}

	#addOrder(order) {

		let idx1 = this.points.length;
		let idx2 = this.points.length + 1;

		this.points.push($.extend(toLatLng(order.start), {order: order}));
		this.points.push($.extend(toLatLng(order.finish), {order: order}));

		this.graph['0'][idx1] = Distance(this.points[0], this.points[idx1]);
		this.graph[idx1] = this.addVar(idx2, parseInt(order.meters));
		this.graph[idx2] = {};

		this.directions.push([idx1, idx2]);
	}

	getPath() {
	
		let result = [];
		let orderedPaths = calcPaths(this.graph, this.directions);

		if (orderedPaths.length > 0) {
			let shortPath = orderedPaths[0].route;
			for (let i=0; i<shortPath.length; i++)
				result.push(this.points[shortPath[i]]);
		} else console.error("No routes available");

		return result;
	}
}

function calcPaths(graph, directions = null, nearest = true) {

	let keys = Object.keys(graph);

	function calculateLength(line) {
		let result = 0;
		for (let i=0; i<line.length - 1; i++)
			result += graph[line[i]][line[i + 1]];

		return result;
	}
	
	function checkChars(line) {

		if (line.length == keys.length) {
			let midx = -1;
			for (let i=0; i<keys.length; i++) {
				let k = keys[i];
				if (!line.includes(k)) 
					return false;
			};

			if (directions)
				for (let i=0; i<directions.length; i++) {
					if (line.indexOf(directions[i].start.toString()) > line.indexOf(directions[i].finish.toString()))
						return false;
				}
			return true;
		}

		return false;
	}

	function calcTakeTime(route) {
		let takeTime = [];
		for (let i=0; i<directions.length; i++) {
			let idx1 = route.indexOf(directions[i].start.toString());
			let idx2 = route.indexOf(directions[i].finish.toString());

			let dist = 0;
			for (let n=idx1; n<idx2; n++) {
				dist += graph[route[n]][route[n + 1]];
			}

			takeTime.push(dist);
		}
		return takeTime;
	}

	function processLine(line) {
		if (checkChars(line)) {
			let route = Array.from(line);
			let takeTime = calcTakeTime(route);
			lines.push({
				distance: calculateLength(route), 
				route: route, 
				takeTime: takeTime, 
				totalTime: takeTime.reduce((a, b) => a + b, 0)
			});
		}
	}

	let visited = [];
	let lines = [];

	function passLevel(idx) {

		if (!(visited.includes(idx))) {
			visited.push(idx);
			if (graph[idx]) {
				let lkeys = Object.keys(graph[idx]);
				if (lkeys.length == 0)
						processLine(visited);
				else lkeys.forEach((i) => {
						passLevel(i);
						processLine(visited);
				});
			}

			visited.pop();
		}
	}

	passLevel('0');

	if (nearest)
		lines.sort((v1, v2)=>{
			return v1.distance - v2.distance;
		});
	else lines.sort((v1, v2)=>{
			return v1.totalTime - v2.totalTime;
		});

	return lines;
}
