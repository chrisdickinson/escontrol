'use strict'

module.exports = install

var Either = require('./values/either.js')
var Value = require('./values/value.js')

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
  this._connect(this.last(), {
    operation: node.operator
  })

  var rhs = this._valueStack.pop().toValue()
  var lhs = this._valueStack.pop().toValue()
  // TODO: add check for "isUnknown | isEither",
  // if true, then create a Predicate value
  // otherwise... do what's here.
  this._valueStack.push(combine(this._builtins, lhs, rhs, node.operator))
}

function combine(builtins, lhs, rhs, op) {
  // TODO: make it actually statically apply the values.
  switch (op) {
    case '+':
      return new Value(builtins, lhs.isString() || rhs.isString() ? 'string' : 'number')

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
      return new Value(builtins, 'number')

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
      return new Value(builtins, 'boolean')
    case '&&':
    case '||':
      return new Either(lhs, rhs)
  }
}
