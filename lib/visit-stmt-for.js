'use strict'

module.exports = install

function install(proto) {
  proto.visitForStatement = visitForStatement
}

function visitForStatement(node) {
  this._pushBlock(node) 
  this._pushFrame(visitedInit, node)
  this._visit(node.init)
}

function visitedInit(node) {
  if (this._valueStack.current()) {
    this._connect(this.last(), this._popValue())
  }

  this._pushFrame(visitedTest, {
    testEdgeIdx: this._edges.length,
    node: node
  })
  this._visit(node.test)
}

function visitedTest(context) {
  if (this._valueStack.current()) {
    this._connect(this.last(), this._popValue())
  }
  var last = this.last()

  this._setIfFalse()
  this._connect(this.last(), this._blockStack.current().exit)
  this._setLastNode(last)

  this._setIfTrue()
  this._pushFrame(visitedBlock, context)
  this._visit(context.node.body)
}

function visitedBlock(context) {
  this._pushFrame(visitedUpdate, context)
  this._visit(context.node.update)
}

function visitedUpdate(context) {
  if (this._valueStack.current()) {
    this._connect(this.last(), this._popValue())
  }

  this._connect(this.last(), this._edges[context.testEdgeIdx].to)
  this._setLastNode(this._popBlock().exit)
}
