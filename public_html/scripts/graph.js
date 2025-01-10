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

		console.log(this.graph);
		console.log(orderedPaths);

		let shortPath = orderedPaths[0][0];

		let result = [];
		for (let i=0; i<shortPath.length; i++)
			result.push(this.points[shortPath[i]]);

		return result;
	}
}

function calcPaths(graph, startIndex = 'a') {
	
	function hasAllChars(line) {
		let result = true;
		Object.keys(graph).forEach((i) => {
			result = result && line.includes(i);
		});
		return result;
	}

	let visited = [];
	let lines = [];

	function passLevel(idx, line = null, distance = 0) {

		if (!line) line = [idx];
		else line.push(idx);

		Object.keys(graph[idx]).forEach((i) => {
			let edge1 = idx + '-' + i;
			let edge2 = i + '-' + idx;
			if (!(visited.includes(edge1) || visited.includes(edge2))) {
				visited.push(edge1);

				let dist = distance + graph[idx][i];
				passLevel(i, Array.from(line), dist);

				if (hasAllChars(line))
					lines.push([line, dist]);

				visited.pop();
			}
		});
	}

	passLevel(startIndex);


	lines.sort((v1, v2)=>{
		return v1[1] - v2[1];
	});
	return lines;
}

/*
let graph = {
  a: { b: 1, c: 1 , d: 2 },
  b: { e: 2 },
  c: { f: 3 },
  d: { g: 4 },
  e: { c: 2.5, d: 3 },
  f: { b: 3.5, d: 6 },
  g: { c: 6, b: 7}
}

let result = calcPaths(graph);
console.log(result);
*/