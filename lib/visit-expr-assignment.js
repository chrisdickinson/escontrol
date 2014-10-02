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
  this._connect(this.last(), {operation: 'assign'})
  var rhs = this._valueStack.pop()
  var lhs = this._valueStack.pop()

  if (node.operator === '=') {
    lhs.assign(rhs)
    this._valueStack.push(rhs)

    return
  } else {
    var newValue = combine(this._builtins, lhs.value().toValue(), rhs.toValue(), node.operator.slice(0, -1))

    lhs.assign(newValue)
    this._valueStack.push(rhs)
  }
}
