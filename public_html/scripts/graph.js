class GraphGenerator {
	graph;
	points;

	constructor(startPoint) {
		this.points = [startPoint];
		this.graph = {
			0: {}
		}
	}

	addVar(name, value, obj = null) {
		if (!obj) obj = {};
		obj[name] = value;
		return obj;
	}

	AddOrders(orders) {

		for (let i=0; i<orders.length; i++)
			this.#addOrder(orders[i]);

		for (let i=2; i<this.points.length; i+=2)
			for (let n=2; n<this.points.length; n+=2) {
				if (n != i)
					this.graph[i] = this.addVar(n - 1, Distance(this.points[i], this.points[n - 1]), this.graph[i]);
		}
	}

	#addOrder(order) {

		let idx1 = this.points.length;
		let idx2 = this.points.length + 1;

		this.points.push($.extend(toLatLng(order.start), {order: order}));
		this.points.push($.extend(toLatLng(order.finish), {order: order}));

		this.graph['0'][idx1] = Distance(this.points[0], this.points[idx1]);
		this.graph[idx1] = this.addVar(idx2, parseInt(order.meters));
	}

	getPath() {
		let orderedPaths = calcPaths(this.graph, '0');

		//console.log(this.graph);
		//console.log(orderedPaths);

		let shortPath = orderedPaths[0][0];

		let result = [];
		for (let i=0; i<shortPath.length; i++)
			result.push(this.points[shortPath[i]]);

		return result;
	}
}

function calcPaths(graph, startIndex = '0') {

	let keys = Object.keys(graph);
	let keys1 = Array.from(keys).splice(1);
	
	function checkChars(line) {

		if (line.length == keys1.length) {
			let midx = -1;
			for (let i=0; i<keys1.length; i++) {
				let k = keys1[i];
				if (!line.includes(k)) 
					return false;

				/*
				if (midx < line[i])
					midx = parseInt(line[i]);
				else return false;
				*/
			};
			return true;
		}

		return false;
	}

	let visited = [];
	let lines = [];

	function passLevel(idx, distance = 0) {

		Object.keys(graph[idx]).forEach((i) => {

			if (!(visited.includes(i))) {
				visited.push(i);

				let dist = distance + graph[idx][i];
				passLevel(i, dist);

				if (checkChars(visited))
					lines.push({distance: dist, list: Array.from(visited)});

				visited.pop();
			}
		});
	}

	passLevel(startIndex);


	lines.sort((v1, v2)=>{
		return v1.distance - v2.distance;
	});
	return lines;
}

let graph = {
  0: { 1: 0.5, 3: 1, 5: 1 },
  1: { 2: 2, 3: 1, 5: 2.5 },
  2: { 3: 3, 4: 1, 6: 2 },
  3: { 4: 4, 1: 1, 5: 2 },
  4: { 1: 2.5, 5: 3, 2: 1, 6: 2 },
  5: { 6: 3.5, 3: 1, 1: 2.1 },
  6: { 1: 6, 3: 7, 4: 1.2, 2: 3.2}
}

let result = calcPaths(graph);
console.log(result);
