'use strict'

module.exports = install

var Operation = require('../operation.js')
var Value = require('./values/value.js')

function install(proto) {
  proto.visitUpdateExpression = visitUpdateExpression
}

function visitUpdateExpression(node) {
  this._pushFrame(visitedArgument, node, true)
  this._visit(node.argument)
}

function visitedArgument(node) {
  var opcode = [
    {'++': Operation.kind.PREINCR, '--': Operation.kind.PREDECR},
    {'++': Operation.kind.POSTINCR, '--': Operation.kind.POSTDECR},
  ][+node.prefix][node.operator]

  this._connect(this.last(), new Operation(opcode, null, null, null))

  var name = this._valueStack.pop()
  var oldValue = name.value()

  // TODO: predicates!
  var newValue = new Value(
    this._builtins,
    'number',
    node.operator === '++' ? +oldValue._value + 1 : oldValue._value - 1
  )

  name.assign(newValue)

  this._valueStack.push(node.prefix ? newValue : oldValue)
}
