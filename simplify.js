'use strict'

module.exports = simplify

const simplifyDAG = require('simplify-dag')
const φ = new Set()

function simplify(edges) {
  const vertices = new Set()
  const incoming = new Map()
  const outgoing = new Map()
  const accessors = {
    getFrom: function(edge) {
      return edge.from
    },
    getTo: function(edge) {
      return edge.to
    },
    setFrom: function(edge, from) {
      if (!from) console.trace(edge)
      edge.from = from
    },
    setTo: function(edge, to) {
      if (!to) console.trace(edge)
      edge.to = to
    },
    copyEdge: function(original) {
      return {
        kind: original.kind,
        value: original.value,
        unreachable: original.unreachable,
        from: null,
        to: null
      }
    }
  }

  for (var i = 0; i < edges.length; ++i) {
    vertices.add(edges[i].from)
    vertices.add(edges[i].to)
    if (!incoming.has(edges[i].to)) {
      incoming.set(edges[i].to, new Set())
    }
    incoming.get(edges[i].to).add(edges[i])
    if (!outgoing.has(edges[i].from)) {
      outgoing.set(edges[i].from, new Set())
    }
    outgoing.get(edges[i].from).add(edges[i])
  }

  const simplified = simplifyDAG(vertices, incoming, outgoing, accessors)
  const allEdges = new Set()

  for (const group of simplified.vertices) {
    const incomingEdges = simplified.incoming.get(group) || φ
    const outgoingEdges = simplified.outgoing.get(group) || φ
    const block         = new Block(group)

    for (const edge of incomingEdges) {
      edge.to = block
      allEdges.add(edge)
    }
    for (const edge of outgoingEdges) {
      edge.from = block
      allEdges.add(edge)
    }
  }
  edges.length = 0
  for (const edge of allEdges) {
    edges.push(edge)
  }

  if (edges.length === 0) {
    for (const vertex of simplified.vertices) {
      if (vertex[0].opname() === 'UNREACHABLE') continue
      return [{
        from: null,
        to: new Block(vertex)
      }]
    }
  }

  return edges
}

function Block(ops) {
  this._name = 'B' + (++Block.id)
  this._operations = ops || []
}

Block.id = 0

Block.prototype.human = function() {
  return this._name + ' {\n  ' + this._operations.map(function(xs) {
    return xs.human()
  }).join('\n  ') + '\n}'
}

Block.prototype.pushOp = function(op) {
  return this._operations.push(op)
}

Block.prototype.canSimplify = function() {
  return false
}
