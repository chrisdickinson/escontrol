'use strict'

module.exports = install

var ObjectValue = require('./object.js')

function install(proto) {
  proto.visitConditionalExpression = visitConditionalExpression
}

function visitConditionalExpression(node) {
  this._pushBlock(node)
  this._pushFrame(visitedTest, {
    node: node,
    consequentNode: null,
    testNode: null
  })
  this._visit(node.test)
}

function visitedTest(context) {
  this._connect(this.last(), this._popValue())
  context.testNode = this.last()

  this._setIfTrue()
  this._pushFrame(visitedConsequent, context)
  this._visit(context.node.consequent)
}

function visitedConsequent(context) {
  var last = this.last()

  this._connect(this.last(), this._blockStack.current().exit)

  this._connect(context.consequentNode, block.exit)
  context.consequentNode = this.last()

  this._setIfFalse()
  this._setLastNode(context.testNode)
  this._pushFrame(visitedAlternate, context)
  return this._visit(context.node.alternate)
}

function visitedAlternate(context) {
  var block = this._popBlock()

  this._connect(this.last(), block.exit)

  var ifFalse = this._valueStack.pop()
  var ifTrue = this._valueStack.pop()

  this._valueStack._values.push(
    ObjectValue.createUnknown(ifFalse.type() | ifTrue.type())
  )
}
