/**
 * The list of available algorithms.
 * Each algorithm must implement the [[Algorithm]] interface
 * and reside in the `algorithms` directory with a file extension
 * of `.ts`
 */

export default [
  {
    label: "Edmonds-Karp",
    filename: "Edmonds-Karp"
  },
  {
    label: "Ford-Fulkerson (depth-first)",
    filename: "Ford–Fulkerson-Depth-First"
  },
  {
    label: "Push-Relabel (generic)",
    filename: "Push-Relabel"
  }
];
