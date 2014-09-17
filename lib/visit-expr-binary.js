'use strict'

module.exports = install

var typeOf = require('./types.js')
var Value = require('./value.js')

function install(proto) {
  proto.visitBinaryExpression = visitBinaryExpression
}

function visitBinaryExpression(node) {
  this._pushFrame(visitedLeft, node)
  this._visit(node.left)
}

function visitedLeft(node) {
  this._pushFrame(visitedRight, node)
  this._visit(node.right)
}

function visitedRight(node) {
  var rhs = this._valueStack.pop().toValue()
  var lhs = this._valueStack.pop().toValue()
  var value = combine(lhs, rhs, node.operator)

  this._connect(this.last(), {
    operation: node.operator,
    value: value
  })
  this._valueStack.push(value)
}

function combine(lhs, rhs, op) {
  var mask = lhs.type | rhs.type
  var newType = getTypes(mask, op) | (mask & typeOf.STATIC ? typeOf.STATIC :  0)
  var value = null

  if (newType & typeOf.STATIC) {
    value = applyOperation(lhs.staticValue, rhs.staticValue, op)
  }

  return new Value(newType, value)
}

function applyOperation(lhs, rhs, operation) {
  return Function('lhs', 'rhs', 'return lhs ' + operation + 'rhs')(lhs, rhs)
}

function getTypes(mask, op) {
  switch (op) {
    case '+':
      return mask & typeOf.STRING ? typeOf.STRING : typeOf.NUMBER

    case '-':
    case '++':
    case '--':
    case '~':
    case '&':
    case '^':
    case '|':
    case '*':
    case '/':
    case '%':
    case '<<':
    case '>>':
    case '>>>':
      return typeOf.NUMBER

    case '==':
    case '!=':
    case '===':
    case '!==':
    case '>=':
    case '<=':
    case '>':
    case '<':
    case 'in':
    case 'delete':
    case 'instanceof':
      return typeOf.BOOLEAN
    case '&&':
    case '||':
      return mask
  }
}
