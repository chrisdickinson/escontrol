module.exports = simplify

function simplify(edges) {
  while(true) {
    var startIdx = 0
    var len = edges.length

    while (startIdx < len && edges[startIdx].from instanceof Block) ++startIdx
    if (startIdx === edges.length) break

    var block = new Block([edges[startIdx].from])
    var currentEdge = edges[startIdx]
    var currentNode = currentEdge.from

    for(var i = 0, len = edges.length; i < len; ++i) {
      if (edges[i].from === currentNode) {
        edges[i].from = block
      }
      if (edges[i].to === currentNode) {
        edges[i].to = block
      }
    }

    var lastNode = currentNode

    var currentEdgeIdx = startIdx
    var skip = true
    currentNode = currentEdge.to
    while(lastNode.canSimplify() && currentNode.canSimplify()) {
      block.pushOp(currentNode)
      lastNode = currentNode
      edges.splice(currentEdgeIdx, 1)

      for(var i = 0, len = edges.length; i < len; ++i) {
        if (edges[i].from === currentNode) {
          currentEdge = edges[i]
          edges[i].from = block
          currentNode = edges[i].to
          currentEdgeIdx = i
          break
        }
      }

      if (i === len) {
        break
      }

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
