'use strict'

module.exports = install

var Operation = require('../operation.js')

function install(proto) {
  proto.visitFunctionExpression = visitFunctionExpression
}

function visitFunctionExpression(node) {
  var fnValue = this.makeFunction(null, null, null, node, this._scopeStack.current())
  this._connect(this.last(), new Operation(Operation.kind.CREATE_FUNCTION, null, null, null))
  this._valueStack.push(fnValue)
  this.onfunction(fnValue, node)

  return fnValue
}
