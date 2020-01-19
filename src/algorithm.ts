import { Graph, GraphMutation, Node } from "./CytoscapeGraph";

/**
 * The interface each algorithm (from the algorithms directory) has
 * to implement
 */
export interface Algorithm {
  name: string;
  pseudocode: (args: AlgorithmPseudocodeArgs) => string;
  labeledBlocks: { lines: [number, number]; color: string; label: string }[];
  implementation: (graph: Graph) => IterableIterator<AlgorithmStepResult>;
  linearDataStructure: "queue" | "stack" | "none";
}

/**
 * The arguments of the pseudocode function
 */
export interface AlgorithmPseudocodeArgs {
  sourceName: string;
  sinkName: string;
}

/**
 * Each call to the algorithm instance's `next()` method yields an
 * object confoming to this interface
 */
export interface AlgorithmStepResult {
  highlightedLines?: number[];
  linearNodes: Node[];
  graphMutations?: GraphMutation[];
  done?: true;
}
