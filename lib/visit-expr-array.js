module.exports = install

function install(proto) {
  proto.visitArrayExpression = visitArrayExpression
}

function visitArrayExpression(node) {
  this._pushFrame(iterateArray, {
    node: node,
    index: 0
  })
}

function iterateArray(context) {
  if (context.index === context.node.elements.length) {
    this._connect(this.last(), this._createArrayNode(context.node.elements.length))

    return
  }

  if (!context.node.elements[context.index]) {
    this._valueStack.pushHole()
    ++context.index
    this._pushFrame(iterateArray, context)

    return
  }

  this._pushFrame(iteratedElement, context)
  this._visit(context.node.elements[context.index++])
}

function iteratedElement(context) {
  // erase the value traveling on this edge...
  this._edges[this._edges.length - 1].value = void 0
  iterateArray.call(this, context)
}
