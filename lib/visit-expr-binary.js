'use strict'

module.exports = install

var combine = require('./combine-values.js')

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
    operation: combine.operationMap[node.operator]
  })

  var rhs = this._valueStack.pop().toValue()
  var lhs = this._valueStack.pop().toValue()
  // TODO: add check for "isUnknown | isEither",
  // if true, then create a Predicate value
  // otherwise... do what's here.
  this._valueStack.push(combine(this._builtins, lhs, rhs, node.operator))
}
