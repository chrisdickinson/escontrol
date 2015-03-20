'use strict'

module.exports = install

var Either = require('./values/either.js')
var Operation = require('../operation.js')

function install(proto) {
  proto.visitLogicalExpression = visitLogicalExpression
}

function visitLogicalExpression(node) {
  this._pushBlock(node)
  this._pushFrame(visitedLHS, node)
  this._visit(node.left)
}

function visitedLHS(node) {
  this._connect(this.last(), new Operation(Operation.kind.TEST, null, null, null))
  var last = this.last()
  node.operator === '&&' ?
    this._setIfFalse() :
    this._setIfTrue()

  this._connect(last, this._currentBlock().exit)
  this._setLastNode(last)

  node.operator === '&&' ?
    this._setIfTrue() :
    this._setIfFalse()
  this._pushFrame(visitedRHS, this._branchOpen())
  this._visit(node.right)
}

function visitedRHS(branchID) {
  this._branchEnd(branchID)
  this._connect(this.last(), this._popBlock().exit)
  var rhs = this._valueStack.pop()
  var lhs = this._valueStack.pop()
  this._valueStack.push(
    Either.of(lhs, rhs)
  )
}
