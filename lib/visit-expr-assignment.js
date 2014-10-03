'use strict'

module.exports = install

var combine = require('./combine-values.js')

function install(proto) {
  proto.visitAssignmentExpression = visitAssignmentExpression
}

function visitAssignmentExpression(node) {
  if (node.left.type !== 'Identifier' && node.left.type !== 'MemberExpression') {
    this._connect(this.last(), {operation: 'reference-error'})
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
    this._connect(this.last(), {operation: 'store-value', name: lhs._name})
    lhs.assign(rhs)
    this._valueStack.push(rhs)
    return
  }

  op = node.operator.slice(0, -1)
  this._connect(this.last(), {operation: combine.operationMap[op]})
  rhs = this._valueStack.pop()
  lhs = this._valueStack.pop()

  console.error('???', lhs, this._valueStack._values)
  var newValue = combine(this._builtins, lhs.value().toValue(), rhs.toValue(), node.operator.slice(0, -1))

  lhs.assign(newValue)
  this._valueStack.push(rhs)
  this._connect(this.last(), {operation: 'store-value', name: lhs._name})
}
