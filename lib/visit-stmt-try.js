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
  this._connect(this.last(), this._blockStack.current().exit)

  if (node.handlers.length) {
    this._setLastNode(this._blockStack.current().exception)
    this._pushFrame(visitedHandler, node)
    this._pushBlock(node.handlers[0])
    this._scopeStack.push(this._blockStack.current())
    this._scopeStack.declare(node.handlers[0].param.name)
    this._visit(node.handlers[0].body)
  } else if (node.finalizer) {
    this._popBlock()
    this._visit(node.finalizer)
  }
}

function visitedHandler(node) {
  this._scopeStack.pop()
  this._connect(this.last(), this._popBlock().exit)
  this._connect(this.last(), this._blockStack.current().exit)
  this._popBlock()

  if (node.finalizer) {
    this._visit(node.finalizer)
  }
}
