# Maxflow

This is a web application to interactively visualize algorithms to solve the [maximum flow problem](https://en.wikipedia.org/wiki/Maximum_flow_problem). Currently, three algorithms are implemented: [Edmonds–Karp](https://en.wikipedia.org/wiki/Edmonds%E2%80%93Karp_algorithm), [Ford–Fulkerson (depth-first)](https://en.wikipedia.org/wiki/Ford%E2%80%93Fulkerson_algorithm) and [Push–relabel](https://en.wikipedia.org/wiki/Push%E2%80%93relabel_maximum_flow_algorithm). Each algorithm can be stepped through line-by-line and the resulting effects are visualized in a graph visualization powered by [Cytoscape.js](https://github.com/cytoscape/cytoscape.js). The algorithms are implemented as generators to provide updated visualizations and can thus translate almost line-by-line to the visualized pseudocode.

## How to develop

- make sure you have installed node.js and npm
- run `npm install`
- run `npm start`

## How to build and deploy

- make sure you have installed node.js and npm
- run `npm install`
- run `npm run build`
- host the `build` directory in the root of some HTTP server

## License

This code is licensed under the [MIT License](http://opensource.org/licenses/MIT).
