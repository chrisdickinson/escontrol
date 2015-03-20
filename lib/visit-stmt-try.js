'use strict'

module.exports = install

function install(proto) {
  proto.visitTryStatement = visitTryStatement
}

function visitTryStatement(node) {
  this._pushBlock(node, true, node.finalizer)
  this._pushFrame(visitedTry, node)
  this._visit(node.block)
}

function visitedTry(node) {
  this._connect(this.last(), this._currentBlock().exit)

  if (node.handlers.length) {
    this._setLastNode(this._currentBlock().exception)
    var context = {node: node, branchID: 0}
    this._pushFrame(visitedHandler, context)
    this._pushBlock(node.handlers[0])
    this._scopeStack.push(this._currentBlock())
    this._scopeStack.newprop(node.handlers[0].param.name)
    context.branchID = this._branchOpen()
    this._visit(node.handlers[0].body)
  } else if (node.finalizer) {
    this._popBlock()
    this._visit(node.finalizer)
  }
}

function visitedHandler(context) {
  var node = context.node
  this._branchEnd(context.branchID)
  this._scopeStack.pop()
  this._connect(this.last(), this._popBlock().exit)
  this._connect(this.last(), this._currentBlock().exit)
  this._popBlock()

  if (node.finalizer) {
    this._visit(node.finalizer)
  }
}
