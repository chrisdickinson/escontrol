'use strict'

module.exports = install

var typeOf = require('./types.js')
var Value = require('./value.js')

function install(proto) {
  proto.visitUnaryExpression = visitUnaryExpression
}

function visitUnaryExpression(node) {
  this._pushFrame(visitedArgument, node)
  this._visit(node.argument)
}

function visitedArgument(node) {
  var lhs = this._valueStack.pop()
  var value = combine(lhs.toValue(), node.operator)

  this._connect(this.last(), {
    operation: 'unary ' + node.operator,
    value: value
  })
  this._valueStack.push(value)
}

function combine(lhs, op) {
  var newType = getTypes(op) | (lhs.type & typeOf.STATIC ? typeOf.STATIC : 0)
  var value = null

  if (newType & typeOf.STATIC) {
    value = applyOperation(lhs.staticValue, op)
  }

  return new Value(newType, value)
}

function getTypes(op) {
  switch(op) {
    case '!':
      return typeOf.BOOLEAN
    case '-':
    case '+':
    case '~':
      return typeOf.NUMBER
    case 'void':
      return typeOf.UNDEFINED
    case 'typeof':
      return typeOf.STRING
  }

  return typeOf.ANY
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
