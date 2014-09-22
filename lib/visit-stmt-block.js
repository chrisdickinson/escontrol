'use strict'

module.exports = install

function install(proto) {
  proto.visitBlock = visitBlock
}

function visitBlock(node) {
  this._pushBlock(node)
  this._scopeStack.push(node)
  this._pushFrame(iterateBlock, {
    node: node,
    index: 0
  })
}

function iterateBlock(context) {
  if (context.index === context.node.body.length) {
    this._scopeStack.pop()

    return this._connect(this.last(), this._popBlock().exit)
  }

  this._pushFrame(iterateBlock, context)
  this._visit(context.node.body[context.index++])
}
