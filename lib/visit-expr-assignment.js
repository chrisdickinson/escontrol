'use strict'

module.exports = install

var combine = require('./combine-values.js')
var Operation = require('../operation.js')

function install(proto) {
  proto.visitAssignmentExpression = visitAssignmentExpression
}

function visitAssignmentExpression(node) {
  if (node.left.type !== 'Identifier' && node.left.type !== 'MemberExpression') {
    this._throwException('ReferenceError', 'invalid left hand side')

    return
  }

  this._pushFrame(visitedLeft, node, true)
  this._visit(node.left)
}

function visitedLeft(node) {
  this._pushFrame(visitedRight, node)
  this._visit(node.right)
}

function visitedRight(node) {
  var lhs = null
  var rhs = null
  var op = ''

  if (node.operator === '=') {
    rhs = this._valueStack.pop()
    lhs = this._valueStack.pop()

    if (node.right.type === 'FunctionExpression' || node.right.type === 'ArrowExpression') {
      if (!node.right.id) {
        reviseName(node.left, rhs)
      }
    }
    this._connect(this.last(), new Operation(Operation.kind.STORE_VALUE, lhs._name, null, null))
    lhs.assign(rhs)
    this._valueStack.push(rhs)
    return
  }

  op = node.operator.slice(0, -1)
  this._connect(this.last(), new Operation(combine.operationMap[op], null, null, null))
  rhs = this._valueStack.pop()
  lhs = this._valueStack.pop()

  if (!lhs.value()) {
    lhs.assign(this.makeUndefined())
  }
  var newValue = combine(this._builtins, lhs.value().toValue(), rhs.toValue(), node.operator.slice(0, -1), this.onoperation)

  lhs.assign(newValue)
  this._valueStack.push(rhs)
  this._connect(this.last(), new Operation(Operation.kind.STORE_VALUE, lhs._name, null, null))
}

function reviseName(targetNameAST, functionValue) {
  var values = []
  while (targetNameAST.type === 'MemberExpression') {
    if (values.length > 3) return
    if (targetNameAST.computed) return
    values.unshift(targetNameAST.property.name)
    targetNameAST = targetNameAST.object
  }
  if (targetNameAST.type === 'Identifier') {
    functionValue._name = targetNameAST.name + '.' + values.join('.')
  }
}
