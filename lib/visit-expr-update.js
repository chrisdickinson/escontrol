'use strict'

module.exports = install

var Value = require('./values/value.js')

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

  // TODO: predicates!
  var newValue = new Value(
    this._builtins,
    'number',
    node.operator === '++' ? +oldValue._value + 1 : oldValue._value - 1
  )

  name.assign(newValue)

  this._valueStack.push(node.prefix ? newValue : oldValue)
}
