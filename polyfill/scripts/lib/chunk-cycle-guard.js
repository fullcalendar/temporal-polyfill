// Fails the build when emitted chunks statically import each other in a cycle.
//
// Native ESM tolerates cyclic chunks, but loaders that re-export each module
// through lexical bindings (e.g. import-in-the-middle, used by OpenTelemetry)
// evaluate one side of the cycle before the other has initialized, throwing
// `Cannot access '<x>' before initialization` at import time (#107).
//
// Module-level cycles within a single chunk are fine: Rollup flattens and
// orders them. Since chunks are named after source directories, a chunk cycle
// means two directories import each other; fix it by merging or restructuring
// those directories. Dynamic imports are ignored since they're deferred past
// module evaluation.
export function chunkCycleGuard() {
  return {
    name: 'chunk-cycle-guard',
    generateBundle(_outputOptions, bundle) {
      const importsByFileName = new Map()

      for (const fileName in bundle) {
        const chunk = bundle[fileName]
        if (chunk.type === 'chunk') {
          importsByFileName.set(fileName, chunk.imports)
        }
      }

      const cycle = findFirstCycle(importsByFileName)

      if (cycle) {
        this.error('Cyclic chunk imports: ' + cycle.join(' -> '))
      }
    },
  }
}

// Depth-first search returning the first cycle found as a node list whose last
// entry repeats its first, or undefined when the graph is acyclic.
function findFirstCycle(edgesByNode) {
  const finished = new Set()
  const stack = []
  const onStack = new Set()

  function visit(node) {
    if (finished.has(node)) {
      return
    }

    if (onStack.has(node)) {
      return [...stack.slice(stack.indexOf(node)), node]
    }

    stack.push(node)
    onStack.add(node)

    for (const next of edgesByNode.get(node) || []) {
      const cycle = visit(next)
      if (cycle) {
        return cycle
      }
    }

    stack.pop()
    onStack.delete(node)
    finished.add(node)
  }

  for (const node of edgesByNode.keys()) {
    const cycle = visit(node)
    if (cycle) {
      return cycle
    }
  }
}
