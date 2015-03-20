'use strict'

module.exports = install

var Operation = require('../operation.js')

function install(proto) {
  proto.visitDoWhileStatement = visitDoWhileStatement
}

function visitDoWhileStatement(node) {
  this._pushBlock(node)
  this._pushFrame(visitedBody, node)
  this._visit(node.body)
}

function visitedBody(node) {
  this._pushFrame(visitedTest, node)
  this._visit(node.test)
}

function visitedTest(node) {
  this._connect(this.last(), this._popValue(Operation.kind.TEST))
  var last = this.last()

  this._setIfFalse()
  this._connect(this.last(), this._currentBlock().exit)

  this._setIfTrue()
  this._connect(last, this._currentBlock().enter)
  this._setLastNode(this._popBlock().exit)
}

