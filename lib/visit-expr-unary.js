'use strict'

module.exports = install

var Undefined = require('./values/undefined.js')
var Unknown = require('./values/unknown.js')
var Operation = require('../operation.js')
var Value = require('./values/value.js')

combine.operationMap = {
  '!': Operation.kind.NOT,
  '-': Operation.kind.NEG,
  '+': Operation.kind.POS,
  '~': Operation.kind.BINV,
  'void': Operation.kind.VOID,
  'typeof': Operation.kind.TYPEOF,
  'delete': Operation.kind.DELETE
}

function install(proto) {
  proto.visitUnaryExpression = visitUnaryExpression
}

function visitUnaryExpression(node) {
  this._pushFrame(visitedArgument, node)
  this._visit(node.argument)
}

function visitedArgument(node) {

  this._connect(this.last(), new Operation(combine.operationMap[node.operator], null, null, null))
  var lhs = this._valueStack.pop()

  // TODO: handle delete
  // TODO: if value is unknown, then make this a predicate
  this._valueStack.push(combine(this._builtins, lhs.toValue(), node.operator, this.onoperation))
}

function combine(builtins, value, op, onoperation) {
  var result = _combine(builtins, lhs, rhs, op)
  onoperation([value], op, result)
  return result
}

function _combine(builtins, value, op) {
  // TODO: apply operation
  switch(op) {
    case '!':
      return new Value(builtins, 'boolean')
    case '-':
    case '+':
    case '~':
      return new Value(builtins, 'number')
    case 'void':
      return new Undefined()
    case 'typeof':
      return new Value(builtins, 'string')
  }

  return new Unknown(builtins)
}

function applyOperation(value, op) {
  switch(op) {
    case 'typeof': return typeof value
    case '!': return !value
    case '-': return -value
    case '+': return +value
    case '~': return ~value
    case 'void': return
  }
}
