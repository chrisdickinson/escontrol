'use strict'

module.exports = install

var Operation = require('../operation.js')

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

  if (!oldValue) {
    oldValue = this.makeUnknown()
    name.assign(oldValue)
  }

  oldValue = oldValue.toValue()
  var newValue = this.makeValue('number')

  name.assign(newValue)

  this._valueStack.push(node.prefix ? newValue : oldValue)
}
