'use strict'

module.exports = install

var Either = require('./values/either.js')
var Operation = require('../operation.js')

function install(proto) {
  proto.visitConditionalExpression = visitConditionalExpression
}

function visitConditionalExpression(node) {
  this._pushBlock(node)
  this._pushFrame(visitedTest, {
    node: node,
    consequentNode: null,
    branchID: 0,
    testNode: null
  })
  this._visit(node.test)
}

function visitedTest(context) {
  this._connect(this.last(), this._popValue(Operation.kind.TEST))
  context.testNode = this.last()
  context.branchID = this._branchOpen()

  this._setIfTrue()
  this._pushFrame(visitedConsequent, context)
  this._visit(context.node.consequent)
}

function visitedConsequent(context) {
  context.consequentNode = this.last()
  this._branchEnd(context.branchID)
  this._setIfFalse()
  context.branchID = this._branchOpen()
  this._setLastNode(context.testNode)
  this._pushFrame(visitedAlternate, context)
  return this._visit(context.node.alternate)
}

function visitedAlternate(context) {
  this._branchEnd(context.branchID)
  var block = this._popBlock()

  this._connect(this.last(), block.exit)
  this._connect(context.consequentNode, block.exit)

  var ifFalse = this._valueStack.pop()
  var ifTrue = this._valueStack.pop()

  this._valueStack.push(
    new Either(ifTrue, ifFalse)
  )
}
