'use strict'

module.exports = install

function install(proto) {
  proto.visitIfStatement = visitIfStatement
}

function visitIfStatement(node) {
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
  this._connect(this.last(), this._popValue('test'))
  context.testNode = this.last()
  context.branchID = this._branchOpen()
  this._setIfTrue()
  this._pushFrame(visitedConsequent, context)
  this._visit(context.node.consequent)
}

function visitedConsequent(context) {
  context.consequentNode = this.last()
  this._branchEnd(context.branchID)
  if (context.node.alternate) {
    this._setIfFalse()
    context.branchID = this._branchOpen()
    this._setLastNode(context.testNode)
    this._pushFrame(visitedAlternate, context)
    return this._visit(context.node.alternate)
  }

  var block = this._popBlock()

  this._connect(context.consequentNode, block.exit)
  this._setIfFalse()
  this._connect(context.testNode, block.exit)
}

function visitedAlternate(context) {
  this._branchEnd(context.branchID)
  var block = this._popBlock()

  this._connect(this.last(), block.exit)
  this._connect(context.consequentNode, block.exit)
}
