


let graph = {
  a: { b: 1, c: 1 , d: 1 },
  b: { c: 1, e: 2 },
  c: { b: 1, d: 1.5, f: 3 },
  d: { c: 1.5, g: 4 },
  e: { c: 2.5 },
  f: { b: 3.5, d: 6 },
  g: { c: 6},
}


function calcPaths(graph) {

	function passLevel(idx, visited, tree) {

		tree[idx] = {};

		Object.keys(graph[idx]).forEach((i) => {
			let edge1 = idx + '-' + i;
			let edge2 = i + '-' + idx;
			if (!(visited.includes(edge1) || visited.includes(edge2))) {
				visited.push(edge1);
				passLevel(i, visited, tree[idx]);
			}
		});
	}

	let tree = {};
	passLevel('a', [], tree);
	return tree;
}

let result = calcPaths(graph, 'a');
console.log(result);
