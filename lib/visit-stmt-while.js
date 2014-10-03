'use strict'

module.exports = install

function install(proto) {
  proto.visitWhileStatement = visitWhileStatement
}

function visitWhileStatement(node) {
  this._pushBlock(node)
  this._pushFrame(visitedTest, {
    testEdgeIdx: this._edges.length,
    branchID: 0,
    node: node
  })
  this._visit(node.test)
}

function visitedTest(context) {
  this._connect(this.last(), this._popValue())
  var fromTest = this.last()
  this._setIfFalse()
  this._connect(fromTest, this._blockStack.current().exit)
  this._setIfTrue()
  this._pushFrame(visitedBody, context)
  context.branchID = this._branchOpen()

  this._setLastNode(fromTest)
  this._visit(context.node.body)
}

function visitedBody(context) {
  this._branchEnd(context.branchID)
  this._setBackedge()
  this._connect(this.last(), this._edges[context.testEdgeIdx].to)
  this._setLastNode(this._popBlock().exit)
}
