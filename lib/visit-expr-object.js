module.exports = install

function install(proto) {
  proto.visitObjectExpression = visitObjectExpression
}

// node.properties[i].{key,value,kind="init,get,set"}
function visitObjectExpression(node) {
  this._pushFrame(iterateObject, {
    node: node,
    index: 0
  })
}

function iterateObject(context) {
  if (context.index === context.node.properties.length) {
    this._connect(this.last(), this._createObjectNode())

    return
  }

  var current = context.node.properties[context.index++]

  this._valueStack.pushKey(current.key.value || current.key.name)
  this._pushFrame(iteratedPair, context)
  this._visit(current.value)
}

function iteratedPair(context) {
  // erase the value traveling on this edge...
  this._edges[this._edges.length - 1].value = void 0
  iterateObject.call(this, context)
}
