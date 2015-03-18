'use strict'

module.exports = install

function install(proto) {
  proto.visitObjectExpression = visitObjectExpression
}

// node.properties[i].{key,value,kind="init,get,set"}
function visitObjectExpression(node) {
  this._valueStack.fence()
  this._pushFrame(iterateObject, {
    node: node,
    index: 0
  })
}

function iterateObject(context) {
  if (context.index === context.node.properties.length) {
    this._connect(this.last(), this._createObjectNode(context.node.properties.length))
    this._valueStack.unfence()
    return
  }

  var current = context.node.properties[context.index++]

  context.last = this._valueStack._values.length
  if (typeof current.key.value === 'undefined') {
    this._valueStack.push(current.key.name)
  } else {
    this._valueStack.push(current.key.value)
  }
  this._pushFrame(iterateObject, context)
  this._visit(current.value)
}
