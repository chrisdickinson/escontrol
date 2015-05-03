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
  const tryBlock = this._popBlock()

  var handler = node.handlers && node.handlers.length ? node.handlers[0] : node.handler
  if (handler) {
    this._setLastNode(tryBlock.exception)
    var context = {node: node, branchID: 0, tryBlock: tryBlock}
    this._pushFrame(visitedHandler, context)
    this._pushBlock(handler)
    this._scopeStack.push(this._currentBlock())
    this._scopeStack.newprop(handler.param.name)
    context.branchID = this._branchOpen()
    this._visit(handler.body)
  } else if (node.finalizer) {
    this._visit(node.finalizer)
  }
}

function visitedHandler(context) {
  var node = context.node
  this._branchEnd(context.branchID)
  this._scopeStack.pop()
  this._connect(this.last(), this._popBlock().exit)
  this._connect(this.last(), context.tryBlock.exit)

  if (node.finalizer) {
    this._visit(node.finalizer)
  }
}
