'use strict'

module.exports = install

function install(proto) {
  proto.visitProgram = visitProgram
}

function visitProgram(node) {
  this._pushBlock(node)
  this._pushFrame(iterateProgram, {
    node: node,
    index: 0
  })
  // hoist all definitions
  this._hoist(node)
}

function iterateProgram(context) {
  if (context.index === context.node.body.length) {
    return this._connect(this.last(), this._popBlock().exit)
  }

  this._pushFrame(iterateProgram, context)
  this._visit(context.node.body[context.index++])
}
