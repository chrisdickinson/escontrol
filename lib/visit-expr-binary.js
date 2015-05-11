'use strict'

module.exports = install

var combine = require('./combine-values.js')
var Operation = require('../operation.js')

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
  var rhs = this._valueStack.pop()
  var lhs = this._valueStack.pop()
  var rhsHCID = new Set(rhs.getHCID())
  var lhsHCID = new Set(lhs.getHCID())
  this._connect(this.last(), new Operation(
    combine.operationMap[node.operator], lhsHCID, rhsHCID, null))
  rhs = rhs.toValue()
  lhs = lhs.toValue()
  // TODO: add check for "isUnknown | isEither",
  // if true, then create a Predicate value
  // otherwise... do what's here.
  this._valueStack.push(combine(this, lhs, rhs, node.operator))
}
