'use strict'

var Operation = require('../operation.js')

module.exports = install

function install(proto) {
  proto.visitForStatement = visitForStatement
}

function visitForStatement(node) {
  this._pushBlock(node) 
  this._pushFrame(visitedInit, {values: this._valueStack._values.length, node: node})
  if (node.init) {
    this._visit(node.init)
  }
}

function visitedInit(context) {
  var node = context.node
  var len = context.values
  if (this._valueStack._values.length !== len) {
    this._connect(this.last(), this._popValue())
  }

  this._pushFrame(visitedTest, {
    testEdgeIdx: this._edges.length,
    branchID: 0,
    node: node,
    values: this._valueStack._values.length
  })

  if (node.test) {
    this._visit(node.test)
  }
}

function visitedTest(context) {
  if (this._valueStack._values.length !== context.values) {
    this._connect(this.last(), this._popValue(Operation.kind.TEST))
  }
  var last = this.last()

  this._setIfFalse()
  this._connect(this.last(), this._blockStack.current().exit)
  this._setLastNode(last)

  this._setIfTrue()
  context.branchID = this._branchOpen()
  this._pushFrame(visitedBlock, context)
  this._visit(context.node.body)
}

function visitedBlock(context) {
  this._pushFrame(visitedUpdate, context)

  context.values = this._valueStack._values.length
  if (context.node.update) {
    this._visit(context.node.update)
  }
}

function visitedUpdate(context) {
  if (this._valueStack._values.length !== context.values) {
    this._connect(this.last(), this._popValue())
  }

  this._branchEnd(context.branchID)
  this._setBackedge()
  this._connect(this.last(), this._edges[context.testEdgeIdx].to)
  this._setLastNode(this._popBlock().exit)
}
