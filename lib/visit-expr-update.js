'use strict'

module.exports = install

var typeOf = require('./types.js')
var Value = require('./value.js')

function install(proto) {
  proto.visitUpdateExpression = visitUpdateExpression
}

function visitUpdateExpression(node) {
  this._pushFrame(visitedArgument, node, true)
  this._visit(node.argument)
}

function visitedArgument(node) {
  this._connect(this.last(), {'operation': node.operator, 'prefix': node.prefix})
  var name = this._valueStack.pop()
  var oldValue = name.value()
  var newValue = applyOperation(oldValue, node.operator)

  name.assign(newValue)

  this._valueStack._values.push(node.prefix ? newValue : oldValue)
}

function applyOperation(value, op) {
  if (value.type() & typeOf.STATIC) {
    return new Value(typeOf.STATIC | typeOf.NUMBER, value.val() + (op === '++' ? 1 : -1))
  }
  return new Value(typeOf.NUMBER)
}
