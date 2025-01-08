function calcPaths(graph) {
	
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

		if (!line) line = idx;

		Object.keys(graph[idx]).forEach((i) => {
			let edge1 = idx + '-' + i;
			let edge2 = i + '-' + idx;
			if (!(visited.includes(edge1) || visited.includes(edge2))) {
				visited.push(edge1);

				let dist = distance + graph[idx][i];
				passLevel(i, line + i, dist);

				if (hasAllChars(line))
					lines.push([line, dist]);

				visited.pop();
			}
		});
	}

	passLevel('a');


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