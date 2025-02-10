<?
html::AddScriptFile('graph.js');
html::AddJsCode("
let graph = {
  0: {},
  1: {},
  2: {},
  3: {},
  4: {},
  5: {},
  6: {}
}

let keys = Object.keys(graph);

for (let i=0; i<keys.length; i++)
	for (let n=0; n<keys.length; n++)
		if (i != n)
			graph[i][n] = Math.random(0.0, 5.0);

let directions = [
	{start: 1, finish: 2},
	{start: 3, finish: 4},
	{start: 5, finish: 6}
]

let result = calcPaths(graph, directions);
console.log(result);
");
?>